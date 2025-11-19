import random
from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from pydantic import BaseModel

from app.api.auth import get_current_user, require_roles
from app.database import get_db
from app.models.card import Card, CardStatus, CardType
from app.models.user import User, RoleEnum
from app.schemas.card import CardOrderRequest, CardResponse, CardStatusUpdate
from app.utils.cards import generate_unique_card_number

router = APIRouter(prefix="/api/cards", tags=["cards"])


@router.get("", response_model=list[CardResponse])
def list_cards(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    return (
        db.query(Card)
        .filter(Card.user_id == current_user.id)
        .order_by(Card.created_at.desc())
        .all()
    )


@router.post("", response_model=CardResponse, status_code=status.HTTP_201_CREATED)
def order_card(
    payload: CardOrderRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    # Enforce at most one non-canceled virtual card and one non-canceled physical card per user
    try:
        raw_type = (
            payload.card_type.value
            if hasattr(payload.card_type, "value")
            else str(payload.card_type)
        )
        requested_type = CardType(raw_type)
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid card type")

    existing_same_type = (
        db.query(Card)
        .filter(
            Card.user_id == current_user.id,
            Card.card_type == requested_type,
            Card.status != CardStatus.canceled,
        )
        .count()
    )
    if existing_same_type > 0:
        human_type = "virtual" if requested_type == CardType.virtual else "physical"
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"You already have a {human_type} card. You can only have one virtual and one physical card.",
        )

    card_number = generate_unique_card_number(db)
    cvv = ''.join(str(random.randint(0, 9)) for _ in range(3))
    now = datetime.utcnow()
    expiry_month = now.month
    expiry_year = now.year + 4

    has_active_card = (
        db.query(Card)
        .filter(Card.user_id == current_user.id, Card.status != CardStatus.canceled)
        .count()
        > 0
    )

    card = Card(
        user_id=current_user.id,
        design_slug=payload.design_slug,
        theme=payload.theme,
        card_type=requested_type,
        holder_name=f"{current_user.first_name} {current_user.last_name}".strip() or current_user.username,
        card_number=card_number,
        expiry_month=expiry_month,
        expiry_year=expiry_year,
        cvv=cvv,
        status=CardStatus.active,
        is_primary=not has_active_card,
    )
    db.add(card)
    db.commit()
    db.refresh(card)
    return card


@router.patch("/{card_id}/status", response_model=CardResponse)
def update_card_status(
    card_id: int,
    payload: CardStatusUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    card = (
        db.query(Card)
        .filter(Card.id == card_id, Card.user_id == current_user.id)
        .first()
    )
    if not card:
        raise HTTPException(status_code=404, detail="Card not found")

    if card.status == CardStatus.canceled:
        raise HTTPException(status_code=400, detail="Canceled cards cannot be updated")

    new_status = CardStatus(payload.status.value)
    if card.status == new_status:
        return card

    card.status = new_status
    db.add(card)
    db.commit()
    db.refresh(card)
    return card


@router.get("/admin/{user_id}", response_model=list[CardResponse])
def admin_list_user_cards(
    user_id: int,
    _: User = Depends(require_roles([RoleEnum.admin, RoleEnum.account_manager])),
    db: Session = Depends(get_db),
):
    return (
        db.query(Card)
        .filter(Card.user_id == user_id)
        .order_by(Card.created_at.desc())
        .all()
    )


@router.patch("/admin/{card_id}/status", response_model=CardResponse)
def admin_update_card_status(
    card_id: int,
    payload: CardStatusUpdate,
    _: User = Depends(require_roles([RoleEnum.admin, RoleEnum.account_manager])),
    db: Session = Depends(get_db),
):
    card = db.query(Card).filter(Card.id == card_id).first()
    if not card:
        raise HTTPException(status_code=404, detail="Card not found")

    if card.status == CardStatus.canceled:
        raise HTTPException(status_code=400, detail="Canceled cards cannot be updated")

    try:
        new_status = CardStatus(payload.status.value)
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid status")

    if card.status == new_status:
        return card

    card.status = new_status
    db.add(card)
    db.commit()
    db.refresh(card)
    return card


class CardBalanceUpdate(BaseModel):
    balance: float


@router.put("/admin/{card_id}/balance", response_model=CardResponse)
def admin_update_card_balance(
    card_id: int,
    payload: CardBalanceUpdate,
    _: User = Depends(require_roles([RoleEnum.admin, RoleEnum.account_manager])),
    db: Session = Depends(get_db),
):
    from decimal import Decimal

    card = db.query(Card).filter(Card.id == card_id).first()
    if not card:
        raise HTTPException(status_code=404, detail="Card not found")

    try:
        new_balance = Decimal(str(payload.balance)).quantize(Decimal("0.01"))
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid balance amount")

    if new_balance < 0:
        raise HTTPException(status_code=400, detail="Balance cannot be negative")

    card.balance = new_balance
    db.add(card)
    db.commit()
    db.refresh(card)
    return card
