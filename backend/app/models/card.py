import enum
from datetime import datetime
from sqlalchemy import (
    Column,
    Integer,
    String,
    Enum,
    Boolean,
    ForeignKey,
    DateTime,
)
from sqlalchemy.orm import relationship
from app.database import Base


class CardStatus(enum.Enum):
    active = "active"
    frozen = "frozen"
    canceled = "canceled"


class CardType(enum.Enum):
    virtual = "virtual"
    physical = "physical"


class Card(Base):
    __tablename__ = "cards"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    design_slug = Column(String, nullable=False)
    theme = Column(String, nullable=False)
    card_type = Column(Enum(CardType), default=CardType.virtual, nullable=False)
    holder_name = Column(String, nullable=False)
    card_number = Column(String, unique=True, nullable=False, index=True)
    expiry_month = Column(Integer, nullable=False)
    expiry_year = Column(Integer, nullable=False)
    cvv = Column(String, nullable=False)
    status = Column(Enum(CardStatus), default=CardStatus.active, nullable=False)
    is_primary = Column(Boolean, default=False, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)

    user = relationship("User", back_populates="cards")
