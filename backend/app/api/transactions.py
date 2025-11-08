from decimal import Decimal
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session
from sqlalchemy import or_

from app.database import get_db
from app.api.auth import get_current_user
from app.models.user import User
from app.models.account import Account
from app.models.transaction import Transaction, TxType
from app.models.card import Card, CardStatus
from app.schemas.transaction import TransactionCreate, TransactionResponse

router = APIRouter(prefix="/api/transactions", tags=["transactions"])

@router.post("/send", status_code=status.HTTP_201_CREATED)
def send_money(payload: TransactionCreate, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    if not payload.receiver_id and not (payload.receiver_username and payload.receiver_username.strip()):
        raise HTTPException(status_code=422, detail="receiver_id or receiver_username is required")

    receiver_query = db.query(User)
    receiver = None
    if payload.receiver_id:
        receiver = receiver_query.filter(User.id == payload.receiver_id).first()
    elif payload.receiver_username:
        receiver = receiver_query.filter(User.username == payload.receiver_username).first()

    if not receiver:
        raise HTTPException(status_code=404, detail="Receiver not found")
    if receiver.id == current_user.id:
        raise HTTPException(status_code=400, detail="Cannot transfer to yourself")

    sender_acct = db.query(Account).filter(Account.user_id == current_user.id).with_for_update().first()
    recv_acct = db.query(Account).filter(Account.user_id == receiver.id).with_for_update().first()

    if not sender_acct or not recv_acct:
        raise HTTPException(status_code=404, detail="Account missing")

    has_active_card = (
        db.query(Card)
        .filter(Card.user_id == current_user.id, Card.status == CardStatus.active)
        .first()
    )

    if not sender_acct.card_active and not has_active_card:
        raise HTTPException(status_code=403, detail="You must activate at least one card to transfer funds")

    amount = Decimal(str(payload.amount)).quantize(Decimal("0.01"))
    if amount <= 0:
        raise HTTPException(status_code=400, detail="Amount must be positive")

    if Decimal(sender_acct.balance or 0) < amount:
        raise HTTPException(status_code=400, detail="Insufficient balance")

    sender_acct.balance = (Decimal(sender_acct.balance or 0) - amount).quantize(Decimal("0.01"))
    recv_acct.balance = (Decimal(recv_acct.balance or 0) + amount).quantize(Decimal("0.01"))
    db.add_all([sender_acct, recv_acct])

    t_sent = Transaction(
        sender_id=current_user.id,
        receiver_id=receiver.id,
        amount=amount,
        note=payload.description,
        tx_type=TxType.sent,
    )
    t_received = Transaction(
        sender_id=current_user.id,
        receiver_id=receiver.id,
        amount=amount,
        note=payload.description,
        tx_type=TxType.received,
    )
    db.add_all([t_sent, t_received])
    db.flush()

    reference = f"TX-{t_sent.id:06d}"

    db.commit()

    return {
        "message": "Transfer completed",
        "reference": reference,
        "transaction_id": t_sent.id,
    }

@router.get("", response_model=list[TransactionResponse])
def list_transactions(
    direction: str | None = Query(None, description="sent | received (optional)"),
    limit: int = Query(50, ge=1, le=200),
    offset: int = Query(0, ge=0),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    q = db.query(Transaction).filter(
        or_(Transaction.sender_id == current_user.id, Transaction.receiver_id == current_user.id)
    ).order_by(Transaction.created_at.desc())

    if direction in ("sent", "received"):
        enum_val = TxType.sent if direction == "sent" else TxType.received
        q = q.filter(Transaction.tx_type == enum_val)

    rows = q.offset(offset).limit(limit).all()

    out: list[TransactionResponse] = []
    for r in rows:
        out.append(TransactionResponse(
            id=r.id,
            sender_id=r.sender_id,
            receiver_id=r.receiver_id,
            amount=float(r.amount),
            description=r.note,
            timestamp=r.created_at,
            tx_type=r.tx_type.value,
        ))
    return out
