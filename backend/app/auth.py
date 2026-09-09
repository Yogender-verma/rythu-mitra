import os
import logging
from fastapi import Depends, HTTPException, Security, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy.orm import Session
import firebase_admin
from firebase_admin import auth as firebase_auth, credentials

from .database import get_db
from .models.models import User

logger = logging.getLogger("rythumitra.auth")

# Initialize Firebase Admin App
try:
    if not firebase_admin._apps:
        cred_path = os.getenv("FIREBASE_SERVICE_ACCOUNT_KEY") or os.getenv("GOOGLE_APPLICATION_CREDENTIALS")
        if cred_path and os.path.exists(cred_path):
            cred = credentials.Certificate(cred_path)
            firebase_admin.initialize_app(cred)
            logger.info("Firebase Admin initialized with service account certificate.")
        else:
            # Default initialization (uses Google Public Certificates to verify tokens)
            firebase_admin.initialize_app()
            logger.info("Firebase Admin initialized with default configuration.")
except Exception as e:
    logger.warning(f"Firebase Admin initialization warning: {e}")

security = HTTPBearer(auto_error=False)

def verify_firebase_token(token: str) -> dict:
    """Verifies Firebase ID token using Firebase Admin SDK."""
    try:
        decoded_token = firebase_auth.verify_id_token(token)
        return decoded_token
    except Exception as e:
        logger.error(f"Firebase token verification failed: {e}")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=f"Invalid authentication token: {str(e)}",
            headers={"WWW-Authenticate": "Bearer"},
        )

def get_current_user(
    credentials: HTTPAuthorizationCredentials = Security(security),
    db: Session = Depends(get_db)
) -> User:
    """
    FastAPI dependency that extracts Bearer token, verifies Firebase ID Token,
    finds or creates corresponding local User record in database.
    """
    if not credentials or not credentials.credentials:
        # Fallback for dev mode / default demo user if header is missing
        demo_user = db.query(User).filter(User.id == 1).first()
        if not demo_user:
            demo_user = User(
                id=1,
                name="Telangana Farmer",
                phone="+919876543210",
                language="te",
                auth_provider="phone"
            )
            db.add(demo_user)
            db.commit()
            db.refresh(demo_user)
        return demo_user

    token = credentials.credentials
    decoded = verify_firebase_token(token)
    
    uid = decoded.get("uid")
    phone = decoded.get("phone_number")
    email = decoded.get("email")
    name = decoded.get("name") or "Telangana Farmer"
    provider_id = decoded.get("firebase", {}).get("sign_in_provider", "phone")

    # Find user by firebase_uid, phone, or email
    user = None
    if uid:
        user = db.query(User).filter(User.firebase_uid == uid).first()
    
    if not user and phone:
        user = db.query(User).filter(User.phone == phone).first()
        
    if not user and email:
        user = db.query(User).filter(User.email == email).first()

    if not user:
        # Create new user
        user = User(
            firebase_uid=uid,
            name=name,
            email=email,
            phone=phone,
            auth_provider="google" if "google" in provider_id else "phone",
            language="te"
        )
        db.add(user)
        db.commit()
        db.refresh(user)
    else:
        # Update existing user details if new provider data is attached
        updated = False
        if not user.firebase_uid and uid:
            user.firebase_uid = uid
            updated = True
        if not user.phone and phone:
            user.phone = phone
            updated = True
        if not user.email and email:
            user.email = email
            updated = True
        if phone and email and user.auth_provider != "google+phone":
            user.auth_provider = "google+phone"
            updated = True
        if updated:
            db.commit()
            db.refresh(user)

    return user
