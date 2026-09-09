import os
import sys
import glob
import random

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))
from app.ml.real_classifier import RealDiseaseClassifier

def test_all():
    classifier = RealDiseaseClassifier()
    test_folders = glob.glob("dataset/test/*")
    random.seed(42)
    random.shuffle(test_folders)

    print("==================================================")
    print("      MULTI-CROP PYTORCH INFERENCE VERIFICATION   ")
    print("==================================================")

    for folder in test_folders[:5]:
        imgs = glob.glob(os.path.join(folder, "*.*"))
        if not imgs:
            continue
        test_img = imgs[0]
        true_cls = os.path.basename(folder)

        with open(test_img, "rb") as f:
            image_bytes = f.read()

        res = classifier.predict(image_bytes, selected_crop="Auto")
        print(f"\nGround Truth Class: {true_cls}")
        print(f"  -> Predicted Crop: {res['crop']}")
        print(f"  -> Predicted Disease: {res['disease']}")
        print(f"  -> Confidence: {res['confidence'] * 100:.2f}%")
        print(f"  -> Risk Level: {res['risk_level']}")

    print("\n==================================================")

if __name__ == "__main__":
    test_all()
