import os
import sys
import json
import glob
import torch
import torch.nn as nn
from torchvision import transforms, datasets, models
from torch.utils.data import DataLoader, Subset
from sklearn.metrics import classification_report, confusion_matrix, precision_recall_fscore_support, accuracy_score
import numpy as np

# Add backend directory to sys.path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))
from app.ml.real_classifier import RealDiseaseClassifier

def run_strict_validation():
    data_dir = "dataset"
    train_dir = os.path.join(data_dir, "train")
    val_dir = os.path.join(data_dir, "val")
    test_dir = os.path.join(data_dir, "test")

    all_classes = set()
    class_counts = {}
    total_images = 0

    for split in ['train', 'val', 'test']:
        split_path = os.path.join(data_dir, split)
        if not os.path.exists(split_path):
            continue
        for cls_name in os.listdir(split_path):
            cls_path = os.path.join(split_path, cls_name)
            if os.path.isdir(cls_path):
                all_classes.add(cls_name)
                imgs = len(glob.glob(os.path.join(cls_path, "*.*")))
                class_counts.setdefault(cls_name, {'train': 0, 'val': 0, 'test': 0, 'total': 0})
                class_counts[cls_name][split] = imgs
                class_counts[cls_name]['total'] += imgs

    for c in class_counts.values():
        total_images += c['total']

    crops = set()
    for cls in all_classes:
        crop_prefix = cls.split("_")[0].split("___")[0]
        crops.add(crop_prefix)

    print("==================================================")
    print(" 1. EXACT DATASET STATISTICS REPORT               ")
    print("==================================================")
    print(f"Total Images: {total_images}")
    print(f"Total Classes: {len(all_classes)}")
    print(f"Total Crops: {len(crops)} ({', '.join(sorted(list(crops)))})")

    for target_crop in ["Cotton", "Paddy", "Chilli", "Corn", "Pepper", "Maize"]:
        matching = {k: v for k, v in class_counts.items() if target_crop.lower() in k.lower()}
        if matching:
            print(f"\n--- {target_crop.upper()} CLASSES ---")
            for cls_k, v in matching.items():
                print(f"  * {cls_k}: {v['total']} images (Train: {v['train']}, Val: {v['val']}, Test: {v['test']})")

    train_count = sum(c['train'] for c in class_counts.values())
    val_count = sum(c['val'] for c in class_counts.values())
    test_count = sum(c['test'] for c in class_counts.values())

    print("\n==================================================")
    print(" 2. EXACT DATASET SPLIT REPORT                    ")
    print("==================================================")
    print(f"Training Images: {train_count}")
    print(f"Validation Images: {val_count}")
    print(f"Held-Out Test Images: {test_count}")

    eval_dir = os.path.join("backend", "app", "ml", "models", "evaluation")
    os.makedirs(eval_dir, exist_ok=True)

    val_test_transform = transforms.Compose([
        transforms.Resize((224, 224)),
        transforms.ToTensor(),
        transforms.Normalize([0.485, 0.456, 0.406], [0.229, 0.224, 0.225])
    ])

    full_test_dataset = datasets.ImageFolder(test_dir, transform=val_test_transform)
    class_names = full_test_dataset.classes
    num_classes = len(class_names)

    # Balance test set for fast evaluation: max 35 samples per class
    class_indices = {}
    for idx, (_, label) in enumerate(full_test_dataset.samples):
        class_indices.setdefault(label, []).append(idx)

    selected_test_indices = []
    for label, idxs in class_indices.items():
        np.random.seed(42)
        sampled = np.random.choice(idxs, min(35, len(idxs)), replace=False)
        selected_test_indices.extend(sampled)

    test_dataset = Subset(full_test_dataset, selected_test_indices)
    test_loader = DataLoader(test_dataset, batch_size=128, shuffle=False)

    device = torch.device("cuda:0" if torch.cuda.is_available() else "cpu")
    model_path = os.path.join("backend", "app", "ml", "models", "crop_disease_model.pt")
    indices_path = os.path.join("backend", "app", "ml", "models", "class_indices.json")

    print("\n==================================================")
    print(" 6 & 7. MODEL FILE VERIFICATION                   ")
    print("==================================================")
    print(f"Model File ({model_path}): {'EXISTS' if os.path.exists(model_path) else 'MISSING'}")
    print(f"Class Indices File ({indices_path}): {'EXISTS' if os.path.exists(indices_path) else 'MISSING'}")

    model = models.mobilenet_v3_small(weights=None)
    in_features = model.classifier[3].in_features
    model.classifier[3] = nn.Linear(in_features, num_classes)
    model.load_state_dict(torch.load(model_path, map_location=device))
    model.to(device)
    model.eval()
    print("PyTorch State Dict loaded successfully!")

    y_true = []
    y_pred = []

    with torch.no_grad():
        for inputs, labels in test_loader:
            inputs = inputs.to(device)
            outputs = model(inputs)
            _, preds = torch.max(outputs, 1)
            y_true.extend(labels.cpu().numpy())
            y_pred.extend(preds.cpu().numpy())

    acc = accuracy_score(y_true, y_pred)
    macro_prec, macro_rec, macro_f1, _ = precision_recall_fscore_support(y_true, y_pred, average='macro', zero_division=0)
    wt_prec, wt_rec, wt_f1, _ = precision_recall_fscore_support(y_true, y_pred, average='weighted', zero_division=0)
    cm = confusion_matrix(y_true, y_pred)

    print("\n==================================================")
    print(" 3 & 4 & 5. HELD-OUT TEST SET EVALUATION METRICS   ")
    print("==================================================")
    print(f"Evaluated Test Samples: {len(test_dataset)} (out of {len(full_test_dataset)} total test set)")
    print(f"Test Accuracy: {acc * 100:.2f}%")
    print(f"Macro Precision: {macro_prec * 100:.2f}%")
    print(f"Macro Recall: {macro_rec * 100:.2f}%")
    print(f"Macro F1-Score: {macro_f1 * 100:.2f}%")
    print(f"Weighted Precision: {wt_prec * 100:.2f}%")
    print(f"Weighted Recall: {wt_rec * 100:.2f}%")
    print(f"Weighted F1-Score: {wt_f1 * 100:.2f}%")

    cm_path = os.path.join(eval_dir, "confusion_matrix.json")
    with open(cm_path, "w") as f:
        json.dump({
            "classes": class_names,
            "confusion_matrix": cm.tolist(),
            "test_accuracy": acc,
            "macro_f1": macro_f1,
            "weighted_f1": wt_f1
        }, f, indent=2)
    print(f"\nConfusion matrix saved to: {cm_path}")

    print("\n--- Detailed Per-Class Classification Report ---")
    print(classification_report(y_true, y_pred, target_names=class_names, zero_division=0))

    # 8. Single Image Inference Pipeline Testing
    print("\n==================================================")
    print(" 8. REAL SINGLE-IMAGE INFERENCE PIPELINE TEST     ")
    print("==================================================")

    classifier = RealDiseaseClassifier()
    tested_count = 0

    for target in ["Cotton", "Paddy", "Pepper", "Corn"]:
        matching_dirs = [d for d in os.listdir(test_dir) if target.lower() in d.lower()]
        target_imgs = []
        for md in matching_dirs:
            target_imgs.extend(glob.glob(os.path.join(test_dir, md, "*.*")))

        if not target_imgs:
            continue

        selected_samples = target_imgs[:2]
        for img_path in selected_samples:
            true_label = os.path.basename(os.path.dirname(img_path))
            with open(img_path, "rb") as f:
                img_bytes = f.read()

            result = classifier.predict(img_bytes, selected_crop=target)
            pred_label = result["disease"]
            conf = result["confidence"] * 100

            tested_count += 1
            print(f"\nTest Image #{tested_count}: {os.path.basename(img_path)}")
            print(f"  * Actual Label: {true_label}")
            print(f"  * Predicted Crop: {result['crop']}")
            print(f"  * Predicted Disease: {pred_label}")
            print(f"  * Confidence: {conf:.2f}%")
            print(f"  * Low Confidence Alert: {result['is_low_confidence']}")

    print("==================================================\n")

if __name__ == "__main__":
    run_strict_validation()
