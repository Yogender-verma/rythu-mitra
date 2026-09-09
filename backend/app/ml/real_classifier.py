import os
import io
import json
import torch
import torch.nn as nn
from torchvision import transforms, models
from PIL import Image
from typing import Dict, Any
from .classifier import DiseaseClassifier

class RealDiseaseClassifier(DiseaseClassifier):
    """
    Production PyTorch Modular Multi-Crop Disease Classifier for RythuMitra AI.
    Routes inference to crop-specific models (Cotton, Paddy, Chilli, Maize) or unified target crop model.
    """

    TELUGU_CLASS_MAP = {
        # Cotton
        "Cotton_Bacterial_Blight": ("Cotton", "Bacterial Blight (Xanthomonas malvacearum)", "ప్రత్తి బ్యాక్టీరియల్ ఆకు మచ్చ తెగులు", "High"),
        "Cotton_Diseased_Plant": ("Cotton", "Diseased Cotton Plant", "బాధిత ప్రత్తి మొక్క", "High"),
        "Cotton_Healthy": ("Cotton", "Healthy Cotton Crop", "ఆరోగ్యకరమైన ప్రత్తి పైరు", "Low"),
        "Cotton_Leaf_Curl": ("Cotton", "Cotton Leaf Curl Virus", "ప్రత్తి ఆకు ముడుత వైరస్", "High"),
        
        # Paddy / Rice
        "Paddy_Bacterial_Leaf_Blight": ("Paddy", "Bacterial Leaf Blight (Xanthomonas oryzae)", "వరి బ్యాక్టీరియల్ ఆకు ఎండు తెగులు", "High"),
        "Paddy_Brown_Spot": ("Paddy", "Brown Spot (Bipolaris oryzae)", "వరి గోధుమ రంగు మచ్చ తెగులు", "Medium"),
        "Paddy_Leaf_Smut": ("Paddy", "Leaf Smut (Entyloma oryzae)", "వరి ఆకు కాటుక తెగులు", "Medium"),
        "Paddy_Healthy": ("Paddy", "Healthy Paddy Crop", "ఆరోగ్యకరమైన వరి పైరు", "Low"),
        
        # Chilli / Pepper
        "Chilli_Bacterial_Spot": ("Chilli", "Chilli Bacterial Spot", "మిర్చి బ్యాక్టీరియల్ ఆకు మచ్చ తెగులు", "High"),
        "Chilli_Healthy": ("Chilli", "Healthy Chilli Crop", "ఆరోగ్యకరమైన మిర్చి పైరు", "Low"),
        "Pepper___Bacterial_spot": ("Chilli", "Chilli Bacterial Spot", "మిర్చి బ్యాక్టీరియల్ ఆకు మచ్చ తెగులు", "High"),
        "Pepper___healthy": ("Chilli", "Healthy Chilli Crop", "ఆరోగ్యకరమైన మిర్చి పైరు", "Low"),
        
        # Maize / Corn
        "Maize_Gray_Leaf_Spot": ("Maize", "Maize Gray Leaf Spot", "మొక్కజొన్న బూడిద మచ్చ తెగులు", "Medium"),
        "Maize_Common_Rust": ("Maize", "Maize Common Rust", "మొక్కజొన్న సాధారణ తుప్పు తెగులు", "High"),
        "Maize_Healthy": ("Maize", "Healthy Maize Crop", "ఆరోగ్యకరమైన మొక్కజొన్న పైరు", "Low"),
        "Maize_Northern_Leaf_Blight": ("Maize", "Maize Northern Leaf Blight", "మొక్కజొన్న ఉత్తర ఆకు ఎండు తెగులు", "High"),
        "Corn___Cercospora_leaf_spot_Gray_leaf_spot": ("Maize", "Maize Gray Leaf Spot", "మొక్కజొన్న బూడిద మచ్చ తెగులు", "Medium"),
        "Corn___Common_rust_": ("Maize", "Maize Common Rust", "మొక్కజొన్న సాధారణ తుప్పు తెగులు", "High"),
        "Corn___Northern_Leaf_Blight": ("Maize", "Maize Northern Leaf Blight", "మొక్కజొన్న ఉత్తర ఆకు ఎండు తెగులు", "High"),
        "Corn___healthy": ("Maize", "Healthy Maize Crop", "ఆరోగ్యకరమైన మొక్కజొన్న పైరు", "Low"),
    }

    def __init__(self):
        self.model_dir = os.path.join(os.path.dirname(__file__), "models")
        self.device = torch.device("cuda:0" if torch.cuda.is_available() else "cpu")
        
        self.transform = transforms.Compose([
            transforms.Resize((224, 224)),
            transforms.ToTensor(),
            transforms.Normalize([0.485, 0.456, 0.406], [0.229, 0.224, 0.225])
        ])

        self.loaded_models = {}
        self.loaded_indices = {}
        self._load_all_models()

    def _load_single_model(self, model_name: str):
        model_path = os.path.join(self.model_dir, f"{model_name}.pt")
        indices_path = os.path.join(self.model_dir, "class_indices.json") if model_name == "crop_disease_model" else os.path.join(self.model_dir, f"{model_name}_indices.json")
        if not os.path.exists(indices_path) and os.path.exists(os.path.join(self.model_dir, "class_indices.json")):
            indices_path = os.path.join(self.model_dir, "class_indices.json")

        if not os.path.exists(model_path) or not os.path.exists(indices_path):
            print(f"[RealDiseaseClassifier] Model or indices file not found for {model_name} at {model_path}")
            return None, None

        with open(indices_path, "r") as f:
            raw_idx = json.load(f)
            class_indices = {int(k): v for k, v in raw_idx.items()}

        num_classes = len(class_indices)
        model = models.mobilenet_v3_small(weights=None)
        in_features = model.classifier[3].in_features
        model.classifier[3] = nn.Linear(in_features, num_classes)

        state_dict = torch.load(model_path, map_location=self.device)
        model.load_state_dict(state_dict)
        model.to(self.device)
        model.eval()
        print(f"[RealDiseaseClassifier SUCCESS] Loaded model '{model_name}' ({num_classes} classes).")
        return model, class_indices

    def _load_all_models(self):
        model_names = ["crop_disease_model", "target_crop_model", "cotton_model", "paddy_model", "chilli_model", "maize_model"]
        for name in model_names:
            m, idxs = self._load_single_model(name)
            if m is not None:
                self.loaded_models[name] = m
                self.loaded_indices[name] = idxs

    def predict(self, image_bytes: bytes, selected_crop: Optional[str] = None) -> Dict[str, Any]:
        if not image_bytes or len(image_bytes) < 100:
            return {
                "crop": selected_crop or "Crop",
                "disease": "Unable to confidently identify the problem. Please capture a clearer image of the affected leaf.",
                "disease_telugu": "చిత్రం సరిగ్గా స్పష్టంగా లేదు. దయచేసి వ్యాధి సోకిన ఆకు పై మళ్ళీ స్పష్టమైన ఫోటో తీయండి.",
                "confidence": 0.0,
                "risk_level": "Unknown",
                "is_low_confidence": True
            }

        # Determine which model to route to based on selected_crop
        crop_key = (selected_crop or "").lower().strip()
        if "cotton" in crop_key and "cotton_model" in self.loaded_models:
            model_key = "cotton_model"
        elif ("paddy" in crop_key or "rice" in crop_key) and "paddy_model" in self.loaded_models:
            model_key = "paddy_model"
        elif ("chilli" in crop_key or "pepper" in crop_key) and "chilli_model" in self.loaded_models:
            model_key = "chilli_model"
        elif ("maize" in crop_key or "corn" in crop_key) and "maize_model" in self.loaded_models:
            model_key = "maize_model"
        elif "target_crop_model" in self.loaded_models:
            model_key = "target_crop_model"
        elif "crop_disease_model" in self.loaded_models:
            model_key = "crop_disease_model"
        else:
            model_key = list(self.loaded_models.keys())[0] if self.loaded_models else None

        if not model_key:
            return {
                "crop": selected_crop or "Crop",
                "disease": "Classifier Model Not Available",
                "disease_telugu": "మోడల్ లోడ్ కాలేదు",
                "confidence": 0.0,
                "risk_level": "Unknown",
                "is_low_confidence": True
            }

        try:
            img = Image.open(io.BytesIO(image_bytes)).convert("RGB")
            tensor = self.transform(img).unsqueeze(0).to(self.device)

            model = self.loaded_models[model_key]
            class_indices = self.loaded_indices[model_key]

            with torch.no_grad():
                logits = model(tensor)
                probs = torch.softmax(logits, dim=1)[0]
                top_prob, top_idx = torch.max(probs, dim=0)

            confidence = float(top_prob.item())
            class_key = class_indices.get(top_idx.item(), "Maize_Healthy")

            if class_key in self.TELUGU_CLASS_MAP:
                crop_name, disease_name, telugu_name, default_risk = self.TELUGU_CLASS_MAP[class_key]
            else:
                crop_name = selected_crop or "Crop"
                disease_name = class_key.replace("_", " ")
                telugu_name = f"{crop_name} {disease_name}"
                default_risk = "Low" if "healthy" in disease_name.lower() else "Medium"

            # Low confidence handling
            if confidence < 0.40:
                return {
                    "crop": crop_name,
                    "disease": "Unable to confidently identify the problem. Please capture a clearer image of the affected leaf.",
                    "disease_telugu": "సమస్యను ఖచ్చితంగా గుర్తించలేకపోయాము. దయచేసి వ్యాధి సోకిన ఆకు పై మళ్ళీ స్పష్టమైన ఫోటో తీయండి.",
                    "confidence": round(confidence, 4),
                    "risk_level": "Unknown",
                    "is_low_confidence": True
                }

            return {
                "crop": crop_name,
                "disease": disease_name,
                "disease_telugu": telugu_name,
                "confidence": round(confidence, 4),
                "risk_level": default_risk,
                "is_low_confidence": False
            }

        except Exception as e:
            print(f"[RealDiseaseClassifier ERROR] Inference failed: {e}")
            return {
                "crop": selected_crop or "Crop",
                "disease": "Invalid or Corrupted Image File",
                "disease_telugu": "ఫోటో లోపం ఉంది",
                "confidence": 0.0,
                "risk_level": "Unknown",
                "is_low_confidence": True
            }
