import os
import json

MODEL_DIR = r"c:\Users\Yogendar\Downloads\Ruthu mitra\backend\app\ml\models"
CM_PATH = os.path.join(MODEL_DIR, "evaluation", "confusion_matrix.json")
INDICES_PATH = os.path.join(MODEL_DIR, "class_indices.json")

def fix_indices():
    with open(CM_PATH, "r") as f:
        cm_data = json.load(f)
    
    classes = cm_data["classes"]
    class_indices = {str(i): cls_name for i, cls_name in enumerate(classes)}
    
    with open(INDICES_PATH, "w") as f:
        json.dump(class_indices, f, indent=2)
    
    print(f"Fixed {INDICES_PATH} with {len(class_indices)} classes!")

if __name__ == "__main__":
    fix_indices()
