import datetime
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from ..database import get_db
from ..models.models import User
from ..auth import get_current_user
from ..schemas.schemas import AddPhoneRequest

router = APIRouter(prefix="/api/auth", tags=["Authentication"])

@router.get("/me")
def get_me(user: User = Depends(get_current_user)):
    return {
        "id": user.id,
        "firebase_uid": user.firebase_uid,
        "name": user.name,
        "email": user.email,
        "phone": user.phone,
        "auth_provider": user.auth_provider,
        "language": user.language,
        "profile_photo": user.profile_photo or "https://images.unsplash.com/photo-1544717305-2782549b5136?q=80&w=200&auto=format&fit=crop",
        "has_phone": bool(user.phone)
    }

@router.post("/sync")
def sync_firebase_user(
    name_override: str = None,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Syncs Firebase authenticated user profile with local DB.
    """
    if name_override and user.name != name_override:
        user.name = name_override
        db.commit()
        db.refresh(user)

    return {
        "success": True,
        "user": {
            "id": user.id,
            "firebase_uid": user.firebase_uid,
            "name": user.name,
            "email": user.email,
            "phone": user.phone,
            "auth_provider": user.auth_provider,
            "language": user.language,
            "has_phone": bool(user.phone)
        }
    }

@router.post("/link-phone")
def link_phone(
    req: AddPhoneRequest,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    phone = req.phone.strip()
    if not phone or len(phone) < 10:
        raise HTTPException(status_code=400, detail="Invalid phone number format")

    user.phone = phone
    if user.email and user.auth_provider != "google+phone":
        user.auth_provider = "google+phone"
    db.commit()
    db.refresh(user)

    return {
        "success": True,
        "message": "Phone number successfully linked to profile",
        "user": {
            "id": user.id,
            "firebase_uid": user.firebase_uid,
            "name": user.name,
            "email": user.email,
            "phone": user.phone,
            "auth_provider": user.auth_provider,
            "language": user.language,
            "has_phone": True
        }
    }

@router.post("/logout")
def logout():
    return {"message": "Logged out successfully"}
