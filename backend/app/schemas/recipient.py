from datetime import datetime
from typing import Optional

from pydantic import BaseModel


class RecipientBase(BaseModel):
    lookup: str  # username, email, or phone
    nickname: Optional[str] = None


class RecipientCreate(RecipientBase):
    pass


class RecipientUpdate(BaseModel):
    nickname: Optional[str] = None


class RecipientVerifyRequest(BaseModel):
    lookup: str


class RecipientResponse(BaseModel):
    id: int
    user_id: int
    recipient_id: int
    username: str
    email: str
    phone_number: Optional[str]
    nickname: Optional[str]
    saved_at: datetime
    is_verified: bool = True

    class Config:
        from_attributes = True
