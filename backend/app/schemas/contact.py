from pydantic import BaseModel
from datetime import datetime
from typing import Optional

class ContactBase(BaseModel):
    username: str               
    alias: Optional[str] = None 

class ContactCreate(ContactBase):
    pass

class ContactResponse(BaseModel):
    id: int
    contact_id: int
    username: str
    alias: Optional[str]
    created_at: datetime

    class Config:
        from_attributes = True
