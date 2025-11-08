from fastapi import APIRouter, Depends, Query
from sqlalchemy import or_
from sqlalchemy.orm import Session

from app.api.auth import get_current_user
from app.database import get_db
from app.models.user import User
from app.schemas.user import UserSearchResult

router = APIRouter(prefix="/api/users", tags=["users"])


@router.get("/search", response_model=list[UserSearchResult])
def search_users(
    query: str = Query(..., min_length=1, max_length=64, description="Username, email, or name"),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    q = query.strip()
    if not q:
        return []

    filters = or_(
        User.username.ilike(f"%{q}%"),
        User.email.ilike(f"%{q}%"),
        User.first_name.ilike(f"%{q}%"),
        User.last_name.ilike(f"%{q}%"),
    )

    rows = (
        db.query(User)
        .filter(User.id != current_user.id)
        .filter(filters)
        .order_by(User.username.asc())
        .limit(10)
        .all()
    )

    return [
        UserSearchResult(
            id=user.id,
            username=user.username,
            email=user.email,
            full_name=f"{user.first_name} {user.last_name}".strip() or user.username,
        )
        for user in rows
    ]
