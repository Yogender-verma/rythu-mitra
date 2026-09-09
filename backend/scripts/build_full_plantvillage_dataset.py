import os
import shutil
import glob
import random
import hashlib
from PIL import Image

def build_full_dataset():
    random.seed(42)
    target_base = "dataset"
    if os.path.exists(target_base):
        shutil.rmtree(target_base, ignore_errors=True)

    for split in ['train', 'val', 'test']:
        os.makedirs(os.path.join(target_base, split), exist_ok=True)

    pv_color_dir = "dataset_raw/PlantVillage/raw/color"
    class_sources = []

    # 1. Add all 38 folders from PlantVillage raw/color
    if os.path.exists(pv_color_dir):
        for folder_name in os.listdir(pv_color_dir):
            folder_path = os.path.join(pv_color_dir, folder_name)
            if os.path.isdir(folder_path):
                # Clean class name for model folder
                clean_name = folder_name.replace("_(including_sour)", "").replace(",_bell", "").replace("_(maize)", "").replace(" ", "_")
                class_sources.append((os.path.join(folder_path, "*.*"), clean_name))

    # 2. Add Rice classes
    class_sources.extend([
        ("dataset_raw/Rice/Dataset/Bacterial leaf blight/*.*", "Paddy_Bacterial_Leaf_Blight"),
        ("dataset_raw/Rice/Dataset/Brown spot/*.*", "Paddy_Brown_Spot"),
        ("dataset_raw/Rice/Dataset/Leaf smut/*.*", "Paddy_Leaf_Smut"),
    ])

    # 3. Add Cotton classes
    class_sources.extend([
        ("dataset_raw/Cotton/*.jpg", "Cotton_Bacterial_Blight"),
        ("dataset_raw/Cotton_Dark/static/uploads/*.jpg", "Cotton_Leaf_Curl"),
        ("dataset_raw/Cotton_Niaz/MODEL_SEND_BY_MUDASAR/*.jpg", "Cotton_Healthy"),
    ])

    seen_hashes = set()
    total_images_processed = 0
    processed_classes = 0

    for glob_pattern, class_name in class_sources:
        matching_files = glob.glob(glob_pattern)
        valid_files = []

        for fpath in matching_files:
            if not os.path.isfile(fpath):
                continue
            try:
                with Image.open(fpath) as img:
                    img.verify()
            except Exception:
                continue

            try:
                with open(fpath, 'rb') as f:
                    h = hashlib.md5(f.read()).hexdigest()
                    if h in seen_hashes:
                        continue
                    seen_hashes.add(h)
            except Exception:
                pass

            valid_files.append(fpath)

        random.shuffle(valid_files)

        if not valid_files:
            continue

        n_total = len(valid_files)
        processed_classes += 1
        
        # Split 70% train, 15% val, 15% test
        if n_total >= 3:
            n_train = max(1, int(n_total * 0.70))
            n_val = max(1, int(n_total * 0.15))
            n_test = n_total - n_train - n_val
            if n_test <= 0:
                n_test = 1
                n_val = max(1, n_val - 1)
            train_files = valid_files[:n_train]
            val_files = valid_files[n_train:n_train + n_val]
            test_files = valid_files[n_train + n_val:]
            if not test_files:
                test_files = [valid_files[-1]]
        else:
            train_files = [valid_files[0]]
            val_files = [valid_files[0]]
            test_files = [valid_files[-1]]

        for split_name, file_list in [('train', train_files), ('val', val_files), ('test', test_files)]:
            split_dir = os.path.join(target_base, split_name, class_name)
            os.makedirs(split_dir, exist_ok=True)
            for idx, src_file in enumerate(file_list):
                ext = os.path.splitext(src_file)[1] or '.jpg'
                dst_file = os.path.join(split_dir, f"{class_name}_{idx:04d}{ext}")
                shutil.copy2(src_file, dst_file)
                total_images_processed += 1

    print("==================================================")
    print("      ALL-CROP PLANTVILLAGE DATASET BUILD         ")
    print("==================================================")
    print(f"Total Verified Classes Processed: {processed_classes}")
    print(f"Total Valid Images Processed: {total_images_processed}")
    print("==================================================")

if __name__ == "__main__":
    build_full_dataset()
