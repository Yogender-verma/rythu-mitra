import os
import sys
import json
import requests
from PIL import Image, ImageDraw

sys.stdout.reconfigure(encoding='utf-8')

API_URL = "http://127.0.0.1:8000/api/scans"
HISTORY_URL = "http://127.0.0.1:8000/api/scans/history?user_id=1"
DATASET_DIR = r"c:\Users\Yogendar\Downloads\Ruthu mitra\dataset_target_crops"
SCRATCH_DIR = r"c:\Users\Yogendar\Downloads\Ruthu mitra\scratch_test"

os.makedirs(SCRATCH_DIR, exist_ok=True)

def create_noisy_unclear_image():
    img = Image.new("RGB", (224, 224), color=(140, 140, 140))
    path = os.path.join(SCRATCH_DIR, "unclear_photo.jpg")
    img.save(path)
    return path

def test_external_image(crop_name, image_path, test_desc):
    if not os.path.exists(image_path):
        print(f"Skipping missing file: {image_path}")
        return None

    with open(image_path, "rb") as f:
        files = {"file": (os.path.basename(image_path), f, "image/jpeg")}
        data = {
            "lat": "17.9689",  # Test coordinates for Warangal
            "lon": "79.5941",
            "district": "Warangal",
            "mandal": "Ghanpur"
        }
        res = requests.post(API_URL, files=files, data=data)
        
    print(f"\n--------------------------------------------------")
    print(f" TEST CASE: {test_desc}")
    print(f" Crop: {crop_name} | Image: {os.path.basename(image_path)}")
    print(f" API Response Status: {res.status_code}")
    
    if res.status_code == 200:
        j = res.json()
        diag = j.get("diagnosis", {})
        adv = j.get("advisory", {})
        w = j.get("weather", {})
        
        print(f"  * Scan ID:           {j.get('scan_id')}")
        print(f"  * Disease (EN):      {diag.get('disease_en')}")
        print(f"  * Disease (TE):      {diag.get('disease_te')}")
        print(f"  * Confidence:        {diag.get('confidence')*100:.2f}%")
        print(f"  * Is Healthy:        {diag.get('is_healthy')}")
        print(f"  * Is Low Confidence: {diag.get('is_low_confidence')}")
        print(f"  * Location Name:     {w.get('location_name')}")
        print(f"  * Temp / Humidity:   {w.get('temperature')} / {w.get('humidity')}")
        print(f"  * Weather Condition: {w.get('condition_telugu')} ({w.get('condition')})")
        print(f"  * Season (TE):       {adv.get('season_te')}")
        print(f"  * Why It Happened:   {adv.get('why_te')[:80]}...")
        print(f"  * What To Do:        {adv.get('actions_te')[:80]}...")
        print(f"  * Audio URL:         {j.get('audio_url')}")
        return j
    return None

def verify_history(scan_id):
    res = requests.get(HISTORY_URL)
    if res.status_code == 200:
        history = res.json().get("history", [])
        found = any(s.get("id") == scan_id for s in history)
        print(f"\nHistory Persistence Verification for Scan ID '{scan_id}': {'PASSED (Found in DB)' if found else 'FAILED'}")
        return found
    print("History GET failed")
    return False

def run_validation():
    print("==================================================")
    print(" FINAL REAL-WORLD VALIDATION PASS                 ")
    print("==================================================")
    
    # Test cases across Cotton, Paddy, Chilli, Maize
    test_cases = [
        ("Cotton", os.path.join(DATASET_DIR, "cotton_test", "Cotton_Bacterial_Blight", "Cotton_Bacterial_Blight_0001.jpg"), "Cotton - Supported Disease (Bacterial Blight)"),
        ("Cotton", os.path.join(DATASET_DIR, "cotton_test", "Cotton_Healthy", "Cotton_Healthy_0001.jpg"), "Cotton - Healthy Leaf"),
        
        ("Paddy", os.path.join(DATASET_DIR, "paddy_test", "Paddy_Bacterial_Leaf_Blight", "Paddy_Bacterial_Leaf_Blight_0001.jpg"), "Paddy - Supported Disease (Leaf Blight)"),
        ("Paddy", os.path.join(DATASET_DIR, "paddy_test", "Paddy_Leaf_Smut", "Paddy_Leaf_Smut_0001.jpg"), "Paddy - Supported Disease (Leaf Smut)"),
        
        ("Chilli", os.path.join(DATASET_DIR, "chilli_test", "Chilli_Bacterial_Spot", "Chilli_Bacterial_Spot_0001.JPG"), "Chilli - Supported Disease (Bacterial Spot)"),
        ("Chilli", os.path.join(DATASET_DIR, "chilli_test", "Chilli_Healthy", "Chilli_Healthy_0001.JPG"), "Chilli - Healthy Leaf"),
        
        ("Maize", os.path.join(DATASET_DIR, "maize_test", "Maize_Northern_Leaf_Blight", "Maize_Northern_Leaf_Blight_0001.JPG"), "Maize - Supported Disease (Northern Blight)"),
        ("Maize", os.path.join(DATASET_DIR, "maize_test", "Maize_Healthy", "Maize_Healthy_0001.JPG"), "Maize - Healthy Leaf"),
        
        ("Chilli", create_noisy_unclear_image(), "Low Confidence Fallback (Noisy Unclear Photo)")
    ]

    last_scan_id = None
    for crop, img_p, desc in test_cases:
        res_json = test_external_image(crop, img_p, desc)
        if res_json:
            last_scan_id = res_json.get("scan_id")

    if last_scan_id:
        verify_history(last_scan_id)

if __name__ == "__main__":
    run_validation()
