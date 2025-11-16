from sqlalchemy import Column, Integer, String, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func

from app.database import Base

class SupportMessage(Base):
    __tablename__ = "support_messages"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    subject = Column(String, index=True)
    message = Column(String)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    owner = relationship("User", back_populates="support_messages")
    replies = relationship("SupportReply", back_populates="support_message", cascade="all, delete-orphan")


class SupportReply(Base):
    __tablename__ = "support_replies"

    id = Column(Integer, primary_key=True, index=True)
    support_message_id = Column(Integer, ForeignKey("support_messages.id"), nullable=False)
    responder_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    message = Column(String, nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    support_message = relationship("SupportMessage", back_populates="replies")
