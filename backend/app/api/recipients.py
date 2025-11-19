from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.database import get_db
from app.api.auth import get_current_user
from app.models.user import User
from app.models.contact import Contact
from app.schemas.recipient import (
    RecipientCreate,
    RecipientUpdate,
    RecipientVerifyRequest,
    RecipientResponse,
)

router = APIRouter(prefix="/api/recipients", tags=["recipients"])


def _to_response(model: Contact) -> RecipientResponse:
    target = model.contact
    return RecipientResponse(
        id=model.id,
        user_id=model.owner_id,
        recipient_id=model.contact_id,
        username=target.username if target else "",
        email=target.email if target else "",
        phone_number=target.phone_number if target else None,
        nickname=model.alias,
        saved_at=model.created_at,
        is_verified=True,
    )


@router.post("", response_model=RecipientResponse, status_code=status.HTTP_201_CREATED)
def add_recipient(
    payload: RecipientCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    q = payload.lookup.strip()
    if not q:
        raise HTTPException(status_code=400, detail="lookup is required")

    target = (
        db.query(User)
        .filter(
            (User.username == q)
            | (User.email == q)
            | (User.phone_number == q)
        )
        .first()
    )
    if not target:
        raise HTTPException(status_code=404, detail="Recipient not found")
    if target.id == current_user.id:
        raise HTTPException(status_code=400, detail="Cannot add yourself as recipient")

    existing = (
        db.query(Contact)
        .filter(Contact.owner_id == current_user.id, Contact.contact_id == target.id)
        .first()
    )
    if existing:
        raise HTTPException(status_code=409, detail="Recipient already exists")

    c = Contact(owner_id=current_user.id, contact_id=target.id, alias=payload.nickname)
    db.add(c)
    db.commit()
    db.refresh(c)
    return _to_response(c)


@router.get("", response_model=list[RecipientResponse])
def list_recipients(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    rows = db.query(Contact).filter(Contact.owner_id == current_user.id).all()
    return [_to_response(c) for c in rows]


@router.put("/{recipient_id}", response_model=RecipientResponse)
def update_recipient(
    recipient_id: int,
    payload: RecipientUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    c = (
        db.query(Contact)
        .filter(Contact.id == recipient_id, Contact.owner_id == current_user.id)
        .first()
    )
    if not c:
        raise HTTPException(status_code=404, detail="Recipient not found")

    if payload.nickname is not None:
        c.alias = payload.nickname

    db.add(c)
    db.commit()
    db.refresh(c)
    return _to_response(c)


@router.delete("/{recipient_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_recipient(
    recipient_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    c = (
        db.query(Contact)
        .filter(Contact.id == recipient_id, Contact.owner_id == current_user.id)
        .first()
    )
    if not c:
        raise HTTPException(status_code=404, detail="Recipient not found")
    db.delete(c)
    db.commit()
    return None


@router.post("/verify")
def verify_recipient(
    payload: RecipientVerifyRequest,
    current_user: User = Depends(get_current_user),  # noqa: F401 - ensure auth
    db: Session = Depends(get_db),
):
    q = payload.lookup.strip()
    if not q:
        raise HTTPException(status_code=400, detail="lookup is required")

    target = (
        db.query(User)
        .filter(
            (User.username == q)
            | (User.email == q)
            | (User.phone_number == q)
        )
        .first()
    )
    if not target:
        raise HTTPException(status_code=404, detail="Recipient not found")

    return {
        "valid": True,
        "user_id": target.id,
        "username": target.username,
        "email": target.email,
        "phone_number": target.phone_number,
    }
