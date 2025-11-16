from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.database import get_db
from app.api.auth import get_current_user
from app.models.user import User, RoleEnum
from app.schemas.contact import ContactCreate, ContactResponse
from app.schemas.support import SupportMessageCreate, SupportMessageResponse, SupportReplyCreate, SupportReplyResponse
from app.models.support import SupportMessage, SupportReply
from app.api.auth import require_roles

router = APIRouter(prefix="/api/support", tags=["support"])

@router.post("/", response_model=SupportMessageResponse, status_code=status.HTTP_201_CREATED)
def send_support_message(payload: SupportMessageCreate, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    message = SupportMessage(user_id=current_user.id, subject=payload.subject, message=payload.message)
    db.add(message)
    db.commit()
    db.refresh(message)
    return SupportMessageResponse(
        id=message.id,
        user_id=message.user_id,
        subject=message.subject,
        message=message.message,
        created_at=message.created_at
    )

@router.get("/", response_model=list[SupportMessageResponse])
async def get_all_support_messages(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles([RoleEnum.admin, RoleEnum.support]))
):
    messages = db.query(SupportMessage).all()
    return messages

@router.get("/my/messages", response_model=list[SupportMessageResponse])
def get_my_support_messages(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    messages = db.query(SupportMessage).filter(SupportMessage.user_id == current_user.id).all()
    return messages

@router.get("/my/messages/{message_id}/replies", response_model=list[SupportReplyResponse])
def get_replies_for_my_message(message_id: int, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    support_message = db.query(SupportMessage).filter(SupportMessage.id == message_id, SupportMessage.user_id == current_user.id).first()
    if not support_message:
        raise HTTPException(status_code=404, detail="Message not found")
    replies = db.query(SupportReply).filter(SupportReply.support_message_id == message_id).all()
    return replies

@router.post("/{message_id}/reply", response_model=SupportReplyResponse, status_code=status.HTTP_201_CREATED)
def reply_to_support_message(
    message_id: int,
    payload: SupportReplyCreate,
    current_user: User = Depends(require_roles([RoleEnum.admin, RoleEnum.support])),
    db: Session = Depends(get_db),
):
    support_message = db.query(SupportMessage).filter(SupportMessage.id == message_id).first()
    if not support_message:
        raise HTTPException(status_code=404, detail="Message not found")
    reply = SupportReply(support_message_id=message_id, responder_id=current_user.id, message=payload.message)
    db.add(reply)
    db.commit()
    db.refresh(reply)
    return reply
