import os
import sys
import glob

# Add backend directory to sys.path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from app.ml.real_classifier import RealDiseaseClassifier

def test_inference():
    print("==================================================")
    print("      REAL IMAGE PYTORCH INFERENCE TEST           ")
    print("==================================================")

    test_images = glob.glob("dataset/test/*/*.*")
    if not test_images:
        print("ERROR: No test images found in dataset/test")
        return

    test_image_path = test_images[0]
    true_class = os.path.basename(os.path.dirname(test_image_path))
    print(f"Selected Test Image: {test_image_path}")
    print(f"True Ground Truth Class: {true_class}")

    with open(test_image_path, "rb") as f:
        image_bytes = f.read()

    classifier = RealDiseaseClassifier()
    result = classifier.predict(image_bytes, selected_crop="Maize")

    print("\n--- PyTorch Real Prediction Result ---")
    print(f"Crop: {result['crop']}")
    print(f"Disease: {result['disease']}")
    print(f"Disease (Telugu): {result['disease_telugu']}")
    print(f"Confidence: {result['confidence'] * 100:.2f}%")
    print(f"Risk Level: {result['risk_level']}")
    print(f"Is Low Confidence: {result['is_low_confidence']}")
    print("==================================================\n")

if __name__ == "__main__":
    test_inference()
