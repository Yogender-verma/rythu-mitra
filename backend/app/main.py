import os
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from .database import engine, Base
from .config import settings
from .api import auth, scans, weather, subscriptions, user, settings as settings_api

# Create database tables
Base.metadata.create_all(bind=engine)

app = FastAPI(
    title=settings.PROJECT_NAME,
    description="Telugu Voice Crop Advisory API for Smallholder Farmers",
    version="1.0.0"
)

# Enable CORS for React frontend (Vite port 5173 / localhost)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Mount audio files directory for Telugu TTS audio playback
os.makedirs(settings.AUDIO_DIR, exist_ok=True)
app.mount("/api/audio/file", StaticFiles(directory=settings.AUDIO_DIR), name="audio_files")

# Include Routers
app.include_router(auth.router)
app.include_router(scans.router)
app.include_router(weather.router)
app.include_router(subscriptions.router)
app.include_router(user.router)
app.include_router(settings_api.router)

@app.get("/api/health")
def health_check():
    return {
        "status": "healthy",
        "service": settings.PROJECT_NAME,
        "ml_provider": settings.ML_MODEL_PROVIDER,
        "sms_provider": settings.SMS_PROVIDER
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("app.main:app", host="0.0.0.0", port=8000, reload=True)
