from datetime import datetime, timedelta
import secrets
from typing import Optional, Callable, List

from fastapi import APIRouter, Depends, HTTPException, status, Security
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from pydantic import BaseModel
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.user import User, RoleEnum
from app.models.account import Account
from app.schemas.user import UserRegister, LoginSchema, UserResponse
from app.utils.security import hash_password, verify_password

router = APIRouter(prefix="/api/auth", tags=["auth"])
security = HTTPBearer()

SESSIONS: dict[str, dict] = {}
SESSION_EXPIRE_HOURS = 24


def _create_session_token(user_id: int) -> str:
    """Create a new in-memory session token."""
    token = secrets.token_urlsafe(32)
    expires_at = datetime.utcnow() + timedelta(hours=SESSION_EXPIRE_HOURS)
    SESSIONS[token] = {"user_id": user_id, "expires_at": expires_at}
    return token


def _get_session_user_id(token: str) -> Optional[int]:
    """Retrieve the user ID from an active session token."""
    data = SESSIONS.get(token)
    if not data or data["expires_at"] < datetime.utcnow():
        SESSIONS.pop(token, None)
        return None
    return data["user_id"]


def _delete_session(token: str):
    
    SESSIONS.pop(token, None)



def get_current_user(
    credentials: HTTPAuthorizationCredentials = Security(security),
    db: Session = Depends(get_db),
) -> User:
    
    if not credentials:
        raise HTTPException(status_code=401, detail="Missing authorization token")

    token = credentials.credentials
    user_id = _get_session_user_id(token)
    if not user_id:
        raise HTTPException(status_code=401, detail="Invalid or expired session token")

    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=401, detail="User not found")

    return user


def require_roles(allowed_roles: List[RoleEnum]) -> Callable:
    """Restrict access based on user roles."""
    def _role_checker(current_user: User = Depends(get_current_user)):
        if current_user.role not in allowed_roles:
            raise HTTPException(status_code=403, detail="Insufficient permissions")
        return current_user
    return _role_checker



@router.post("/register", response_model=UserResponse, status_code=201)
def register(payload: UserRegister, db: Session = Depends(get_db)):
    """Register a new user and auto-create their account."""
    if db.query(User).filter(User.email == payload.email).first():
        raise HTTPException(status_code=400, detail="Email already registered")
    if db.query(User).filter(User.username == payload.username).first():
        raise HTTPException(status_code=400, detail="Username already taken")
    if db.query(User).filter(User.phone_number == payload.phone_number).first():
        raise HTTPException(status_code=400, detail="Phone number already registered")
    user = User(
        email=payload.email,
        username=payload.username,
        hashed_password=hash_password(payload.password),
        first_name=payload.first_name,
        last_name=payload.last_name,
        phone_number=payload.phone_number,
        country=payload.country,
        city=payload.city,
        display_name=f"{payload.first_name} {payload.last_name}".strip() or payload.username,
        role=payload.role,
    )
    db.add(user)
    db.commit()
    db.refresh(user)

    # Create a bare account with zero balance and no card; cards will be created only when ordered
    account = Account(
        user_id=user.id,
        balance=0,
        card_number=None,
        card_active=False,
    )
    db.add(account)
    db.commit()
    db.refresh(account)
    user.account = account
    return user


@router.post("/login")
def login(payload: LoginSchema, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.username == payload.username).first()
    if not user:
        user = db.query(User).filter(User.email == payload.username).first()

    if not user or not verify_password(payload.password, user.hashed_password):
        raise HTTPException(status_code=401, detail="Invalid username/email or password")

    token = _create_session_token(user.id)
    return {
        "session_token": token,
        "user": {
            "id": user.id,
            "username": user.username,
            "email": user.email,
            "role": user.role.value if isinstance(user.role, RoleEnum) else str(user.role),
        },
    }


@router.post("/logout")
def logout(credentials: HTTPAuthorizationCredentials = Security(security)):
    """Logout the current session."""
    token = credentials.credentials
    _delete_session(token)
    return {"message": "Logged out successfully"}


@router.get("/me", response_model=UserResponse)
def me(current_user: User = Depends(get_current_user)):
    """Return the currently logged-in user's profile."""
    return current_user


@router.get("/admin/users")
def list_users(
    current_user: User = Depends(require_roles([RoleEnum.admin])),
    db: Session = Depends(get_db),
):
    """Admin-only: List all users."""
    users = db.query(User).all()
    return [
        {
            "id": u.id,
            "username": u.username,
            "email": u.email,
            "role": u.role.value if isinstance(u.role, RoleEnum) else str(u.role),
            "is_active": u.is_active,
            "created_at": u.created_at,
            "phone_number": u.phone_number,
        }
        for u in users
    ]


class UserStatusUpdate(BaseModel):
    is_active: bool


@router.put("/admin/users/{user_id}/status")
def update_user_status(
    user_id: int,
    payload: UserStatusUpdate,
    _: User = Depends(require_roles([RoleEnum.admin])),
    db: Session = Depends(get_db),
):
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    user.is_active = payload.is_active
    db.add(user)
    db.commit()
    db.refresh(user)
    return {"id": user.id, "is_active": user.is_active}


class UserRoleUpdate(BaseModel):
    role: RoleEnum


@router.put("/admin/users/{user_id}/role")
def update_user_role(
    user_id: int,
    payload: UserRoleUpdate,
    _: User = Depends(require_roles([RoleEnum.admin])),
    db: Session = Depends(get_db),
):
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    user.role = payload.role
    db.add(user)
    db.commit()
    db.refresh(user)
    return {
        "id": user.id,
        "role": user.role.value if isinstance(user.role, RoleEnum) else str(user.role),
    }
