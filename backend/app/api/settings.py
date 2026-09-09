from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from ..database import get_db
from ..models.models import User
from pydantic import BaseModel

router = APIRouter(prefix="/api/settings", tags=["Settings"])

class SettingsUpdateRequest(BaseModel):
    language: str = "te"
    voice_speed: str = "normal"  # normal, slow
    default_crop: str = "Cotton"
    district: str = "Karimnagar"
    mandal: str = "Choppadandi"
    notifications_enabled: bool = True

@router.get("")
def get_settings():
    return {
        "language": "te",
        "voice_speed": "normal",
        "default_crop": "Cotton",
        "district": "Karimnagar",
        "mandal": "Choppadandi",
        "notifications_enabled": True
    }

@router.put("")
def update_settings(req: SettingsUpdateRequest):
    return {
        "message": "Settings updated successfully",
        "settings": req.dict()
    }

@router.delete("/account")
def delete_account(user_id: int = 1, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.id == user_id).first()
    if user:
        db.delete(user)
        db.commit()
    return {"message": "Account deleted successfully"}
