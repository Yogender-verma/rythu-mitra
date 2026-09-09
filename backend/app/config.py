import os
from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    PROJECT_NAME: str = "RythuMitra AI"
    SECRET_KEY: str = "rythumitra-super-secret-key-change-in-production"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 43200
    
    GOOGLE_CLIENT_ID: str = "mock-google-client-id.apps.googleusercontent.com"
    
    SMS_PROVIDER: str = "mock"
    DEV_MOCK_OTP: str = "123456"
    OTP_EXPIRE_MINUTES: int = 5
    
    ML_MODEL_PROVIDER: str = "mock"
    DATABASE_URL: str = "sqlite:///./rythumitra.db"
    AUDIO_DIR: str = "./audio_cache"

    class Config:
        env_file = ("../.env", ".env")
        extra = "ignore"

settings = Settings()

os.makedirs(settings.AUDIO_DIR, exist_ok=True)
