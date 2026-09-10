import os
import datetime
from sqlalchemy import create_engine, Column, Integer, String, Float, DateTime, ForeignKey, Boolean, Text
from sqlalchemy.orm import declarative_base, sessionmaker, relationship

DATABASE_URL = os.environ.get("DATABASE_URL", "sqlite:///./rythumitra.db")

# For SQLite, enable check_same_thread=False
engine = create_engine(
    DATABASE_URL,
    connect_args={"check_same_thread": False} if DATABASE_URL.startswith("sqlite") else {}
)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()


class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    phone = Column(String, unique=True, index=True, nullable=False)  # Normalized E.164 (e.g. +919876543210)
    name = Column(String, default="Alex Morgan")
    language = Column(String, default="te")  # 'te' (Telugu) or 'en' (English)
    subscription_tier = Column(String, default="Tier 01 Plan")
    subscription_status = Column(String, default="ACTIVE")  # ACTIVE, EXPIRED, TRIAL
    subscription_start = Column(DateTime, default=datetime.datetime.utcnow)
    subscription_expiry = Column(DateTime, default=lambda: datetime.datetime.utcnow() + datetime.timedelta(days=365))
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

    scans = relationship("CropScan", back_populates="user", cascade="all, delete-orphan")
    transactions = relationship("PaymentTransaction", back_populates="user", cascade="all, delete-orphan")

    def to_dict(self):
        now = datetime.datetime.utcnow()
        days_remaining = max(0, (self.subscription_expiry - now).days) if self.subscription_expiry else 0
        total_days = 365
        days_elapsed = min(total_days, max(0, total_days - days_remaining))

        return {
            "id": self.id,
            "phone": self.phone,
            "name": self.name,
            "language": self.language,
            "subscription_tier": self.subscription_tier,
            "subscription_status": self.subscription_status,
            "subscription_start": self.subscription_start.strftime("%d %b %Y") if self.subscription_start else "15 Jan 2024",
            "subscription_expiry": self.subscription_expiry.strftime("%d %b %Y") if self.subscription_expiry else "15 Jan 2025",
            "days_remaining": days_remaining,
            "days_elapsed": days_elapsed,
            "total_days": total_days,
            "created_at": self.created_at.isoformat() if self.created_at else None
        }


class OTPVerification(Base):
    __tablename__ = "otp_verifications"

    id = Column(Integer, primary_key=True, index=True)
    phone = Column(String, index=True, nullable=False)
    otp_code = Column(String, nullable=False)
    expires_at = Column(DateTime, nullable=False)
    attempts = Column(Integer, default=0)
    verified = Column(Boolean, default=False)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)


class CropScan(Base):
    __tablename__ = "crop_scans"

    id = Column(String, primary_key=True, index=True)  # UUID
    user_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    phone = Column(String, index=True, nullable=True)
    crop = Column(String, default="Unknown")
    disease = Column(String, default="Healthy")
    disease_telugu = Column(String, default="ఆరోగ్యకరమైన పైరు")
    confidence = Column(Float, default=0.0)
    risk_level = Column(String, default="Low")  # High, Medium, Low, Unknown
    organic_solution = Column(Text, default="")
    chemical_solution = Column(Text, default="")
    product_name = Column(String, default="")
    product_image = Column(String, default="")
    dosage = Column(String, default="")
    image_url = Column(Text, default="")
    audio_url = Column(String, nullable=True)
    source = Column(String, default="web")  # 'web' or 'whatsapp'
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

    user = relationship("User", back_populates="scans")

    def to_dict(self):
        return {
            "id": self.id,
            "user_id": self.user_id,
            "phone": self.phone,
            "crop": self.crop,
            "disease": self.disease,
            "disease_telugu": self.disease_telugu,
            "confidence": round(self.confidence, 3),
            "risk_level": self.risk_level,
            "organic_solution": self.organic_solution,
            "chemical_solution": self.chemical_solution,
            "product_name": self.product_name,
            "product_image": self.product_image,
            "dosage": self.dosage,
            "image_url": self.image_url,
            "audio_url": self.audio_url,
            "source": self.source,
            "created_at": self.created_at.isoformat() if self.created_at else None
        }


class PaymentTransaction(Base):
    __tablename__ = "payment_transactions"

    id = Column(String, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    order_id = Column(String, unique=True, index=True)
    payment_id = Column(String, nullable=True)
    amount = Column(Float, default=999.0)
    currency = Column(String, default="INR")
    status = Column(String, default="SUCCESS")  # PENDING, SUCCESS, FAILED
    payment_method = Column(String, default="UPI")  # UPI, CARD, NETBANKING
    plan = Column(String, default="Harvest Premium Annual Tier 01")
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

    user = relationship("User", back_populates="transactions")

    def to_dict(self):
        return {
            "id": self.id,
            "user_id": self.user_id,
            "order_id": self.order_id,
            "payment_id": self.payment_id,
            "amount": self.amount,
            "currency": self.currency,
            "status": self.status,
            "payment_method": self.payment_method,
            "plan": self.plan,
            "created_at": self.created_at.isoformat() if self.created_at else None
        }


def init_db():
    Base.metadata.create_all(bind=engine)
    # Seed default demo farmer if empty
    db = SessionLocal()
    try:
        if not db.query(User).first():
            demo_user = User(
                phone="+919876543210",
                name="Alex Morgan",
                language="te",
                subscription_tier="Tier 01 Plan",
                subscription_status="ACTIVE",
                subscription_start=datetime.datetime(2024, 1, 15),
                subscription_expiry=datetime.datetime(2025, 1, 15)
            )
            db.add(demo_user)
            db.commit()
    finally:
        db.close()


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
