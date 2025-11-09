import os
import shutil
import uuid

from fastapi import APIRouter, Depends, Query, HTTPException, UploadFile, File
from sqlalchemy import or_
from sqlalchemy.orm import Session

from app.api.auth import get_current_user
from app.database import get_db
from app.models.user import User
from app.schemas.user import UserResponse, UserSearchResult, UserUpdate

router = APIRouter(prefix="/api/users", tags=["users"])

STATIC_ROOT = os.path.join(os.path.dirname(os.path.dirname(__file__)), "static")
AVATAR_DIR = os.path.join(STATIC_ROOT, "avatars")
ALLOWED_IMAGE_EXTENSIONS = {".png", ".jpg", ".jpeg", ".gif", ".webp"}


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


@router.put("/me", response_model=UserResponse)
def update_profile(
    payload: UserUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    if payload.username and payload.username != current_user.username:
        exists = (
            db.query(User)
            .filter(User.username == payload.username, User.id != current_user.id)
            .first()
        )
        if exists:
            raise HTTPException(status_code=400, detail="Username already taken")
        current_user.username = payload.username

    if payload.phone_number and payload.phone_number != current_user.phone_number:
        exists = (
            db.query(User)
            .filter(User.phone_number == payload.phone_number, User.id != current_user.id)
            .first()
        )
        if exists:
            raise HTTPException(status_code=400, detail="Phone number already registered")
        current_user.phone_number = payload.phone_number

    if payload.display_name is not None:
        current_user.display_name = payload.display_name
    if payload.country is not None:
        current_user.country = payload.country
    if payload.city is not None:
        current_user.city = payload.city

    db.add(current_user)
    db.commit()
    db.refresh(current_user)
    return current_user


@router.post("/me/avatar")
async def upload_avatar(
    file: UploadFile = File(...),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    if not file.filename:
        raise HTTPException(status_code=400, detail="Invalid file name")

    ext = os.path.splitext(file.filename)[1].lower()
    if ext not in ALLOWED_IMAGE_EXTENSIONS:
        raise HTTPException(status_code=400, detail="Unsupported image type")

    os.makedirs(AVATAR_DIR, exist_ok=True)
    filename = f"user_{current_user.id}_{uuid.uuid4().hex}{ext}"
    file_path = os.path.join(AVATAR_DIR, filename)

    try:
        with open(file_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)
    finally:
        file.file.close()

    if current_user.profile_picture and current_user.profile_picture.startswith("/static/avatars/"):
        old_relative = current_user.profile_picture.replace("/static/", "", 1)
        old_path = os.path.join(STATIC_ROOT, old_relative)
        if os.path.exists(old_path):
            os.remove(old_path)

    relative_path = f"/static/avatars/{filename}"
    current_user.profile_picture = relative_path
    db.add(current_user)
    db.commit()
    db.refresh(current_user)

    return {"profile_picture": relative_path}
