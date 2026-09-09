import os
import shutil
import glob
import random
import hashlib
from PIL import Image

def build_dataset():
    random.seed(42)
    target_base = "dataset"
    if os.path.exists(target_base):
        shutil.rmtree(target_base, ignore_errors=True)

    for split in ['train', 'val', 'test']:
        os.makedirs(os.path.join(target_base, split), exist_ok=True)

    class_sources = [
        # Paddy (Rice)
        ("dataset_raw/Rice/Dataset/Bacterial leaf blight/*.*", "Paddy_Bacterial_Leaf_Blight"),
        ("dataset_raw/Rice/Dataset/Brown spot/*.*", "Paddy_Brown_Spot"),
        ("dataset_raw/Rice/Dataset/Leaf smut/*.*", "Paddy_Leaf_Smut"),

        # Maize (Corn) from PlantVillage raw/color
        ("dataset_raw/PlantVillage/raw/color/Corn_(maize)___Cercospora_leaf_spot Gray_leaf_spot/*.*", "Maize_Gray_Leaf_Spot"),
        ("dataset_raw/PlantVillage/raw/color/Corn_(maize)___Common_rust_/*.*", "Maize_Common_Rust"),
        ("dataset_raw/PlantVillage/raw/color/Corn_(maize)___Northern_Leaf_Blight/*.*", "Maize_Northern_Leaf_Blight"),
        ("dataset_raw/PlantVillage/raw/color/Corn_(maize)___healthy/*.*", "Maize_Healthy"),

        # Chilli (Pepper) from PlantVillage raw/color
        ("dataset_raw/PlantVillage/raw/color/Pepper,*Bacterial*/*.*", "Chilli_Bacterial_Spot"),
        ("dataset_raw/PlantVillage/raw/color/Pepper,*healthy*/*.*", "Chilli_Healthy"),

        # Cotton
        ("dataset_raw/Cotton/*.jpg", "Cotton_Bacterial_Blight"),
        ("dataset_raw/Cotton_Dark/static/uploads/*.jpg", "Cotton_Leaf_Curl"),
        ("dataset_raw/Cotton_Niaz/MODEL_SEND_BY_MUDASAR/*.jpg", "Cotton_Healthy"),
    ]

    seen_hashes = set()
    total_images_processed = 0

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

    print(f"Dataset rebuilt successfully. Total processed images: {total_images_processed}")

if __name__ == "__main__":
    build_dataset()
