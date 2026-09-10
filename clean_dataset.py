import os
import json
import hashlib
import random
from PIL import Image
from collections import defaultdict
import concurrent.futures

DATASET_ROOT = r"C:\Users\shara\OneDrive\Desktop\F3"
OUTPUT_DIR = os.path.join(os.path.dirname(__file__), "dataset_metadata")
os.makedirs(OUTPUT_DIR, exist_ok=True)

RANDOM_SEED = 42
random.seed(RANDOM_SEED)

def inspect_and_verify_image(file_path):
    """
    Verifies image integrity, loads pixels, checks dimensions, and computes SHA256.
    Returns: (is_valid, reason, sha256_hash, width, height)
    """
    try:
        if not os.path.exists(file_path):
            return False, "File does not exist", None, 0, 0

        # Check extension
        ext = os.path.splitext(file_path)[1].lower()
        if ext not in [".jpg", ".jpeg", ".png"]:
            return False, f"Unsupported extension {ext}", None, 0, 0

        # Check for zero byte file
        if os.path.getsize(file_path) == 0:
            return False, "Zero byte file", None, 0, 0

        # Verification 1: PIL verify
        with Image.open(file_path) as img:
            img.verify()

        # Verification 2: PIL load (catches truncated data streams)
        with Image.open(file_path) as img:
            img.load()
            w, h = img.size
            if w < 10 or h < 10:
                return False, f"Image dimensions too small ({w}x{h})", None, w, h

        # Checksum calculation for duplicate detection
        hasher = hashlib.sha256()
        with open(file_path, "rb") as f:
            for chunk in iter(lambda: f.read(65536), b""):
                hasher.update(chunk)
        file_hash = hasher.hexdigest()

        return True, "Valid", file_hash, w, h

    except Exception as e:
        return False, str(e), None, 0, 0

def run_cleaning_pipeline():
    print(f"==================================================")
    print(f"RYTHU MITRA DATASET CLEANING & AUDIT PIPELINE")
    print(f"Scanning root: {DATASET_ROOT}")
    print(f"==================================================")

    entries = os.listdir(DATASET_ROOT)
    class_dirs = sorted([d for d in entries if os.path.isdir(os.path.join(DATASET_ROOT, d))])
    stray_files = [f for f in entries if os.path.isfile(os.path.join(DATASET_ROOT, f))]

    print(f"Found {len(class_dirs)} disease class directories.")
    print(f"Found {len(stray_files)} non-dataset stray files in root (will be excluded from ML data).")

    # Map class index
    class_to_idx = {cls_name: idx for idx, cls_name in enumerate(class_dirs)}
    idx_to_class = {idx: cls_name for idx, cls_name in enumerate(class_dirs)}

    audit_summary = {
        "total_files_examined": 0,
        "stray_root_files_excluded": len(stray_files),
        "corrupted_images_removed": [],
        "duplicate_images_removed": [],
        "class_stats": {}
    }

    seen_hashes = {}  # sha256 -> first_seen_filepath
    clean_class_images = defaultdict(list)

    for cls_name in class_dirs:
        class_path = os.path.join(DATASET_ROOT, cls_name)
        files = [os.path.join(class_path, f) for f in os.listdir(class_path)]
        audit_summary["total_files_examined"] += len(files)

        valid_in_class = 0
        corrupt_in_class = 0
        duplicate_in_class = 0

        # Run concurrent verification
        with concurrent.futures.ThreadPoolExecutor(max_workers=8) as executor:
            future_to_file = {executor.submit(inspect_and_verify_image, f): f for f in files}
            for future in concurrent.futures.as_completed(future_to_file):
                fpath = future_to_file[future]
                is_valid, reason, file_hash, w, h = future.result()

                if not is_valid:
                    corrupt_in_class += 1
                    audit_summary["corrupted_images_removed"].append({
                        "file": fpath,
                        "class": cls_name,
                        "reason": reason
                    })
                else:
                    if file_hash in seen_hashes:
                        duplicate_in_class += 1
                        audit_summary["duplicate_images_removed"].append({
                            "file": fpath,
                            "original": seen_hashes[file_hash],
                            "class": cls_name
                        })
                    else:
                        seen_hashes[file_hash] = fpath
                        clean_class_images[cls_name].append(fpath)
                        valid_in_class += 1

        audit_summary["class_stats"][cls_name] = {
            "total": len(files),
            "valid": valid_in_class,
            "corrupt": corrupt_in_class,
            "duplicate": duplicate_in_class
        }
        print(f"[{cls_name}] Total: {len(files)} | Valid: {valid_in_class} | Corrupt: {corrupt_in_class} | Duplicates: {duplicate_in_class}")

    total_valid = sum(len(v) for v in clean_class_images.values())
    total_corrupt = len(audit_summary["corrupted_images_removed"])
    total_dupes = len(audit_summary["duplicate_images_removed"])

    print(f"\n==================================================")
    print(f"CLEANING SUMMARY:")
    print(f"Total Examined: {audit_summary['total_files_examined']}")
    print(f"Corrupted Removed: {total_corrupt}")
    print(f"Duplicates Removed: {total_dupes}")
    print(f"Total Clean Valid Images: {total_valid}")
    print(f"==================================================")

    # Stratified Splits: 80% Train, 10% Val, 10% Test
    train_data = []
    val_data = []
    test_data = []

    for cls_name, file_list in clean_class_images.items():
        cls_idx = class_to_idx[cls_name]
        random.shuffle(file_list)

        n = len(file_list)
        n_train = int(0.80 * n)
        n_val = int(0.10 * n)
        n_test = n - n_train - n_val

        train_files = file_list[:n_train]
        val_files = file_list[n_train:n_train + n_val]
        test_files = file_list[n_train + n_val:]

        for fp in train_files:
            train_data.append({"path": fp, "class": cls_name, "label": cls_idx})
        for fp in val_files:
            val_data.append({"path": fp, "class": cls_name, "label": cls_idx})
        for fp in test_files:
            test_data.append({"path": fp, "class": cls_name, "label": cls_idx})

    # Shuffle splits
    random.shuffle(train_data)
    random.shuffle(val_data)
    random.shuffle(test_data)

    print(f"\nSPLIT SUMMARY (Zero data leakage):")
    print(f"Training Set (80%):   {len(train_data)} images")
    print(f"Validation Set (10%): {len(val_data)} images")
    print(f"Testing Set (10%):    {len(test_data)} images")

    # Save to disk
    with open(os.path.join(OUTPUT_DIR, "class_indices.json"), "w", encoding="utf-8") as f:
        json.dump(idx_to_class, f, indent=2)

    with open(os.path.join(OUTPUT_DIR, "train_split.json"), "w", encoding="utf-8") as f:
        json.dump(train_data, f, indent=2)

    with open(os.path.join(OUTPUT_DIR, "val_split.json"), "w", encoding="utf-8") as f:
        json.dump(val_data, f, indent=2)

    with open(os.path.join(OUTPUT_DIR, "test_split.json"), "w", encoding="utf-8") as f:
        json.dump(test_data, f, indent=2)

    with open(os.path.join(OUTPUT_DIR, "audit_summary.json"), "w", encoding="utf-8") as f:
        json.dump(audit_summary, f, indent=2)

    # Also copy class_indices.json to models folder
    models_dir = os.path.join(os.path.dirname(__file__), "backend", "app", "ml", "models")
    os.makedirs(models_dir, exist_ok=True)
    with open(os.path.join(models_dir, "class_indices.json"), "w", encoding="utf-8") as f:
        json.dump(idx_to_class, f, indent=2)

    print(f"\nMetadata and splits successfully saved to: {OUTPUT_DIR}")
    return audit_summary

if __name__ == "__main__":
    run_cleaning_pipeline()
