import os
import sys

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))
sys.stdout.reconfigure(encoding='utf-8')

from app.ml.real_classifier import RealDiseaseClassifier

DATASET_DIR = r"c:\Users\Yogendar\Downloads\Ruthu mitra\dataset_target_crops"
SCRATCH_DIR = r"c:\Users\Yogendar\Downloads\Ruthu mitra\scratch_test"

def run_direct_inference():
    print("==================================================")
    print(" STEP 8: DIRECT MODEL INFERENCE CHECK             ")
    print("==================================================")

    classifier = RealDiseaseClassifier()

    test_images = [
        ("Cotton", os.path.join(DATASET_DIR, "cotton_test", "Cotton_Bacterial_Blight", "Cotton_Bacterial_Blight_0001.jpg"), "Cotton Bacterial Blight"),
        ("Cotton", os.path.join(DATASET_DIR, "cotton_test", "Cotton_Healthy", "Cotton_Healthy_0001.jpg"), "Healthy Cotton"),
        
        ("Paddy", os.path.join(DATASET_DIR, "paddy_test", "Paddy_Bacterial_Leaf_Blight", "Paddy_Bacterial_Leaf_Blight_0001.jpg"), "Paddy Bacterial Leaf Blight"),
        ("Paddy", os.path.join(DATASET_DIR, "paddy_test", "Paddy_Leaf_Smut", "Paddy_Leaf_Smut_0001.jpg"), "Paddy Leaf Smut"),
        
        ("Chilli", os.path.join(DATASET_DIR, "chilli_test", "Chilli_Bacterial_Spot", "Chilli_Bacterial_Spot_0001.JPG"), "Chilli Bacterial Spot"),
        ("Chilli", os.path.join(DATASET_DIR, "chilli_test", "Chilli_Healthy", "Chilli_Healthy_0001.JPG"), "Healthy Chilli"),
        
        ("Maize", os.path.join(DATASET_DIR, "maize_test", "Maize_Northern_Leaf_Blight", "Maize_Northern_Leaf_Blight_0001.JPG"), "Maize Northern Leaf Blight"),
        ("Maize", os.path.join(DATASET_DIR, "maize_test", "Maize_Healthy", "Maize_Healthy_0001.JPG"), "Healthy Maize"),
    ]

    for crop, img_path, expected_desc in test_images:
        print(f"\n--------------------------------------------------")
        print(f"Target Crop: {crop} | Expected: {expected_desc}")
        print(f"File Path:   {os.path.basename(img_path)}")
        if not os.path.exists(img_path):
            print("  [ERROR] File does not exist!")
            continue

        with open(img_path, "rb") as f:
            img_bytes = f.read()

        result = classifier.predict(img_bytes, selected_crop=crop)
        print(f"  * Checkpoint Used: crop_disease_model.pt (43 classes)")
        print(f"  * Predicted Class: {result.get('disease')}")
        print(f"  * Telugu Name:     {result.get('disease_telugu')}")
        print(f"  * Confidence:      {result.get('confidence')*100:.2f}%")
        print(f"  * Low Confidence:  {result.get('is_low_confidence')}")

if __name__ == "__main__":
    run_direct_inference()
