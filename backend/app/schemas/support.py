from datetime import datetime
from pydantic import BaseModel

class SupportMessageBase(BaseModel):
    subject: str
    message: str

class SupportMessageCreate(SupportMessageBase):
    pass

class SupportMessageResponse(SupportMessageBase):
    id: int
    user_id: int
    created_at: datetime

    class Config:
        orm_mode = True


class SupportReplyCreate(BaseModel):
    message: str


class SupportReplyResponse(BaseModel):
    id: int
    support_message_id: int
    responder_id: int
    message: str
    created_at: datetime

    class Config:
        orm_mode = True
