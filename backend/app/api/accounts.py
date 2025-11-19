from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import func
from decimal import Decimal

from app.database import get_db
from app.models.user import User, RoleEnum
from app.models.account import Account
from app.models.savings_goal import SavingsGoal
from app.api.auth import get_current_user, require_roles

router = APIRouter(prefix="/api/accounts", tags=["accounts"])

from pydantic import BaseModel

class ActivateRequest(BaseModel):
    active: bool


class BalanceUpdateRequest(BaseModel):
    balance: float

def _mask_card(card: str | None) -> str | None:
    if not card or len(card) < 8:
        return card
    return f"{card[:4]} **** **** {card[-4:]}"

@router.get("/me")
def my_account(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    acct = db.query(Account).filter(Account.user_id == current_user.id).first()
    if not acct:
        raise HTTPException(status_code=404, detail="Account not found")

    raw_balance = Decimal(str(acct.balance or Decimal("0.00")))
    total_goals = (
        db.query(func.coalesce(func.sum(SavingsGoal.current_amount), 0))
        .filter(SavingsGoal.user_id == current_user.id)
        .scalar()
        or Decimal("0.00")
    )
    available = raw_balance - Decimal(str(total_goals))
    if available < 0:
        available = Decimal("0.00")

    return {
        "user_id": acct.user_id,
        "balance": str(available),
        "raw_balance": str(raw_balance),
        "card_number": _mask_card(acct.card_number),
        "card_active": acct.card_active,
    }

@router.patch("/activate")
def activate_my_card(
    payload: ActivateRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    acct = db.query(Account).filter(Account.user_id == current_user.id).first()
    if not acct:
        raise HTTPException(status_code=404, detail="Account not found")
    acct.card_active = payload.active
    db.add(acct)
    db.commit()
    db.refresh(acct)
    return {"card_active": acct.card_active}


@router.patch("/{user_id}/activate")
def admin_activate_card(
    user_id: int,
    payload: ActivateRequest,
    _: User = Depends(require_roles([RoleEnum.admin, RoleEnum.account_manager])),
    db: Session = Depends(get_db)
):
    acct = db.query(Account).filter(Account.user_id == user_id).first()
    if not acct:
        raise HTTPException(status_code=404, detail="Account not found")
    acct.card_active = payload.active
    db.add(acct)
    db.commit()
    return {"user_id": user_id, "card_active": acct.card_active}


@router.get("/admin/{user_id}")
def admin_get_account(
    user_id: int,
    _: User = Depends(require_roles([RoleEnum.admin, RoleEnum.account_manager])),
    db: Session = Depends(get_db),
):
    acct = db.query(Account).filter(Account.user_id == user_id).first()
    if not acct:
        raise HTTPException(status_code=404, detail="Account not found")

    raw_balance = Decimal(str(acct.balance or Decimal("0.00")))
    total_goals = (
        db.query(func.coalesce(func.sum(SavingsGoal.current_amount), 0))
        .filter(SavingsGoal.user_id == user_id)
        .scalar()
        or Decimal("0.00")
    )
    available = raw_balance - Decimal(str(total_goals))
    if available < 0:
        available = Decimal("0.00")

    return {
        "user_id": user_id,
        "balance": str(available),
        "raw_balance": str(raw_balance),
        "card_number": _mask_card(acct.card_number),
        "card_active": acct.card_active,
    }


@router.put("/admin/{user_id}/balance")
def admin_update_balance(
    user_id: int,
    payload: BalanceUpdateRequest,
    _: User = Depends(require_roles([RoleEnum.admin, RoleEnum.account_manager])),
    db: Session = Depends(get_db),
):
    acct = db.query(Account).filter(Account.user_id == user_id).first()
    if not acct:
        raise HTTPException(status_code=404, detail="Account not found")

    try:
        new_balance = Decimal(str(payload.balance)).quantize(Decimal("0.01"))
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid balance amount")

    if new_balance < 0:
        raise HTTPException(status_code=400, detail="Balance cannot be negative")

    acct.balance = new_balance
    db.add(acct)
    db.commit()
    db.refresh(acct)

    raw_balance = Decimal(str(acct.balance or Decimal("0.00")))
    total_goals = (
        db.query(func.coalesce(func.sum(SavingsGoal.current_amount), 0))
        .filter(SavingsGoal.user_id == user_id)
        .scalar()
        or Decimal("0.00")
    )
    available = raw_balance - Decimal(str(total_goals))
    if available < 0:
        available = Decimal("0.00")

    return {
        "user_id": user_id,
        "balance": str(available),
        "raw_balance": str(raw_balance),
        "card_number": _mask_card(acct.card_number),
        "card_active": acct.card_active,
    }
