import random
import hashlib
from typing import Dict, Any
from .classifier import DiseaseClassifier

class MockDiseaseClassifier(DiseaseClassifier):
    """
    Mock inference adapter for RythuMitra AI.
    
    IMPORTANT: This class provides realistic simulated predictions for hackathon and dev testing.
    It can be swapped seamlessly for RealDiseaseClassifier without modifying the FastAPI API routes.
    """

    MOCK_DISEASE_DB = {
        "Cotton": [
            {
                "disease": "Cotton Leaf Curl Virus",
                "disease_telugu": "ప్రత్తి ఆకు ముడుత వైరస్ (Leaf Curl Virus)",
                "confidence": 0.92,
                "risk_level": "High"
            },
            {
                "disease": "Bacterial Leaf Blight",
                "disease_telugu": "బ్యాక్టీరియల్ ఆకు మచ్చ తెగులు (Bacterial Blight)",
                "confidence": 0.88,
                "risk_level": "Medium"
            },
            {
                "disease": "Healthy Cotton Crop",
                "disease_telugu": "ఆరోగ్యకరమైన ప్రత్తి పైరు (Healthy)",
                "confidence": 0.96,
                "risk_level": "Low"
            }
        ],
        "Paddy": [
            {
                "disease": "Rice Blast (Pyricularia oryzae)",
                "disease_telugu": "వరి అగ్గి తెగులు (Rice Blast)",
                "confidence": 0.94,
                "risk_level": "High"
            },
            {
                "disease": "Sheath Blight",
                "disease_telugu": "వరి తొడుగు ఎండడు తెగులు (Sheath Blight)",
                "confidence": 0.89,
                "risk_level": "Medium"
            },
            {
                "disease": "Healthy Paddy Crop",
                "disease_telugu": "ఆరోగ్యకరమైన వరి పైరు (Healthy)",
                "confidence": 0.97,
                "risk_level": "Low"
            }
        ],
        "Chilli": [
            {
                "disease": "Chilli Leaf Curl Virus (Thrips / Mites)",
                "disease_telugu": "మిర్చి బొబ్బర / ఆకు ముడుత తెగులు (Chilli Leaf Curl)",
                "confidence": 0.91,
                "risk_level": "High"
            },
            {
                "disease": "Anthracnose / Fruit Rot",
                "disease_telugu": "మిర్చి కాయ కుళ్ళు తెగులు (Fruit Rot)",
                "confidence": 0.86,
                "risk_level": "Medium"
            },
            {
                "disease": "Healthy Chilli Crop",
                "disease_telugu": "ఆరోగ్యకరమైన మిర్చి పైరు (Healthy)",
                "confidence": 0.95,
                "risk_level": "Low"
            }
        ],
        "Maize": [
            {
                "disease": "Turcicum Leaf Blight",
                "disease_telugu": "మొక్కజొన్న ఆకు ఎండు తెగులు (Turcicum Blight)",
                "confidence": 0.90,
                "risk_level": "Medium"
            },
            {
                "disease": "Fall Armyworm Damage",
                "disease_telugu": "కత్తిర పురుగు గాయం (Fall Armyworm)",
                "confidence": 0.93,
                "risk_level": "High"
            },
            {
                "disease": "Healthy Maize Crop",
                "disease_telugu": "ఆరోగ్యకరమైన మొక్కజొన్న పైరు (Healthy)",
                "confidence": 0.98,
                "risk_level": "Low"
            }
        ]
    }

    def predict(self, image_bytes: bytes, selected_crop: str) -> Dict[str, Any]:
        crop_key = selected_crop.capitalize() if selected_crop else "Cotton"
        if crop_key not in self.MOCK_DISEASE_DB:
            crop_key = "Cotton"

        # Deterministic seed from image bytes hash so same image yields consistent mock prediction
        image_hash = hashlib.md5(image_bytes).hexdigest() if image_bytes else "default"
        hash_val = int(image_hash[:8], 16)
        
        # Check if simulated low confidence image (e.g. hash ends with 0 or 7)
        if len(image_bytes) < 100 or hash_val % 13 == 0:
            return {
                "crop": crop_key,
                "disease": "Uncertain / Unclear Image",
                "disease_telugu": "స్పష్టంగా గుర్తించలేకపోయాము",
                "confidence": 0.42,
                "risk_level": "Unknown",
                "is_low_confidence": True
            }

        candidates = self.MOCK_DISEASE_DB[crop_key]
        chosen = candidates[hash_val % len(candidates)]

        return {
            "crop": crop_key,
            "disease": chosen["disease"],
            "disease_telugu": chosen["disease_telugu"],
            "confidence": chosen["confidence"],
            "risk_level": chosen["risk_level"],
            "is_low_confidence": False
        }
