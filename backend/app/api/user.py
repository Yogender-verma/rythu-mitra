from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from ..database import get_db
from ..models.models import User
from ..schemas.schemas import UpdateProfileRequest

router = APIRouter(prefix="/api/user", tags=["User Profile"])

@router.get("/me")
def get_current_user(user_id: int = 1, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        # Create default demo farmer
        user = User(
            id=1,
            name="Ramu Telangana Farmer",
            email="ramu.farmer@telangana.gov.in",
            phone="+919876543210",
            language="te"
        )
        db.add(user)
        db.commit()
        db.refresh(user)

    return {
        "id": user.id,
        "name": user.name,
        "email": user.email,
        "phone": user.phone,
        "language": user.language,
        "profile_photo": user.profile_photo or "https://images.unsplash.com/photo-1544717305-2782549b5136?q=80&w=200&auto=format&fit=crop",
        "has_phone": bool(user.phone)
    }

@router.put("/profile")
def update_profile(req: UpdateProfileRequest, user_id: int = 1, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    if req.name is not None:
        user.name = req.name
    if req.language is not None:
        user.language = req.language
    if req.profile_photo is not None:
        user.profile_photo = req.profile_photo

    db.commit()
    return {"message": "Profile updated successfully", "user": {"id": user.id, "name": user.name, "language": user.language}}
