from typing import List, Literal, Optional
from pydantic import BaseModel
from datetime import datetime

class Transaction(BaseModel):
    id: str
    type: Literal['credit', 'debit']
    amount: float
    date: str

class CardDetail(BaseModel):
    card_number: str
    card_type: str
    expiry_month: int
    expiry_year: int
    status: str
    created_at: datetime

class AccountDetail(BaseModel):
    balance: float
    card_active: bool
    cards: List[CardDetail] = []

class AdminUserDetail(BaseModel):
    id: int
    email: str
    username: str
    first_name: str
    last_name: str
    phone_number: str
    country: Optional[str]
    city: Optional[str]
    role: str
    is_active: bool
    created_at: datetime
    account: Optional[AccountDetail]
