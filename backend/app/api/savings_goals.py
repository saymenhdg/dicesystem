from decimal import Decimal

from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel, Field
from sqlalchemy import func
from sqlalchemy.orm import Session

from app.database import get_db
from app.api.auth import get_current_user
from app.models.user import User
from app.models.account import Account
from app.models.savings_goal import SavingsGoal
from app.schemas.savings_goal import SavingsGoalCreate, SavingsGoalUpdate, SavingsGoalResponse

router = APIRouter(prefix="/api/savings-goals", tags=["savings-goals"])


def _to_response(model: SavingsGoal) -> SavingsGoalResponse:
    return SavingsGoalResponse(
        id=model.id,
        name=model.name,
        target_amount=float(model.target_amount or 0),
        current_amount=float(model.current_amount or 0),
        created_at=model.created_at,
    )


def _get_account(db: Session, user_id: int) -> Account:
    acct = db.query(Account).filter(Account.user_id == user_id).first()
    if not acct:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Account not found")
    return acct


def _ensure_within_balance(db: Session, user_id: int, new_current: Decimal, exclude_goal_id: int | None = None) -> None:
    acct = _get_account(db, user_id)
    total_q = db.query(func.coalesce(func.sum(SavingsGoal.current_amount), 0)).filter(
        SavingsGoal.user_id == user_id
    )
    if exclude_goal_id is not None:
        total_q = total_q.filter(SavingsGoal.id != exclude_goal_id)
    existing_total: Decimal = total_q.scalar() or Decimal("0")
    if existing_total + new_current > (acct.balance or Decimal("0")):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Total saved across all goals cannot exceed your account balance",
        )


@router.get("", response_model=list[SavingsGoalResponse])
def list_savings_goals(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    rows = db.query(SavingsGoal).filter(SavingsGoal.user_id == current_user.id).order_by(SavingsGoal.created_at.asc()).all()
    return [_to_response(g) for g in rows]


@router.post("", response_model=SavingsGoalResponse, status_code=status.HTTP_201_CREATED)
def create_savings_goal(
    payload: SavingsGoalCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    target = Decimal(str(payload.target_amount)).quantize(Decimal("0.01"))
    current = Decimal(str(payload.current_amount or 0)).quantize(Decimal("0.01"))
    if current < 0 or target <= 0:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid goal amounts")
    _ensure_within_balance(db, current_user.id, current)

    goal = SavingsGoal(
        user_id=current_user.id,
        name=payload.name.strip(),
        target_amount=target,
        current_amount=current,
    )
    db.add(goal)
    db.commit()
    db.refresh(goal)
    return _to_response(goal)


@router.put("/{goal_id}", response_model=SavingsGoalResponse)
def update_savings_goal(
    goal_id: int,
    payload: SavingsGoalUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    goal = (
        db.query(SavingsGoal)
        .filter(SavingsGoal.id == goal_id, SavingsGoal.user_id == current_user.id)
        .first()
    )
    if not goal:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Goal not found")

    if payload.name is not None:
        goal.name = payload.name.strip()
    if payload.target_amount is not None:
        goal.target_amount = Decimal(str(payload.target_amount)).quantize(Decimal("0.01"))
    if payload.current_amount is not None:
        new_current = Decimal(str(payload.current_amount)).quantize(Decimal("0.01"))
        if new_current < 0:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid current amount")
        _ensure_within_balance(db, current_user.id, new_current, exclude_goal_id=goal.id)
        goal.current_amount = new_current

    db.add(goal)
    db.commit()
    db.refresh(goal)
    return _to_response(goal)


@router.delete("/{goal_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_savings_goal(
    goal_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    goal = (
        db.query(SavingsGoal)
        .filter(SavingsGoal.id == goal_id, SavingsGoal.user_id == current_user.id)
        .first()
    )
    if not goal:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Goal not found")
    db.delete(goal)
    db.commit()
    return None


class SavingsAmountChange(BaseModel):
    amount: float = Field(..., gt=0)


def _get_goal_for_user(db: Session, goal_id: int, user_id: int) -> SavingsGoal:
    goal = (
        db.query(SavingsGoal)
        .filter(SavingsGoal.id == goal_id, SavingsGoal.user_id == user_id)
        .first()
    )
    if not goal:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Goal not found")
    return goal


@router.post("/{goal_id}/deposit", response_model=SavingsGoalResponse)
def deposit_into_goal(
    goal_id: int,
    payload: SavingsAmountChange,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    goal = _get_goal_for_user(db, goal_id, current_user.id)
    amount = Decimal(str(payload.amount)).quantize(Decimal("0.01"))
    if amount <= 0:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Amount must be positive")

    new_current = Decimal(goal.current_amount or 0) + amount
    if goal.target_amount and new_current > Decimal(goal.target_amount):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Amount exceeds this goal's target",
        )

    _ensure_within_balance(db, current_user.id, new_current, exclude_goal_id=goal.id)
    goal.current_amount = new_current
    db.add(goal)
    db.commit()
    db.refresh(goal)
    return _to_response(goal)


@router.post("/{goal_id}/withdraw", response_model=SavingsGoalResponse)
def withdraw_from_goal(
    goal_id: int,
    payload: SavingsAmountChange,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    goal = _get_goal_for_user(db, goal_id, current_user.id)
    amount = Decimal(str(payload.amount)).quantize(Decimal("0.01"))
    if amount <= 0:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Amount must be positive")

    current_amount = Decimal(goal.current_amount or 0)
    if amount > current_amount:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Cannot withdraw more than is saved in this goal",
        )

    goal.current_amount = current_amount - amount
    db.add(goal)
    db.commit()
    db.refresh(goal)
    return _to_response(goal)
