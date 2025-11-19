from datetime import datetime
from typing import List
import os
from uuid import uuid4

from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File
from sqlalchemy.orm import Session

from app.database import get_db
from app.api.auth import get_current_user
from app.models.user import User, RoleEnum
from app.models.support import (
    SupportTicket,
    SupportMessage,
    TicketStatus,
    TicketPriority,
    MessageType,
)
from app.schemas.support import (
    TicketCreate,
    TicketSummary,
    AdminTicketSummary,
    MessageCreate,
    MessageResponse,
    TicketStatusUpdate,
    TicketAssign,
)

router = APIRouter(prefix="/api/support", tags=["support"])


ATTACHMENTS_ROOT = os.path.join(os.path.dirname(__file__), "..", "static", "support_attachments")
os.makedirs(ATTACHMENTS_ROOT, exist_ok=True)


def _message_to_response(m: SupportMessage) -> MessageResponse:
  return MessageResponse(
      id=m.id,
      ticket_id=m.ticket_id,
      sender_id=m.sender_id,
      message_type=m.message_type.value if isinstance(m.message_type, MessageType) else str(m.message_type),
      content=m.content,
      attachments=m.attachments,
      timestamp=m.timestamp,
      is_read=m.is_read,
  )


def _ticket_to_summary(ticket: SupportTicket, messages: List[SupportMessage], current_user: User) -> TicketSummary:
  last_message_at = messages[-1].timestamp if messages else None
  unread = 0
  for m in messages:
      if m.sender_id != current_user.id and not m.is_read:
          unread += 1
  return TicketSummary(
      id=ticket.id,
      subject=ticket.subject,
      status=ticket.status.value if isinstance(ticket.status, TicketStatus) else str(ticket.status),
      priority=ticket.priority.value if isinstance(ticket.priority, TicketPriority) else str(ticket.priority),
      created_at=ticket.created_at,
      last_message_at=last_message_at,
      unread_count=unread,
  )


def _ticket_to_admin_summary(ticket: SupportTicket, messages: List[SupportMessage], viewer: User) -> AdminTicketSummary:
  base = _ticket_to_summary(ticket, messages, viewer)
  return AdminTicketSummary(
      id=base.id,
      subject=base.subject,
      status=base.status,
      priority=base.priority,
      created_at=base.created_at,
      last_message_at=base.last_message_at,
      unread_count=base.unread_count,
      user_id=ticket.user_id,
      user_email=ticket.user.email if ticket.user else "",
      user_username=ticket.user.username if ticket.user else "",
      assigned_to_id=ticket.assigned_to,
      assigned_to_username=ticket.assignee.username if ticket.assignee else None,
  )


@router.post("/tickets")
def create_ticket(
    payload: TicketCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
  subject = payload.subject.strip()
  if not subject:
      raise HTTPException(status_code=400, detail="Subject is required")

  try:
      priority = TicketPriority(payload.priority)
  except ValueError:
      raise HTTPException(status_code=400, detail="Invalid priority")

  ticket = SupportTicket(
      user_id=current_user.id,
      subject=subject,
      priority=priority,
      status=TicketStatus.open,
  )
  db.add(ticket)
  db.flush()

  messages: List[SupportMessage] = []
  if payload.initial_message and payload.initial_message.strip():
      msg = SupportMessage(
          ticket_id=ticket.id,
          sender_id=current_user.id,
          message_type=MessageType.user,
          content=payload.initial_message.strip(),
      )
      db.add(msg)
      messages.append(msg)

  db.commit()
  db.refresh(ticket)

  # Reload messages with timestamps from DB
  if not messages:
      messages = (
          db.query(SupportMessage)
          .filter(SupportMessage.ticket_id == ticket.id)
          .order_by(SupportMessage.timestamp.asc())
          .all()
      )

  summary = _ticket_to_summary(ticket, messages, current_user)
  return {
      "ticket": summary,
      "messages": [_message_to_response(m) for m in messages],
  }


@router.get("/tickets", response_model=list[TicketSummary])
def list_my_tickets(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
  tickets = (
      db.query(SupportTicket)
      .filter(SupportTicket.user_id == current_user.id)
      .order_by(SupportTicket.created_at.desc())
      .all()
  )

  summaries: List[TicketSummary] = []
  for t in tickets:
      msgs = (
          db.query(SupportMessage)
          .filter(SupportMessage.ticket_id == t.id)
          .order_by(SupportMessage.timestamp.asc())
          .all()
      )
      summaries.append(_ticket_to_summary(t, msgs, current_user))
  return summaries


@router.get("/tickets/{ticket_id}/messages", response_model=list[MessageResponse])
def get_ticket_messages(
    ticket_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
  ticket = db.query(SupportTicket).filter(SupportTicket.id == ticket_id).first()
  if not ticket:
      raise HTTPException(status_code=404, detail="Ticket not found")

  is_owner = ticket.user_id == current_user.id
  is_staff = current_user.role in (RoleEnum.admin, RoleEnum.account_manager)
  if not (is_owner or is_staff):
      raise HTTPException(status_code=403, detail="Not allowed to view this ticket")

  messages = (
      db.query(SupportMessage)
      .filter(SupportMessage.ticket_id == ticket.id)
      .order_by(SupportMessage.timestamp.asc())
      .all()
  )

  # Mark messages from others as read
  changed = False
  for m in messages:
      if m.sender_id != current_user.id and not m.is_read:
          m.is_read = True
          changed = True
  if changed:
      db.commit()

  return [_message_to_response(m) for m in messages]


@router.post("/messages", response_model=MessageResponse)
def send_message(
    payload: MessageCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
  ticket = db.query(SupportTicket).filter(SupportTicket.id == payload.ticket_id).first()
  if not ticket:
      raise HTTPException(status_code=404, detail="Ticket not found")

  is_owner = ticket.user_id == current_user.id
  is_staff = current_user.role in (RoleEnum.admin, RoleEnum.account_manager)
  if not (is_owner or is_staff):
      raise HTTPException(status_code=403, detail="Not allowed to reply to this ticket")

  msg_type = MessageType.user if is_owner else MessageType.agent

  if not payload.content or not payload.content.strip():
      raise HTTPException(status_code=400, detail="Message content is required")

  message = SupportMessage(
      ticket_id=ticket.id,
      sender_id=current_user.id,
      message_type=msg_type,
      content=payload.content.strip(),
  )
  db.add(message)
  db.commit()
  db.refresh(message)
  return _message_to_response(message)


@router.post("/messages/{ticket_id}/attachments", response_model=MessageResponse)
async def upload_attachment(
    ticket_id: int,
    file: UploadFile = File(...),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
  ticket = db.query(SupportTicket).filter(SupportTicket.id == ticket_id).first()
  if not ticket:
      raise HTTPException(status_code=404, detail="Ticket not found")

  is_owner = ticket.user_id == current_user.id
  is_staff = current_user.role in (RoleEnum.admin, RoleEnum.account_manager)
  if not (is_owner or is_staff):
      raise HTTPException(status_code=403, detail="Not allowed to reply to this ticket")

  if not file or not file.filename:
      raise HTTPException(status_code=400, detail="No file uploaded")

  ticket_dir = os.path.join(ATTACHMENTS_ROOT, str(ticket.id))
  os.makedirs(ticket_dir, exist_ok=True)

  original_name = file.filename
  _, ext = os.path.splitext(original_name)
  safe_name = f"{uuid4().hex}{ext}"
  disk_path = os.path.join(ticket_dir, safe_name)

  contents = await file.read()
  try:
      with open(disk_path, "wb") as f:
          f.write(contents)
  except OSError:
      raise HTTPException(status_code=500, detail="Failed to store attachment")

  relative_url = f"/static/support_attachments/{ticket.id}/{safe_name}"
  msg_type = MessageType.user if is_owner else MessageType.agent

  message = SupportMessage(
      ticket_id=ticket.id,
      sender_id=current_user.id,
      message_type=msg_type,
      content=original_name or "Attachment",
      attachments=relative_url,
  )
  db.add(message)
  db.commit()
  db.refresh(message)
  return _message_to_response(message)


@router.get("/admin/tickets", response_model=list[AdminTicketSummary])
def admin_list_tickets(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
  if current_user.role not in (RoleEnum.admin, RoleEnum.account_manager):
      raise HTTPException(status_code=403, detail="Not allowed")

  tickets = (
      db.query(SupportTicket)
      .order_by(SupportTicket.created_at.desc())
      .all()
  )

  summaries: List[AdminTicketSummary] = []
  for t in tickets:
      msgs = (
          db.query(SupportMessage)
          .filter(SupportMessage.ticket_id == t.id)
          .order_by(SupportMessage.timestamp.asc())
          .all()
      )
      summaries.append(_ticket_to_admin_summary(t, msgs, current_user))
  return summaries


@router.put("/admin/tickets/{ticket_id}/status", response_model=AdminTicketSummary)
def admin_update_ticket_status(
    ticket_id: int,
    payload: TicketStatusUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
  if current_user.role not in (RoleEnum.admin, RoleEnum.account_manager):
      raise HTTPException(status_code=403, detail="Not allowed")

  ticket = db.query(SupportTicket).filter(SupportTicket.id == ticket_id).first()
  if not ticket:
      raise HTTPException(status_code=404, detail="Ticket not found")

  try:
      new_status = TicketStatus(payload.status)
  except ValueError:
      raise HTTPException(status_code=400, detail="Invalid status")

  ticket.status = new_status
  db.add(ticket)
  db.commit()
  db.refresh(ticket)

  msgs = (
      db.query(SupportMessage)
      .filter(SupportMessage.ticket_id == ticket.id)
      .order_by(SupportMessage.timestamp.asc())
      .all()
  )
  return _ticket_to_admin_summary(ticket, msgs, current_user)


@router.post("/admin/tickets/{ticket_id}/assign", response_model=AdminTicketSummary)
def admin_assign_ticket(
    ticket_id: int,
    payload: TicketAssign,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
  if current_user.role not in (RoleEnum.admin, RoleEnum.account_manager):
      raise HTTPException(status_code=403, detail="Not allowed")

  ticket = db.query(SupportTicket).filter(SupportTicket.id == ticket_id).first()
  if not ticket:
      raise HTTPException(status_code=404, detail="Ticket not found")

  if payload.assigned_to_id is None:
      # Toggle assignment to the current user
      if ticket.assigned_to == current_user.id:
          ticket.assigned_to = None
      else:
          ticket.assigned_to = current_user.id
  else:
      assignee = db.query(User).filter(User.id == payload.assigned_to_id).first()
      if not assignee:
          raise HTTPException(status_code=404, detail="Assignee user not found")
      ticket.assigned_to = assignee.id

  db.add(ticket)
  db.commit()
  db.refresh(ticket)

  msgs = (
      db.query(SupportMessage)
      .filter(SupportMessage.ticket_id == ticket.id)
      .order_by(SupportMessage.timestamp.asc())
      .all()
  )
  return _ticket_to_admin_summary(ticket, msgs, current_user)
