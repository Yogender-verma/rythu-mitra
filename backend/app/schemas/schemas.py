from pydantic import BaseModel, Field
from typing import Optional, List
import datetime

# Auth Schemas
class SendOTPRequest(BaseModel):
    phone: str = Field(..., example="+919876543210")

class SendOTPResponse(BaseModel):
    message: str
    phone: str
    cooldown_seconds: int = 60
    dev_otp: Optional[str] = None  # Exposed only in dev mock mode

class VerifyOTPRequest(BaseModel):
    phone: str
    otp: str

class VerifyOTPResponse(BaseModel):
    success: bool
    message: str
    access_token: Optional[str] = None
    user: Optional[dict] = None

class GoogleAuthRequest(BaseModel):
    credential: Optional[str] = None
    email: Optional[str] = "farmer@gmail.com"
    name: Optional[str] = "Telangana Farmer"
    google_id: Optional[str] = "google-user-12345"

class AddPhoneRequest(BaseModel):
    phone: str

# User Schemas
class UserProfile(BaseModel):
    id: int
    name: str
    email: Optional[str] = None
    phone: Optional[str] = None
    language: str = "te"
    profile_photo: Optional[str] = None
    has_phone: bool = False

class UpdateProfileRequest(BaseModel):
    name: Optional[str] = None
    language: Optional[str] = None
    profile_photo: Optional[str] = None

# Scan Schemas
class ScanCreateRequest(BaseModel):
    crop: str  # Cotton, Paddy, Chilli, Maize
    crop_stage: Optional[str] = None
    district: str
    mandal: str
    notes: Optional[str] = None

class DiagnosisResult(BaseModel):
    crop: str
    disease: str
    disease_telugu: str
    confidence: float
    risk_level: str  # High, Medium, Low, Unknown
    is_low_confidence: bool = False

class AdvisoryResult(BaseModel):
    recommendation_en: str
    recommendation_te: str
    dosage_en: str
    dosage_te: str
    safety_notes_en: str
    safety_notes_te: str
    audio_url: str

class WeatherResult(BaseModel):
    temperature: str
    humidity: str
    rainfall_probability: str
    condition: str
    condition_telugu: str

class ScanFullResponse(BaseModel):
    id: str
    user_id: int
    image_url: str
    crop: str
    crop_stage: Optional[str] = None
    district: str
    mandal: str
    diagnosis: DiagnosisResult
    advisory: AdvisoryResult
    weather: WeatherResult
    created_at: str

# Weather Standalone
class WeatherQuery(BaseModel):
    district: str
    mandal: Optional[str] = "Central"

# Subscriptions
class PlanDetails(BaseModel):
    id: str
    name: str
    name_telugu: str
    price: str
    period: str
    features: List[str]
    is_popular: bool = False

class SubscribeRequest(BaseModel):
    plan_id: str
