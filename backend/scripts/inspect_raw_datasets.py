import os
import glob
import hashlib
from PIL import Image

def audit_raw_sources():
    raw_dir = "dataset_raw"
    if not os.path.exists(raw_dir):
        print("No dataset_raw directory found.")
        return

    print("==================================================")
    print("      DATASET SOURCE AUDIT & VERIFICATION SUMMARY ")
    print("==================================================")

    for item in os.listdir(raw_dir):
        path = os.path.join(raw_dir, item)
        if not os.path.isdir(path):
            continue
        
        # Find all images
        image_files = []
        for ext in ['*.jpg', '*.jpeg', '*.png', '*.JPG', '*.JPEG', '*.PNG']:
            image_files.extend(glob.glob(os.path.join(path, '**', ext), recursive=True))

        corrupted = 0
        md5_hashes = set()
        duplicates = 0
        classes = set()

        for img_path in image_files:
            # Class name from parent folder
            parent = os.path.basename(os.path.dirname(img_path))
            classes.add(parent)
            
            # Verify file integrity
            try:
                with Image.open(img_path) as img:
                    img.verify()
            except Exception:
                corrupted += 1
                continue

            # Check duplicate hash
            try:
                with open(img_path, 'rb') as f:
                    file_hash = hashlib.md5(f.read()).hexdigest()
                    if file_hash in md5_hashes:
                        duplicates += 1
                    else:
                        md5_hashes.add(file_hash)
            except Exception:
                pass

        print(f"\n--- DATASET SOURCE: {item} ---")
        print(f"Path: {path}")
        print(f"Total Images Found: {len(image_files)}")
        print(f"Corrupted Images: {corrupted}")
        print(f"Duplicate Images: {duplicates}")
        print(f"Distinct Classes Found ({len(classes)}): {sorted(list(classes))[:10]}")

if __name__ == "__main__":
    audit_raw_sources()
