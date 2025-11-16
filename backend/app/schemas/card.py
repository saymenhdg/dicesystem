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


class CardCreateRequest(BaseModel):
    card_number: str = Field(..., max_length=16, min_length=16)
    expiry_month: int = Field(..., ge=1, le=12)
    expiry_year: int = Field(..., ge=2000, le=2099)
    cvv: str = Field(..., max_length=4, min_length=3)
    holder_name: str = Field(..., max_length=128)
    design_slug: str = Field(..., max_length=64)
    theme: str = Field(..., max_length=128)
    card_type: CardTypeEnum = CardTypeEnum.virtual
