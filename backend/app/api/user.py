from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from ..database import get_db
from ..models.models import User
from ..auth import get_current_user
from ..schemas.schemas import UpdateProfileRequest

router = APIRouter(prefix="/api/user", tags=["User Profile"])

@router.get("/me")
def read_current_user(user: User = Depends(get_current_user)):
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

@router.put("/profile")
def update_profile(
    req: UpdateProfileRequest,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    if req.name is not None:
        user.name = req.name
    if req.language is not None:
        user.language = req.language
    if req.profile_photo is not None:
        user.profile_photo = req.profile_photo

    db.commit()
    db.refresh(user)
    return {
        "message": "Profile updated successfully",
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
