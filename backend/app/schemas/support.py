from datetime import datetime
from typing import Optional, Literal

from pydantic import BaseModel


class TicketCreate(BaseModel):
    subject: str
    priority: Literal["low", "medium", "high", "critical"] = "medium"
    initial_message: Optional[str] = None


class TicketSummary(BaseModel):
    id: int
    subject: str
    status: str
    priority: str
    created_at: datetime
    last_message_at: Optional[datetime] = None
    unread_count: int = 0

    class Config:
        from_attributes = True


class AdminTicketSummary(TicketSummary):
    user_id: int
    user_email: str
    user_username: str
    assigned_to_id: Optional[int] = None
    assigned_to_username: Optional[str] = None


class MessageCreate(BaseModel):
    ticket_id: int
    content: str


class MessageResponse(BaseModel):
    id: int
    ticket_id: int
    sender_id: Optional[int]
    message_type: str
    content: str
    attachments: Optional[str] = None
    timestamp: datetime
    is_read: bool

    class Config:
        from_attributes = True


class TicketStatusUpdate(BaseModel):
    status: Literal["open", "in_progress", "resolved", "closed"]


class TicketAssign(BaseModel):
    assigned_to_id: Optional[int] = None
