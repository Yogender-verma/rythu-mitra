from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from ..database import get_db
from ..models.models import Subscription, User
from ..schemas.schemas import SubscribeRequest

router = APIRouter(prefix="/api/subscriptions", tags=["Subscriptions"])

PLANS = [
    {
        "id": "FREE",
        "name": "Free Farmer",
        "name_telugu": "ఉచిత రైతు ప్లాన్",
        "price": "₹0",
        "period": "Forever",
        "features": [
            "Up to 5 crop scans per month",
            "Basic disease & pest diagnosis",
            "Standard treatment guidance",
            "Text advisory in Telugu & English"
        ],
        "is_popular": False
    },
    {
        "id": "PRO",
        "name": "Farmer Plus",
        "name_telugu": "రైతు ప్లస్ ప్లాన్",
        "price": "₹99",
        "period": "per month",
        "features": [
            "Unlimited crop scans",
            "High-precision AI disease diagnosis",
            "🔊 Full Telugu Voice Advisory playback",
            "Weather-aware irrigation & spray alerts",
            "Complete scan history storage",
            "Priority PJTSAU agricultural expert guidance"
        ],
        "is_popular": True
    }
]

@router.get("/plans")
def get_plans():
    return PLANS

@router.get("/status")
def get_user_subscription(user_id: int = 1, db: Session = Depends(get_db)):
    sub = db.query(Subscription).filter(Subscription.user_id == user_id).first()
    if not sub:
        return {
            "user_id": user_id,
            "plan": "FREE",
            "status": "ACTIVE",
            "started_at": None,
            "expires_at": None
        }
    return {
        "user_id": sub.user_id,
        "plan": sub.plan,
        "status": sub.status,
        "started_at": sub.started_at.isoformat() if sub.started_at else None,
        "expires_at": sub.expires_at.isoformat() if sub.expires_at else None
    }

@router.post("/subscribe")
def subscribe(req: SubscribeRequest, user_id: int = 1, db: Session = Depends(get_db)):
    # Architecture ready for Razorpay/Stripe webhook
    sub = db.query(Subscription).filter(Subscription.user_id == user_id).first()
    if not sub:
        sub = Subscription(user_id=user_id, plan=req.plan_id, status="ACTIVE")
        db.add(sub)
    else:
        sub.plan = req.plan_id
        sub.status = "ACTIVE"
    db.commit()

    return {
        "message": f"Successfully subscribed to {req.plan_id} plan!",
        "plan": req.plan_id,
        "status": "ACTIVE"
    }
