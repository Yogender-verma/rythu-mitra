import os
import json
import requests
from PIL import Image, ImageDraw

import sys
sys.stdout.reconfigure(encoding='utf-8')

API_URL = "http://127.0.0.1:8000/api/scans"
DATASET_DIR = r"c:\Users\Yogendar\Downloads\Ruthu mitra\dataset_target_crops"
SCRATCH_DIR = r"c:\Users\Yogendar\Downloads\Ruthu mitra\scratch_test"

os.makedirs(SCRATCH_DIR, exist_ok=True)

def create_unclear_noise_image():
    # Synthetic blank/unclear noise image
    img = Image.new("RGB", (224, 224), color=(128, 128, 128))
    draw = ImageDraw.Draw(img)
    draw.rectangle([50, 50, 150, 150], fill=(130, 130, 130))
    path = os.path.join(SCRATCH_DIR, "unclear_blur.jpg")
    img.save(path)
    return path

def test_api_scan(crop_name, image_path, expected_type="supported"):
    if not os.path.exists(image_path):
        print(f"Skipping missing file: {image_path}")
        return

    with open(image_path, "rb") as f:
        files = {"file": (os.path.basename(image_path), f, "image/jpeg")}
        data = {
            "crop": crop_name,
            "lat": "17.3850",
            "lon": "78.4867",
            "district": "Karimnagar",
            "mandal": "Choppadandi"
        }
        res = requests.post(API_URL, files=files, data=data)
        
    print(f"\n==================================================")
    print(f" TEST CASE [{expected_type.upper()}] - CROP: {crop_name}")
    print(f" Image: {os.path.basename(image_path)}")
    print(f" Status Code: {res.status_code}")
    
    if res.status_code == 200:
        j = res.json()
        diag = j.get("diagnosis", {})
        adv = j.get("advisory", {})
        weather = j.get("weather", {})
        
        print(f"  * Diagnosis (EN):   {diag.get('disease_en')}")
        print(f"  * Diagnosis (TE):   {diag.get('disease_te')}")
        print(f"  * Confidence:       {diag.get('confidence')*100:.2f}%")
        print(f"  * Is Healthy:       {diag.get('is_healthy')}")
        print(f"  * Low Confidence:   {diag.get('is_low_confidence')}")
        print(f"  * Weather Location: {weather.get('location_name')}")
        print(f"  * Live Temp/Hum:    {weather.get('temperature')} / {weather.get('humidity')}")
        print(f"  * Why (TE):         {adv.get('why_te')[:90]}...")
        print(f"  * Actions (TE):     {adv.get('actions_te')[:90]}...")
        print(f"  * Audio URL:        {j.get('audio_url')}")

def run_validation():
    print("==================================================")
    print(" FINAL END-TO-END VALIDATION SUITE                ")
    print("==================================================")
    
    # Test cases per crop
    test_cases = [
        # Cotton Supported & Healthy
        ("Cotton", os.path.join(DATASET_DIR, "cotton_test", "Cotton_Bacterial_Blight", "Cotton_Bacterial_Blight_0000.jpg"), "Supported Disease"),
        ("Cotton", os.path.join(DATASET_DIR, "cotton_test", "Cotton_Healthy", "Cotton_Healthy_0000.jpg"), "Healthy Crop"),
        
        # Paddy Supported & Healthy
        ("Paddy", os.path.join(DATASET_DIR, "paddy_test", "Paddy_Bacterial_Leaf_Blight", "Paddy_Bacterial_Leaf_Blight_0000.jpg"), "Supported Disease"),
        ("Paddy", os.path.join(DATASET_DIR, "paddy_test", "Paddy_Brown_Spot", "Paddy_Brown_Spot_0000.jpg"), "Supported Disease"),
        
        # Chilli Supported & Healthy
        ("Chilli", os.path.join(DATASET_DIR, "chilli_test", "Chilli_Bacterial_Spot", "Chilli_Bacterial_Spot_0000.JPG"), "Supported Disease"),
        ("Chilli", os.path.join(DATASET_DIR, "chilli_test", "Chilli_Healthy", "Chilli_Healthy_0000.JPG"), "Healthy Crop"),
        
        # Maize Supported & Healthy
        ("Maize", os.path.join(DATASET_DIR, "maize_test", "Maize_Common_Rust", "Maize_Common_Rust_0000.JPG"), "Supported Disease"),
        ("Maize", os.path.join(DATASET_DIR, "maize_test", "Maize_Healthy", "Maize_Healthy_0000.JPG"), "Healthy Crop"),
        
        # Unclear / Low-Confidence Image
        ("Cotton", create_unclear_noise_image(), "Unclear / Low-Confidence Fallback"),
    ]

    for crop, img_p, exp_t in test_cases:
        test_api_scan(crop, img_p, exp_t)

if __name__ == "__main__":
    run_validation()
