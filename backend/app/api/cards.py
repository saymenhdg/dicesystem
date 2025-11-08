import random
from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.api.auth import get_current_user
from app.database import get_db
from app.models.card import Card, CardStatus, CardType
from app.models.user import User
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
        card_type=CardType(payload.card_type.value),
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
