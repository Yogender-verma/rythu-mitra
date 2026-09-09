import os
import sys
import json
import torch
import torch.nn as nn
from torchvision import transforms, models
from PIL import Image

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

DATASET_DIR = r"c:\Users\Yogendar\Downloads\Ruthu mitra\dataset_target_crops"
MODEL_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "app", "ml", "models"))

def diagnose():
    print("==================================================")
    print(" 1 - 7: CHECKPOINT & CLASS MAPPING DIAGNOSTICS")
    print("==================================================")
    
    # 1 & 2. Check model file existence
    model_path = os.path.join(MODEL_DIR, "crop_disease_model.pt")
    indices_path = os.path.join(MODEL_DIR, "class_indices.json")
    
    print(f"Model Path:   {model_path} | Exists: {os.path.exists(model_path)}")
    print(f"Indices Path: {indices_path} | Exists: {os.path.exists(indices_path)}")
    
    if os.path.exists(indices_path):
        with open(indices_path, "r") as f:
            indices_data = json.load(f)
        print(f"Indices Entry Count: {len(indices_data)}")
        print(f"Indices Content Preview: {list(indices_data.items())[:10]}")
    
    device = torch.device("cuda:0" if torch.cuda.is_available() else "cpu")
    if os.path.exists(model_path):
        state_dict = torch.load(model_path, map_location=device)
        out_features = state_dict["classifier.3.weight"].shape[0]
        print(f"Checkpoint Output Features (num_classes): {out_features}")

if __name__ == "__main__":
    diagnose()
