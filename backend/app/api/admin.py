from fastapi import APIRouter, Depends, HTTPException
from typing import List, Optional
from sqlalchemy.orm import Session, joinedload
from app.schemas.admin_schemas import AdminUserDetail, AccountDetail, CardDetail
from app.models.user import User
from app.models.account import Account
from app.models.card import Card
from app.database import get_db

router = APIRouter(prefix="/admin", tags=["admin"])

@router.get("/users/details", response_model=List[AdminUserDetail])
async def get_all_users_details(db: Session = Depends(get_db)):
    users = db.query(User).options(joinedload(User.account), joinedload(User.cards)).all()
    admin_users_details = []
    for user in users:
        account_detail = None
        if user.account:
            cards_detail = []
            for card in user.cards:
                cards_detail.append(CardDetail(
                    card_number=card.card_number,
                    card_type=card.card_type.value,
                    expiry_month=card.expiry_month,
                    expiry_year=card.expiry_year,
                    status=card.status.value,
                    created_at=card.created_at
                ))
            account_detail = AccountDetail(
                balance=float(user.account.balance),
                card_active=user.account.card_active,
                cards=cards_detail
            )

        admin_users_details.append(AdminUserDetail(
            id=user.id,
            email=user.email,
            username=user.username,
            first_name=user.first_name,
            last_name=user.last_name,
            phone_number=user.phone_number,
            country=user.country,
            city=user.city,
            role=user.role.value,
            is_active=user.is_active,
            created_at=user.created_at,
            account=account_detail
        ))
    return admin_users_details

@router.get("/users/{user_id}/details", response_model=AdminUserDetail)
async def get_user_details_by_id(user_id: int, db: Session = Depends(get_db)):
    user = db.query(User).options(joinedload(User.account), joinedload(User.cards)).filter(User.id == user_id).first()

    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    account_detail = None
    if user.account:
        cards_detail = []
        for card in user.cards:
            cards_detail.append(CardDetail(
                card_number=card.card_number,
                card_type=card.card_type.value,
                expiry_month=card.expiry_month,
                expiry_year=card.expiry_year,
                status=card.status.value,
                created_at=card.created_at
            ))
        account_detail = AccountDetail(
            balance=float(user.account.balance),
            card_active=user.account.card_active,
            cards=cards_detail
        )

    return AdminUserDetail(
        id=user.id,
        email=user.email,
        username=user.username,
        first_name=user.first_name,
        last_name=user.last_name,
        phone_number=user.phone_number,
        country=user.country,
        city=user.city,
        role=user.role.value,
        is_active=user.is_active,
        created_at=user.created_at,
        account=account_detail
    )