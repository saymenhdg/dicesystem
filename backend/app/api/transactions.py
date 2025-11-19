from decimal import Decimal
from datetime import datetime, timedelta
from fastapi import APIRouter, Depends, HTTPException, Query, status
from pydantic import BaseModel
from sqlalchemy.orm import Session
from sqlalchemy import or_

from app.database import get_db
from app.api.auth import get_current_user, require_roles
from app.models.user import User, RoleEnum
from app.models.account import Account
from app.models.transaction import Transaction, TxType
from app.models.card import Card, CardStatus
from app.schemas.transaction import TransactionCreate, TransactionResponse

router = APIRouter(prefix="/api/transactions", tags=["transactions"])


class TopUpRequest(BaseModel):
    amount: float
    card_id: int


def _recent_duplicate_transaction(
    db: Session,
    *,
    sender_id: int | None,
    receiver_id: int | None,
    amount: Decimal,
    tx_type: TxType,
    note: str | None = None,
    window_seconds: int = 5,
):
    """Return a recently created duplicate transaction to guard against double submissions."""
    window_start = datetime.utcnow() - timedelta(seconds=window_seconds)
    q = db.query(Transaction).filter(
        Transaction.tx_type == tx_type,
        Transaction.amount == amount,
        Transaction.created_at >= window_start,
    )
    if sender_id is None:
        q = q.filter(Transaction.sender_id.is_(None))
    else:
        q = q.filter(Transaction.sender_id == sender_id)
    if receiver_id is None:
        q = q.filter(Transaction.receiver_id.is_(None))
    else:
        q = q.filter(Transaction.receiver_id == receiver_id)
    if note is None:
        q = q.filter(Transaction.note.is_(None))
    else:
        q = q.filter(Transaction.note == note)
    return q.order_by(Transaction.created_at.desc()).first()


@router.post("/topup", status_code=status.HTTP_201_CREATED)
def top_up(
    payload: TopUpRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    amount = Decimal(str(payload.amount)).quantize(Decimal("0.01"))
    if amount <= 0:
        raise HTTPException(status_code=400, detail="Amount must be positive")

    # Ensure card belongs to the current user and is active
    card = (
        db.query(Card)
        .filter(
            Card.id == payload.card_id,
            Card.user_id == current_user.id,
            Card.status == CardStatus.active,
        )
        .with_for_update()
        .first()
    )
    if not card:
        raise HTTPException(status_code=400, detail="Selected card is not available or not active")

    card_balance = Decimal(str(card.balance or 0)).quantize(Decimal("0.01"))
    if card_balance < amount:
        raise HTTPException(status_code=400, detail="Insufficient card balance")

    acct = (
        db.query(Account)
        .filter(Account.user_id == current_user.id)
        .with_for_update()
        .first()
    )
    if not acct:
        raise HTTPException(status_code=404, detail="Account not found")

    duplicate = _recent_duplicate_transaction(
        db,
        sender_id=None,
        receiver_id=current_user.id,
        amount=amount,
        tx_type=TxType.received,
        note="Top up via card",
    )
    if duplicate:
        reference = f"TP-{duplicate.id:06d}"
        return {
            "message": "Top up already processed",
            "reference": reference,
            "transaction_id": duplicate.id,
        }

    # Deduct from card balance and add to account balance
    card.balance = (card_balance - amount).quantize(Decimal("0.01"))
    acct.balance = (Decimal(acct.balance or 0) + amount).quantize(Decimal("0.01"))
    db.add(card)
    db.add(acct)

    tx = Transaction(
        sender_id=None,
        receiver_id=current_user.id,
        amount=amount,
        note="Top up via card",
        tx_type=TxType.received,
    )
    db.add(tx)
    db.flush()

    reference = f"TP-{tx.id:06d}"
    db.commit()

    return {
        "message": "Top up completed",
        "reference": reference,
        "transaction_id": tx.id,
    }


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

    duplicate = _recent_duplicate_transaction(
        db,
        sender_id=current_user.id,
        receiver_id=receiver.id,
        amount=amount,
        tx_type=TxType.sent,
        note=payload.description,
    )
    if duplicate:
        reference = f"TX-{duplicate.id:06d}"
        return {
            "message": "Transfer already processed",
            "reference": reference,
            "transaction_id": duplicate.id,
        }

    sender_acct.balance = (Decimal(sender_acct.balance or 0) - amount).quantize(Decimal("0.01"))
    recv_acct.balance = (Decimal(recv_acct.balance or 0) + amount).quantize(Decimal("0.01"))
    db.add_all([sender_acct, recv_acct])

    transaction = Transaction(
        sender_id=current_user.id,
        receiver_id=receiver.id,
        amount=amount,
        note=payload.description,
        tx_type=TxType.sent,
    )
    db.add(transaction)
    db.flush()

    reference = f"TX-{transaction.id:06d}"

    db.commit()

    return {
        "message": "Transfer completed",
        "reference": reference,
        "transaction_id": transaction.id,
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


@router.get("/admin", response_model=list[TransactionResponse])
def admin_list_transactions(
    user_id: int,
    limit: int = Query(50, ge=1, le=200),
    _: User = Depends(require_roles([RoleEnum.admin, RoleEnum.account_manager])),
    db: Session = Depends(get_db),
):
    q = db.query(Transaction).filter(
        or_(Transaction.sender_id == user_id, Transaction.receiver_id == user_id)
    ).order_by(Transaction.created_at.desc())

    rows = q.limit(limit).all()

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
