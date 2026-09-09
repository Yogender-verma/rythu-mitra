import uuid
import datetime
import base64
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form
from sqlalchemy.orm import Session
from ..database import get_db
from ..models.models import CropScan, Advisory, WeatherSnapshot, User
from ..ml.inference import get_classifier
from ..services.advisory_engine import AdvisoryEngine
from ..services.tts_service import TTSService

router = APIRouter(prefix="/api/scans", tags=["Crop Scans"])

@router.post("")
async def create_scan(
    crop: str = Form(...),
    crop_stage: str = Form(...),
    district: str = Form("Karimnagar"),
    mandal: str = Form("Choppadandi"),
    notes: str = Form(""),
    user_id: int = Form(1),
    file: UploadFile = File(None),
    db: Session = Depends(get_db)
):
    image_bytes = b""
    if file:
        image_bytes = await file.read()
    
    # Standard sample fallback image if file empty
    if not image_bytes:
        image_url = "https://images.unsplash.com/photo-1592982537447-7440770cbfc9?q=80&w=800&auto=format&fit=crop"
        image_bytes = b"mock_crop_image_bytes_rythumitra"
    else:
        # Create base64 preview format or blob URL
        encoded = base64.b64encode(image_bytes).decode('utf-8')
        image_url = f"data:{file.content_type or 'image/jpeg'};base64,{encoded}"

    # 1. Run ML Diagnosis Classifier
    classifier = get_classifier()
    prediction = classifier.predict(image_bytes, crop)

    scan_id = str(uuid.uuid4())[:12]
    
    # 2. Weather Snapshot
    weather_info = {
        "temperature": "31°C",
        "humidity": "72%",
        "rainfall_probability": "40%",
        "condition": "Partly Cloudy",
        "condition_telugu": "పాక్షికంగా మేఘావృతం"
    }

    # 3. Context-aware Advisory Generation
    advisory_data = AdvisoryEngine.get_advisory(
        crop=prediction["crop"],
        disease=prediction["disease"],
        crop_stage=crop_stage,
        weather_condition=weather_info["condition"],
        risk_level=prediction["risk_level"]
    )

    # 4. Generate Telugu Voice Audio
    audio_url = TTSService.generate_telugu_audio(
        scan_id=scan_id,
        text=f"{prediction['disease_telugu']}. {advisory_data['recommendation_te']}"
    )

    # 5. DB Persistence
    db_scan = CropScan(
        id=scan_id,
        user_id=user_id,
        image_url=image_url,
        crop=prediction["crop"],
        crop_stage=crop_stage,
        district=district,
        mandal=mandal,
        diagnosis=prediction["disease"],
        confidence=prediction["confidence"],
        risk_level=prediction["risk_level"]
    )
    db.add(db_scan)
    db.commit()

    db_weather = WeatherSnapshot(
        scan_id=scan_id,
        temperature=weather_info["temperature"],
        humidity=weather_info["humidity"],
        rainfall_probability=weather_info["rainfall_probability"],
        condition=weather_info["condition"]
    )
    db.add(db_weather)

    db_advisory = Advisory(
        scan_id=scan_id,
        recommendation_en=advisory_data["recommendation_en"],
        recommendation_te=advisory_data["recommendation_te"],
        dosage_en=advisory_data["dosage_en"],
        dosage_te=advisory_data["dosage_te"],
        safety_notes_en=advisory_data["safety_notes_en"],
        safety_notes_te=advisory_data["safety_notes_te"],
        audio_url=audio_url
    )
    db.add(db_advisory)
    db.commit()

    return {
        "id": scan_id,
        "user_id": user_id,
        "image_url": image_url,
        "crop": prediction["crop"],
        "crop_stage": crop_stage,
        "district": district,
        "mandal": mandal,
        "diagnosis": prediction,
        "advisory": {
            "recommendation_en": advisory_data["recommendation_en"],
            "recommendation_te": advisory_data["recommendation_te"],
            "dosage_en": advisory_data["dosage_en"],
            "dosage_te": advisory_data["dosage_te"],
            "safety_notes_en": advisory_data["safety_notes_en"],
            "safety_notes_te": advisory_data["safety_notes_te"],
            "audio_url": audio_url
        },
        "weather": weather_info,
        "created_at": db_scan.created_at.isoformat()
    }

@router.get("")
def list_scans(user_id: int = 1, db: Session = Depends(get_db)):
    scans = db.query(CropScan).filter(CropScan.user_id == user_id).order_by(CropScan.created_at.desc()).all()
    results = []
    for s in scans:
        adv = db.query(Advisory).filter(Advisory.scan_id == s.id).first()
        wth = db.query(WeatherSnapshot).filter(WeatherSnapshot.scan_id == s.id).first()
        results.append({
            "id": s.id,
            "user_id": s.user_id,
            "image_url": s.image_url,
            "crop": s.crop,
            "crop_stage": s.crop_stage,
            "district": s.district,
            "mandal": s.mandal,
            "diagnosis": {
                "crop": s.crop,
                "disease": s.diagnosis,
                "confidence": s.confidence,
                "risk_level": s.risk_level
            },
            "advisory": {
                "recommendation_en": adv.recommendation_en if adv else "",
                "recommendation_te": adv.recommendation_te if adv else "",
                "dosage_en": adv.dosage_en if adv else "",
                "dosage_te": adv.dosage_te if adv else "",
                "audio_url": adv.audio_url if adv else ""
            },
            "created_at": s.created_at.isoformat()
        })
    return results

@router.get("/{scan_id}")
def get_scan_details(scan_id: str, db: Session = Depends(get_db)):
    scan = db.query(CropScan).filter(CropScan.id == scan_id).first()
    if not scan:
        raise HTTPException(status_code=404, detail="Scan record not found")

    adv = db.query(Advisory).filter(Advisory.scan_id == scan_id).first()
    wth = db.query(WeatherSnapshot).filter(WeatherSnapshot.scan_id == scan_id).first()

    return {
        "id": scan.id,
        "user_id": scan.user_id,
        "image_url": scan.image_url,
        "crop": scan.crop,
        "crop_stage": scan.crop_stage,
        "district": scan.district,
        "mandal": scan.mandal,
        "diagnosis": {
            "crop": scan.crop,
            "disease": scan.diagnosis,
            "confidence": scan.confidence,
            "risk_level": scan.risk_level
        },
        "advisory": {
            "recommendation_en": adv.recommendation_en if adv else "",
            "recommendation_te": adv.recommendation_te if adv else "",
            "dosage_en": adv.dosage_en if adv else "",
            "dosage_te": adv.dosage_te if adv else "",
            "safety_notes_en": adv.safety_notes_en if adv else "",
            "safety_notes_te": adv.safety_notes_te if adv else "",
            "audio_url": adv.audio_url if adv else ""
        },
        "weather": {
            "temperature": wth.temperature if wth else "30°C",
            "humidity": wth.humidity if wth else "70%",
            "rainfall_probability": wth.rainfall_probability if wth else "30%",
            "condition": wth.condition if wth else "Partly Cloudy"
        },
        "created_at": scan.created_at.isoformat()
    }
