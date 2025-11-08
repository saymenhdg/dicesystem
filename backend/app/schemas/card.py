from datetime import datetime
from enum import Enum
from pydantic import BaseModel, Field
from typing import Optional


class CardStatusEnum(str, Enum):
    active = "active"
    frozen = "frozen"
    canceled = "canceled"


class CardTypeEnum(str, Enum):
    virtual = "virtual"
    physical = "physical"


class CardResponse(BaseModel):
    id: int
    user_id: int
    design_slug: str
    theme: str
    card_type: CardTypeEnum
    holder_name: str
    card_number: str
    expiry_month: int
    expiry_year: int
    cvv: str
    status: CardStatusEnum
    is_primary: bool
    created_at: datetime

    class Config:
        from_attributes = True


class CardOrderRequest(BaseModel):
    design_slug: str = Field(..., max_length=64)
    theme: str = Field(..., max_length=128)
    card_type: CardTypeEnum = CardTypeEnum.virtual


class CardStatusUpdate(BaseModel):
    status: CardStatusEnum
