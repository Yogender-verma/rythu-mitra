import os
import json
from torchvision import datasets

MODEL_DIR = r"c:\Users\Yogendar\Downloads\Ruthu mitra\backend\app\ml\models"
TRAIN_DIR = r"c:\Users\Yogendar\Downloads\Ruthu mitra\dataset\train"
INDICES_PATH = os.path.join(MODEL_DIR, "class_indices.json")

def fix_indices():
    ds = datasets.ImageFolder(TRAIN_DIR)
    classes = ds.classes
    class_indices = {str(i): cls_name for i, cls_name in enumerate(classes)}
    
    with open(INDICES_PATH, "w") as f:
        json.dump(class_indices, f, indent=2)
    
    print(f"Successfully generated exact training class_indices.json with {len(class_indices)} classes!")

if __name__ == "__main__":
    fix_indices()
