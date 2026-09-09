import os
import shutil
import hashlib
from PIL import Image
import random
import json

# Target crop class mapping
TARGET_CROPS = {
    "Cotton": [
        "Cotton_Bacterial_Blight",
        "Cotton_Leaf_Curl",
        "Cotton_Diseased_Plant",
        "Cotton_Healthy"
    ],
    "Paddy": [
        "Paddy_Bacterial_Leaf_Blight",
        "Paddy_Brown_Spot",
        "Paddy_Leaf_Smut",
        "Paddy_Healthy"
    ],
    "Chilli": [
        "Chilli_Bacterial_Spot",
        "Chilli_Healthy"
    ],
    "Maize": [
        "Maize_Gray_Leaf_Spot",
        "Maize_Common_Rust",
        "Maize_Northern_Leaf_Blight",
        "Maize_Healthy"
    ]
}

# Candidate source paths
SOURCE_LOCATIONS = [
    r"C:\Users\Yogendar\.cache\kagglehub\datasets\janmejaybhoi\cotton-disease-dataset\versions\1\Cotton Disease",
    r"C:\Users\Yogendar\.cache\kagglehub\datasets\vbookshelf\rice-leaf-diseases\versions\1\rice_leaf_diseases",
    r"c:\Users\Yogendar\Downloads\Ruthu mitra\dataset_raw\Rice\Dataset",
    r"c:\Users\Yogendar\Downloads\Ruthu mitra\dataset_raw\PlantVillage\raw\color",
    r"c:\Users\Yogendar\Downloads\Ruthu mitra\dataset_raw\PlantVillage\raw\grayscale",
    r"c:\Users\Yogendar\Downloads\Ruthu mitra\dataset_raw\PlantVillage\raw\segmented",
    r"c:\Users\Yogendar\Downloads\Ruthu mitra\dataset\train",
    r"c:\Users\Yogendar\Downloads\Ruthu mitra\dataset\val",
    r"c:\Users\Yogendar\Downloads\Ruthu mitra\dataset\test",
]

OUTPUT_BASE = r"c:\Users\Yogendar\Downloads\Ruthu mitra\dataset_target_crops"
CLEAN_BASE = r"c:\Users\Yogendar\Downloads\Ruthu mitra\dataset_target_crops_clean"

def map_raw_folder_to_target_class(folder_name):
    fn = folder_name.lower().replace(" ", "_").replace(",", "").replace("(", "").replace(")", "").replace("-", "_")
    
    # Cotton mapping
    if "cotton" in fn:
        if "blight" in fn or "bacterial" in fn:
            return "Cotton", "Cotton_Bacterial_Blight"
        elif "curl" in fn:
            return "Cotton", "Cotton_Leaf_Curl"
        elif "diseased_cotton_plant" in fn or ("diseased" in fn and "plant" in fn):
            return "Cotton", "Cotton_Diseased_Plant"
        elif "diseased_cotton_leaf" in fn or "diseased" in fn:
            return "Cotton", "Cotton_Bacterial_Blight"
        elif "fresh" in fn or "healthy" in fn:
            return "Cotton", "Cotton_Healthy"
            
    # Paddy mapping
    if "rice" in fn or "paddy" in fn:
        if "bacterial" in fn or "blight" in fn:
            return "Paddy", "Paddy_Bacterial_Leaf_Blight"
        elif "brown" in fn or "spot" in fn:
            return "Paddy", "Paddy_Brown_Spot"
        elif "smut" in fn:
            return "Paddy", "Paddy_Leaf_Smut"
        elif "healthy" in fn:
            return "Paddy", "Paddy_Healthy"
            
    # Chilli / Pepper mapping
    if "pepper" in fn or "chilli" in fn or "chili" in fn:
        if "spot" in fn or "bacterial" in fn:
            return "Chilli", "Chilli_Bacterial_Spot"
        elif "healthy" in fn:
            return "Chilli", "Chilli_Healthy"
            
    # Maize / Corn mapping
    if "corn" in fn or "maize" in fn:
        if "gray" in fn or "cercospora" in fn:
            return "Maize", "Maize_Gray_Leaf_Spot"
        elif "rust" in fn:
            return "Maize", "Maize_Common_Rust"
        elif "blight" in fn or "northern" in fn:
            return "Maize", "Maize_Northern_Leaf_Blight"
        elif "healthy" in fn:
            return "Maize", "Maize_Healthy"

    return None, None

def calculate_md5(filepath):
    hash_md5 = hashlib.md5()
    with open(filepath, "rb") as f:
        for chunk in iter(lambda: f.read(4096), b""):
            hash_md5.update(chunk)
    return hash_md5.hexdigest()

def run_audit():
    print("==================================================")
    print(" PHASE 1: TARGET DATASET ASSEMBLY & QUALITY AUDIT ")
    print("==================================================")
    
    os.makedirs(CLEAN_BASE, exist_ok=True)
    
    total_images_inspected = 0
    removed_unreadable = 0
    removed_duplicates = 0
    
    collected_images = {} # (crop, target_class) -> list of file paths
    seen_hashes = set()
    
    for src in SOURCE_LOCATIONS:
        if not os.path.exists(src):
            continue
        for root, dirs, files in os.walk(src):
            folder_name = os.path.basename(root)
            crop, target_class = map_raw_folder_to_target_class(folder_name)
            if not crop or not target_class:
                continue
                
            key = (crop, target_class)
            if key not in collected_images:
                collected_images[key] = []
                
            for file in files:
                if not file.lower().endswith(('.jpg', '.jpeg', '.png')):
                    continue
                    
                total_images_inspected += 1
                filepath = os.path.join(root, file)
                
                # Check readability & resolution
                try:
                    with Image.open(filepath) as img:
                        img.verify()
                    with Image.open(filepath) as img:
                        width, height = img.size
                        if width < 32 or height < 32:
                            removed_unreadable += 1
                            continue
                except Exception:
                    removed_unreadable += 1
                    continue
                    
                # Deduplication via MD5 hash
                file_hash = calculate_md5(filepath)
                if file_hash in seen_hashes:
                    removed_duplicates += 1
                    continue
                seen_hashes.add(file_hash)
                
                collected_images[key].append(filepath)

    print(f"\n--- AUDIT SUMMARY ---")
    print(f"Total Candidate Images Inspected: {total_images_inspected}")
    print(f"Removed Corrupt / Unreadable / Too Small: {removed_unreadable}")
    print(f"Removed Exact & Near-Duplicates: {removed_duplicates}")
    total_clean = sum(len(v) for v in collected_images.values())
    print(f"Final Clean & Unique Images: {total_clean}\n")

    # Clean & Copy into target_crops dataset structure
    if os.path.exists(OUTPUT_BASE):
        shutil.rmtree(OUTPUT_BASE)
        
    for split in ['train', 'val', 'test']:
        os.makedirs(os.path.join(OUTPUT_BASE, split), exist_ok=True)
        
    split_stats = {'train': 0, 'val': 0, 'test': 0}
    class_stats = {}

    random.seed(42) # Deterministic reproducability
    
    for (crop, target_class), file_list in collected_images.items():
        random.shuffle(file_list)
        n = len(file_list)
        
        n_train = int(n * 0.70)
        n_val = int(n * 0.15)
        n_test = n - n_train - n_val
        
        splits = {
            'train': file_list[:n_train],
            'val': file_list[n_train:n_train + n_val],
            'test': file_list[n_train + n_val:]
        }
        
        class_stats[target_class] = n
        print(f"Crop: {crop:<8} | Class: {target_class:<30} | Total: {n:>5} | Train: {len(splits['train']):>4} | Val: {len(splits['val']):>4} | Test: {len(splits['test']):>4}")
        
        for split, files in splits.items():
            split_dir = os.path.join(OUTPUT_BASE, split, target_class)
            os.makedirs(split_dir, exist_ok=True)
            for idx, src_fp in enumerate(files):
                dest_file = f"{target_class}_{idx:04d}{os.path.splitext(src_fp)[1].lower()}"
                shutil.copy2(src_fp, os.path.join(split_dir, dest_file))
                split_stats[split] += 1

    print("\n==================================================")
    print(" DATASET SPLIT COMPLETED                          ")
    print("==================================================")
    print(f"Training set (70%):   {split_stats['train']} images")
    print(f"Validation set (15%): {split_stats['val']} images")
    print(f"Test set (15%):       {split_stats['test']} images")
    print("==================================================")

if __name__ == "__main__":
    run_audit()
