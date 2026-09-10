import os
import sys
from app.ml.real_classifier import RealDiseaseClassifier

# Ensure UTF-8 output
sys.stdout.reconfigure(encoding='utf-8')

clf = RealDiseaseClassifier()
print("\n" + "="*60)
print("RealDiseaseClassifier Loaded Models:", list(clf.loaded_models.keys()))
print("="*60)

test_paths = [
    (r"C:\Users\shara\Downloads\cotton\bacterial_blight", "Cotton"),
    (r"C:\Users\shara\Downloads\cotton\curl_virus", "Cotton"),
    (r"C:\Users\shara\Downloads\cotton\fussarium_wilt", "Cotton"),
    (r"C:\Users\shara\Downloads\cotton\healthy", "Cotton")
]

from app.services.advisory_engine import AdvisoryEngine

for folder, crop in test_paths:
    sample_file = os.listdir(folder)[0]
    fp = os.path.join(folder, sample_file)
    with open(fp, "rb") as f:
        data = f.read()
    res = clf.predict(data, selected_crop=crop)
    
    # Also verify advisory engine
    adv = AdvisoryEngine.get_advisory(crop=crop, disease_key=res.get("disease_key") or res.get("disease"))

    print(f"[*] Input Folder: {os.path.basename(folder)}")
    print(f"    File: {sample_file}")
    print(f"    Crop: {res.get('crop')}")
    print(f"    Disease: {res.get('disease')}")
    print(f"    Disease Key: {res.get('disease_key')}")
    print(f"    Telugu: {res.get('disease_telugu')}")
    print(f"    Confidence: {res.get('confidence') * 100:.2f}%")
    print(f"    Risk Level: {res.get('risk_level')}")
    print(f"    Advisory Disease Matched: {adv.get('disease_en')}")
    print(f"    Advisory Dosage (TE): {adv.get('dosage_te')}")
    print("-" * 50)
