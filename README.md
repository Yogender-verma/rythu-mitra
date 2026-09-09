# RythuMitra AI (రైతు మిత్ర AI)
> **Telugu Voice Crop Advisory for Smallholder Farmers**

RythuMitra AI is a production-quality, software-only agricultural tech platform built for Telangana smallholder farmers to identify crop pests/diseases from photos and receive contextual advisories in Telugu text and speech.

---

## 🌟 Core Features

- **Mobile-First Farmer UI:** Designed with large touch targets, accessible typography, and dual English/Telugu interface support.
- **AI Crop Disease Diagnosis:** Pluggable ML classifier interface for Cotton, Paddy, Chilli, and Maize crops.
- **Verified Agricultural Advisory Engine:** Contextual rule-based knowledge engine retrieving pre-approved PJTSAU guidelines (crop stage, disease, dosage, safety notes, weather context).
- **🔊 Telugu Voice Advisory:** Converts advisory text into Telugu speech audio for farmers with lower text literacy.
- **Weather Integration:** Real-time weather awareness to prevent pesticide spray wash-off before rain.
- **Authentication Flow:** Secure Google OAuth and Phone OTP authentication with OTP expiration and resend cooldowns.
- **Past Search History & Subscriptions:** Full scan archive with filtering and subscription tier management (Free Farmer 🌱 & Farmer Plus 🌿).

---

## 📁 Repository Structure

```
rythumitra-ai/
│
├── frontend/                  # React + Vite + TypeScript + Tailwind CSS
│   ├── src/
│   │   ├── components/        # Logo, Sidebar, Header, MobileNav
│   │   ├── pages/             # LandingPage, AuthPages, DashboardPage, ScanPage, HistoryPage, SubscriptionsPage, SettingsPage
│   │   ├── layouts/           # AppLayout
│   │   ├── context/           # AuthContext
│   │   ├── services/          # API fetch client
│   │   └── types/             # TypeScript models
│   └── tailwind.config.js
│
├── backend/                   # Python + FastAPI + Uvicorn + SQLAlchemy
│   ├── app/
│   │   ├── api/               # Auth, Scans, Weather, Subscriptions, User, Settings
│   │   ├── ml/                # DiseaseClassifier ABC, MockDiseaseClassifier, Inference dispatcher
│   │   ├── services/          # AdvisoryEngine, TTSService (gTTS)
│   │   ├── models/            # SQLAlchemy database models
│   │   ├── schemas/           # Pydantic data schemas
│   │   ├── config.py          # Settings
│   │   └── main.py            # FastAPI Uvicorn ASGI server
│   ├── requirements.txt
│   └── .env.example
│
└── README.md
```

---

## 🚀 Quick Start Guide

### 1. Run Backend Server (FastAPI)
```bash
cd backend
pip install -r requirements.txt
python -m uvicorn app.main:app --reload --port 8000
```
- API Docs: `http://localhost:8000/docs`
- Health check: `http://localhost:8000/api/health`

### 2. Run Frontend Dev Server (React + Vite)
```bash
cd frontend
npm install
npm run dev
```
- Web Application: `http://localhost:5173`

---

## 🤖 ML Architecture & Model Integration

The ML classification layer is strictly isolated behind an Abstract Base Class:

```python
# backend/app/ml/classifier.py
class DiseaseClassifier(ABC):
    @abstractmethod
    def predict(self, image_bytes: bytes, selected_crop: str) -> Dict[str, Any]:
        pass
```

Currently, `MockDiseaseClassifier` handles demo inferences cleanly. To plug in a real PyTorch / TensorFlow / ONNX model:
1. Create `backend/app/ml/real_classifier.py` implementing `DiseaseClassifier`.
2. Update `backend/app/ml/inference.py` to return `RealDiseaseClassifier()`.
3. No frontend or API route changes are needed!
