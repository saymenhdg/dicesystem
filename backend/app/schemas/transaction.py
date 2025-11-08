from pydantic import BaseModel, Field
from datetime import datetime
from typing import Optional

class TransactionCreate(BaseModel):
    receiver_id: Optional[int] = None
    receiver_username: Optional[str] = None
    amount: float = Field(..., gt=0)
    description: Optional[str] = None

    @property
    def has_identifier(self) -> bool:
        return bool(self.receiver_id or (self.receiver_username and self.receiver_username.strip()))

    @classmethod
    def validate_identifier(cls, values):
        if not values.get("receiver_id") and not values.get("receiver_username"):
            raise ValueError("receiver_id or receiver_username must be provided")
        return values

    model_config = {
        "validate_assignment": True,
    }

class TransactionResponse(BaseModel):
    id: int
    sender_id: int
    receiver_id: int
    amount: float
    description: Optional[str]
    timestamp: datetime
    tx_type: str

    class Config:
        from_attributes = True
