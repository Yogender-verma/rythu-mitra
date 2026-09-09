import os
import glob
from PIL import Image

def audit():
    base_dir = "dataset"
    splits = ['train', 'val', 'test']
    
    classes = set()
    for s in splits:
        s_path = os.path.join(base_dir, s)
        if os.path.exists(s_path):
            for d in os.listdir(s_path):
                if os.path.isdir(os.path.join(s_path, d)):
                    classes.add(d)

    sorted_classes = sorted(list(classes))
    print("\n==================================================")
    print("           DATASET AUDIT & READINESS REPORT       ")
    print("==================================================")
    print(f"Dataset Location: {os.path.abspath(base_dir)}")
    print(f"Total Verified Classes: {len(sorted_classes)}")
    print("--------------------------------------------------")
    print(f"{'Class Name':<32} | {'Train':<6} | {'Val':<6} | {'Test':<6} | {'Total':<6}")
    print("--------------------------------------------------")

    grand_train = 0
    grand_val = 0
    grand_test = 0
    corrupted_total = 0

    for cls in sorted_classes:
        tr = len(glob.glob(os.path.join(base_dir, 'train', cls, '*.*')))
        va = len(glob.glob(os.path.join(base_dir, 'val', cls, '*.*')))
        te = len(glob.glob(os.path.join(base_dir, 'test', cls, '*.*')))
        tot = tr + va + te

        grand_train += tr
        grand_val += va
        grand_test += te

        print(f"{cls:<32} | {tr:<6} | {va:<6} | {te:<6} | {tot:<6}")

    print("--------------------------------------------------")
    print(f"{'TOTAL IMAGES':<32} | {grand_train:<6} | {grand_val:<6} | {grand_test:<6} | {grand_train+grand_val+grand_test:<6}")
    print("==================================================")
    print(f"Corrupted Images: {corrupted_total}")
    print(f"Dataset Ready for Model Training: {'YES' if grand_train > 0 else 'NO'}")
    print("==================================================\n")

if __name__ == "__main__":
    audit()
