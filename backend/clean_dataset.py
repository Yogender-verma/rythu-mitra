import os
import hashlib
from PIL import Image

DATASET_DIR = r"C:\Users\shara\Downloads\cotton"

def get_file_hash(filepath: str) -> str:
    hasher = hashlib.md5()
    with open(filepath, "rb") as f:
        while chunk := f.read(65536):
            hasher.update(chunk)
    return hasher.hexdigest()

def clean_dataset(dataset_dir: str):
    print(f"[*] Starting dataset cleaning on: {dataset_dir}")
    if not os.path.exists(dataset_dir):
        raise FileNotFoundError(f"Dataset directory not found: {dataset_dir}")

    classes = [d for d in os.listdir(dataset_dir) if os.path.isdir(os.path.join(dataset_dir, d))]
    print(f"[*] Found {len(classes)} classes: {classes}")

    seen_hashes = {}
    duplicates = []
    corrupted = []
    valid_images = []

    total_scanned = 0

    for cls in sorted(classes):
        cls_dir = os.path.join(dataset_dir, cls)
        files = [f for f in os.listdir(cls_dir) if os.path.isfile(os.path.join(cls_dir, f))]
        print(f" -> Class '{cls}': {len(files)} files found.")
        
        for f in files:
            total_scanned += 1
            fp = os.path.join(cls_dir, f)
            
            # Check hash duplicate
            file_hash = get_file_hash(fp)
            if file_hash in seen_hashes:
                duplicates.append((fp, seen_hashes[file_hash]))
                continue
            
            seen_hashes[file_hash] = fp

            # Verify image readable
            try:
                with Image.open(fp) as img:
                    img.verify()
                # Also test convert to RGB
                with Image.open(fp) as img:
                    img.convert("RGB")
                valid_images.append(fp)
            except Exception as e:
                print(f"[!] Corrupt image detected: {fp} ({e})")
                corrupted.append(fp)

    print("\n" + "="*50)
    print(f"Total files scanned: {total_scanned}")
    print(f"Exact duplicates found: {len(duplicates)}")
    print(f"Corrupted files found: {len(corrupted)}")
    print("="*50)

    # Remove duplicates
    print(f"[*] Removing {len(duplicates)} duplicate files...")
    for dup_path, orig_path in duplicates:
        try:
            os.remove(dup_path)
        except Exception as e:
            print(f"[!] Error removing {dup_path}: {e}")

    # Remove corrupted
    print(f"[*] Removing {len(corrupted)} corrupted files...")
    for corrupt_path in corrupted:
        try:
            os.remove(corrupt_path)
        except Exception as e:
            print(f"[!] Error removing {corrupt_path}: {e}")

    # Final count
    print("\n[*] Final cleaned class distribution:")
    total_remaining = 0
    for cls in sorted(classes):
        cls_dir = os.path.join(dataset_dir, cls)
        remaining = len([f for f in os.listdir(cls_dir) if os.path.isfile(os.path.join(cls_dir, f))])
        total_remaining += remaining
        print(f" -> {cls}: {remaining} clean images")
    print(f"Total clean images ready for training: {total_remaining}")

if __name__ == "__main__":
    clean_dataset(DATASET_DIR)
