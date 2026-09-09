import datetime
from sqlalchemy import Column, Integer, String, Float, DateTime, ForeignKey, Boolean, Text
from sqlalchemy.orm import relationship
from ..database import Base

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    firebase_uid = Column(String, unique=True, index=True, nullable=True)
    name = Column(String, default="Telangana Farmer")
    email = Column(String, unique=True, index=True, nullable=True)
    phone = Column(String, unique=True, index=True, nullable=True)
    google_id = Column(String, unique=True, nullable=True)
    auth_provider = Column(String, default="phone")
    language = Column(String, default="te")  # 'te' or 'en'
    profile_photo = Column(String, nullable=True)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

    scans = relationship("CropScan", back_populates="user")
    subscription = relationship("Subscription", back_populates="user", uselist=False)

class OTPVerification(Base):
    __tablename__ = "otp_verifications"

    id = Column(Integer, primary_key=True, index=True)
    phone = Column(String, index=True)
    otp_hash = Column(String)
    expires_at = Column(DateTime)
    attempts = Column(Integer, default=0)
    verified = Column(Boolean, default=False)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

class CropScan(Base):
    __tablename__ = "crop_scans"

    id = Column(String, primary_key=True, index=True)  # UUID or formatted string
    user_id = Column(Integer, ForeignKey("users.id"))
    image_url = Column(Text)
    crop = Column(String)  # Cotton, Paddy, Chilli, Maize
    crop_stage = Column(String, nullable=True)  # Legacy field, default NULL
    district = Column(String)
    mandal = Column(String)
    diagnosis = Column(String)
    confidence = Column(Float)
    risk_level = Column(String)  # High, Medium, Low, Unknown
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

    user = relationship("User", back_populates="scans")
    advisory = relationship("Advisory", back_populates="scan", uselist=False)
    weather = relationship("WeatherSnapshot", back_populates="scan", uselist=False)

class WeatherSnapshot(Base):
    __tablename__ = "weather_snapshots"

    id = Column(Integer, primary_key=True, index=True)
    scan_id = Column(String, ForeignKey("crop_scans.id"))
    temperature = Column(String)
    humidity = Column(String)
    rainfall_probability = Column(String)
    condition = Column(String)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

    scan = relationship("CropScan", back_populates="weather")

class Advisory(Base):
    __tablename__ = "advisories"

    id = Column(Integer, primary_key=True, index=True)
    scan_id = Column(String, ForeignKey("crop_scans.id"))
    recommendation_en = Column(Text)
    recommendation_te = Column(Text)
    dosage_en = Column(Text)
    dosage_te = Column(Text)
    safety_notes_en = Column(Text)
    safety_notes_te = Column(Text)
    audio_url = Column(String, nullable=True)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

    scan = relationship("CropScan", back_populates="advisory")

class Subscription(Base):
    __tablename__ = "subscriptions"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    plan = Column(String, default="FREE")  # FREE or PRO
    status = Column(String, default="ACTIVE")
    started_at = Column(DateTime, default=datetime.datetime.utcnow)
    expires_at = Column(DateTime, nullable=True)

    user = relationship("User", back_populates="subscription")
