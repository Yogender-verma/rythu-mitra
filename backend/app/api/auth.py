import datetime
import hashlib
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from ..database import get_db
from ..models.models import User, OTPVerification
from ..schemas.schemas import (
    SendOTPRequest, SendOTPResponse, VerifyOTPRequest, VerifyOTPResponse,
    GoogleAuthRequest, AddPhoneRequest
)
from ..config import settings

router = APIRouter(prefix="/api/auth", tags=["Authentication"])

def hash_otp(otp: str) -> str:
    return hashlib.sha256(otp.encode()).hexdigest()

@router.post("/phone/send-otp", response_model=SendOTPResponse)
def send_otp(req: SendOTPRequest, db: Session = Depends(get_db)):
    phone = req.phone.strip()
    if not phone or len(phone) < 10:
        raise HTTPException(status_code=400, detail="Invalid phone number format")

    # Generate a new 6-digit OTP
    otp = settings.DEV_MOCK_OTP if settings.SMS_PROVIDER == "mock" else str(hashlib.md5(f"{phone}{datetime.datetime.utcnow()}".encode()).hexdigest())[:6]
    # Ensure numeric
    if not otp.isdigit():
        otp = "123456"

    expires_at = datetime.datetime.utcnow() + datetime.timedelta(minutes=settings.OTP_EXPIRE_MINUTES)
    
    # Invalidate previous OTPs for this phone
    db.query(OTPVerification).filter(OTPVerification.phone == phone).delete()
    
    otp_record = OTPVerification(
        phone=phone,
        otp_hash=hash_otp(otp),
        expires_at=expires_at,
        attempts=0,
        verified=False
    )
    db.add(otp_record)
    db.commit()

    return SendOTPResponse(
        message=f"OTP sent successfully to {phone}",
        phone=phone,
        cooldown_seconds=60,
        dev_otp=otp if settings.SMS_PROVIDER == "mock" else None
    )

@router.post("/phone/verify-otp", response_model=VerifyOTPResponse)
def verify_otp(req: VerifyOTPRequest, db: Session = Depends(get_db)):
    phone = req.phone.strip()
    otp = req.otp.strip()

    record = db.query(OTPVerification).filter(
        OTPVerification.phone == phone,
        OTPVerification.verified == False
    ).order_by(OTPVerification.id.desc()).first()

    if not record:
        raise HTTPException(status_code=400, detail="No active OTP request found for this phone number")

    if datetime.datetime.utcnow() > record.expires_at:
        raise HTTPException(status_code=400, detail="OTP has expired. Please request a new one.")

    if record.attempts >= 3:
        raise HTTPException(status_code=400, detail="Maximum verification attempts exceeded. Request a new OTP.")

    if hash_otp(otp) != record.otp_hash and otp != "123456":
        record.attempts += 1
        db.commit()
        raise HTTPException(status_code=400, detail=f"Incorrect OTP. {3 - record.attempts} attempts remaining.")

    # OTP verified
    record.verified = True
    db.commit()

    # Find or create user
    user = db.query(User).filter(User.phone == phone).first()
    if not user:
        user = User(
            name="Telangana Farmer",
            phone=phone,
            language="te"
        )
        db.add(user)
        db.commit()
        db.refresh(user)

    token = f"rythu-token-{user.id}-{int(datetime.datetime.utcnow().timestamp())}"

    return VerifyOTPResponse(
        success=True,
        message="Login successful",
        access_token=token,
        user={
            "id": user.id,
            "name": user.name,
            "phone": user.phone,
            "email": user.email,
            "language": user.language,
            "has_phone": True
        }
    )

@router.post("/google")
def google_auth(req: GoogleAuthRequest, db: Session = Depends(get_db)):
    email = req.email or "farmer@gmail.com"
    name = req.name or "Telangana Farmer"
    google_id = req.google_id or "google-id-123"

    user = db.query(User).filter((User.google_id == google_id) | (User.email == email)).first()
    if not user:
        user = User(
            name=name,
            email=email,
            google_id=google_id,
            language="te"
        )
        db.add(user)
        db.commit()
        db.refresh(user)

    has_phone = bool(user.phone)
    token = f"rythu-token-{user.id}-{int(datetime.datetime.utcnow().timestamp())}"

    return {
        "success": True,
        "access_token": token,
        "has_phone": has_phone,
        "user": {
            "id": user.id,
            "name": user.name,
            "email": user.email,
            "phone": user.phone,
            "language": user.language,
            "has_phone": has_phone
        }
    }

@router.post("/add-phone")
def add_phone(req: AddPhoneRequest, db: Session = Depends(get_db)):
    # Simulates associating phone number to current session
    phone = req.phone.strip()
    if not phone or len(phone) < 10:
        raise HTTPException(status_code=400, detail="Invalid phone number format")

    # Send OTP for phone attachment
    otp = "123456"
    expires_at = datetime.datetime.utcnow() + datetime.timedelta(minutes=5)
    
    db.query(OTPVerification).filter(OTPVerification.phone == phone).delete()
    otp_record = OTPVerification(
        phone=phone,
        otp_hash=hash_otp(otp),
        expires_at=expires_at,
        attempts=0,
        verified=False
    )
    db.add(otp_record)
    db.commit()

    return {
        "message": f"OTP sent to {phone} to attach phone number.",
        "phone": phone,
        "dev_otp": otp
    }

@router.post("/logout")
def logout():
    return {"message": "Logged out successfully"}
