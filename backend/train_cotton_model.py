import os
import json
import random
import time
from typing import Dict, List, Tuple
from PIL import Image

import torch
import torch.nn as nn
import torch.optim as optim
from torch.utils.data import Dataset, DataLoader
from torchvision import transforms, models

# Set deterministic random seeds
SEED = 42
random.seed(SEED)
torch.manual_seed(SEED)

DATASET_DIR = r"C:\Users\shara\Downloads\cotton"
OUTPUT_MODEL_DIR = os.path.join(os.path.dirname(__file__), "app", "ml", "models")
os.makedirs(OUTPUT_MODEL_DIR, exist_ok=True)

MODEL_SAVE_PATH = os.path.join(OUTPUT_MODEL_DIR, "cotton_model.pt")
INDICES_SAVE_PATH = os.path.join(OUTPUT_MODEL_DIR, "cotton_model_indices.json")

# Class mapping from dataset folder names to RythuMitra standard class names
FOLDER_TO_CLASS = {
    "bacterial_blight": "Cotton_Bacterial_Blight",
    "curl_virus": "Cotton_Leaf_Curl",
    "fussarium_wilt": "Cotton_Fusarium_Wilt",
    "healthy": "Cotton_Healthy"
}

class CottonDataset(Dataset):
    def __init__(self, samples: List[Tuple[str, int]], transform=None):
        self.samples = samples
        self.transform = transform

    def __len__(self):
        return len(self.samples)

    def __getitem__(self, idx):
        path, label = self.samples[idx]
        with Image.open(path) as img:
            image = img.convert("RGB")
        if self.transform:
            image = self.transform(image)
        return image, label

def load_dataset_samples(dataset_dir: str) -> Tuple[List[Tuple[str, int]], Dict[int, str]]:
    std_classes = sorted(list(set(FOLDER_TO_CLASS.values())))
    class_to_idx = {c: i for i, c in enumerate(std_classes)}
    idx_to_class = {i: c for i, c in enumerate(std_classes)}

    samples = []
    print(f"[*] Class Index Mapping:")
    for idx, name in sorted(idx_to_class.items()):
        print(f"    Index {idx} -> {name}")

    for folder_name in sorted(list(FOLDER_TO_CLASS.keys())):
        folder_path = os.path.join(dataset_dir, folder_name)
        if not os.path.isdir(folder_path):
            continue
        standard_class_name = FOLDER_TO_CLASS[folder_name]
        label_idx = class_to_idx[standard_class_name]
        
        files = [f for f in os.listdir(folder_path) if os.path.isfile(os.path.join(folder_path, f))]
        for f in files:
            fp = os.path.join(folder_path, f)
            samples.append((fp, label_idx))

    print(f"[*] Loaded {len(samples)} total valid samples across {len(class_to_idx)} classes.")
    return samples, idx_to_class

def train_cotton_model():
    print("=" * 60)
    print("      RythuMitra AI - MobileNetV3 Cotton Model Training")
    print("=" * 60)

    device = torch.device("cuda:0" if torch.cuda.is_available() else "cpu")
    print(f"[*] Computation Device: {device}")

    # 1. Load samples and split 80% train / 20% val with stratification
    samples, idx_to_class = load_dataset_samples(DATASET_DIR)
    
    # Stratified split
    samples_by_class: Dict[int, List[Tuple[str, int]]] = {}
    for s in samples:
        samples_by_class.setdefault(s[1], []).append(s)

    train_samples = []
    val_samples = []
    for cls_idx, cls_samples in samples_by_class.items():
        random.shuffle(cls_samples)
        split_idx = int(0.80 * len(cls_samples))
        train_samples.extend(cls_samples[:split_idx])
        val_samples.extend(cls_samples[split_idx:])

    random.shuffle(train_samples)
    random.shuffle(val_samples)

    print(f"[*] Training Samples: {len(train_samples)} (80%)")
    print(f"[*] Validation Samples: {len(val_samples)} (20%)")

    # 2. Data transforms
    train_transform = transforms.Compose([
        transforms.Resize((224, 224)),
        transforms.RandomHorizontalFlip(p=0.5),
        transforms.RandomVerticalFlip(p=0.2),
        transforms.RandomRotation(degrees=15),
        transforms.ColorJitter(brightness=0.15, contrast=0.15, saturation=0.15),
        transforms.ToTensor(),
        transforms.Normalize([0.485, 0.456, 0.406], [0.229, 0.224, 0.225])
    ])

    val_transform = transforms.Compose([
        transforms.Resize((224, 224)),
        transforms.ToTensor(),
        transforms.Normalize([0.485, 0.456, 0.406], [0.229, 0.224, 0.225])
    ])

    train_dataset = CottonDataset(train_samples, transform=train_transform)
    val_dataset = CottonDataset(val_samples, transform=val_transform)

    batch_size = 32
    train_loader = DataLoader(train_dataset, batch_size=batch_size, shuffle=True, num_workers=0)
    val_loader = DataLoader(val_dataset, batch_size=batch_size, shuffle=False, num_workers=0)

    # 3. Initialize MobileNetV3-Small
    num_classes = len(idx_to_class)
    print(f"\n[*] Initializing MobileNetV3-Small (pre-trained ImageNet weights)...")
    model = models.mobilenet_v3_small(weights=models.MobileNet_V3_Small_Weights.DEFAULT)
    
    in_features = model.classifier[3].in_features
    model.classifier[3] = nn.Linear(in_features, num_classes)
    model = model.to(device)

    criterion = nn.CrossEntropyLoss()

    # 4. Phase 1: Train classifier head (warmup, 5 epochs)
    print("\n--- Phase 1: Training Classification Head (Backbone Frozen) ---")
    for param in model.features.parameters():
        param.requires_grad = False
    for param in model.classifier.parameters():
        param.requires_grad = True

    optimizer_head = optim.AdamW(model.classifier.parameters(), lr=1e-3, weight_decay=1e-4)

    best_val_acc = 0.0
    best_state_dict = None

    epochs_phase1 = 5
    for epoch in range(1, epochs_phase1 + 1):
        start_t = time.time()
        model.train()
        train_loss, train_correct = 0.0, 0

        for images, labels in train_loader:
            images, labels = images.to(device), labels.to(device)
            optimizer_head.zero_grad()
            outputs = model(images)
            loss = criterion(outputs, labels)
            loss.backward()
            optimizer_head.step()

            train_loss += loss.item() * images.size(0)
            _, preds = torch.max(outputs, 1)
            train_correct += torch.sum(preds == labels.data).item()

        epoch_train_loss = train_loss / len(train_dataset)
        epoch_train_acc = train_correct / len(train_dataset)

        # Validation
        model.eval()
        val_loss, val_correct = 0.0, 0
        with torch.no_grad():
            for images, labels in val_loader:
                images, labels = images.to(device), labels.to(device)
                outputs = model(images)
                loss = criterion(outputs, labels)

                val_loss += loss.item() * images.size(0)
                _, preds = torch.max(outputs, 1)
                val_correct += torch.sum(preds == labels.data).item()

        epoch_val_loss = val_loss / len(val_dataset)
        epoch_val_acc = val_correct / len(val_dataset)
        elapsed = time.time() - start_t

        print(f"Epoch [{epoch}/{epochs_phase1}] ({elapsed:.1f}s) | "
              f"Train Loss: {epoch_train_loss:.4f} Acc: {epoch_train_acc*100:.2f}% | "
              f"Val Loss: {epoch_val_loss:.4f} Acc: {epoch_val_acc*100:.2f}%")

        if epoch_val_acc > best_val_acc:
            best_val_acc = epoch_val_acc
            best_state_dict = {k: v.cpu() for k, v in model.state_dict().items()}

    # 5. Phase 2: Fine-tune entire network (5 epochs with Cosine Annealing)
    print("\n--- Phase 2: Fine-Tuning Full Architecture ---")
    for param in model.parameters():
        param.requires_grad = True

    epochs_phase2 = 5
    optimizer_full = optim.AdamW([
        {"params": model.features.parameters(), "lr": 1e-4},
        {"params": model.classifier.parameters(), "lr": 5e-4}
    ], weight_decay=1e-4)
    scheduler = optim.lr_scheduler.CosineAnnealingLR(optimizer_full, T_max=epochs_phase2, eta_min=1e-6)

    for epoch in range(1, epochs_phase2 + 1):
        start_t = time.time()
        model.train()
        train_loss, train_correct = 0.0, 0

        for images, labels in train_loader:
            images, labels = images.to(device), labels.to(device)
            optimizer_full.zero_grad()
            outputs = model(images)
            loss = criterion(outputs, labels)
            loss.backward()
            optimizer_full.step()

            train_loss += loss.item() * images.size(0)
            _, preds = torch.max(outputs, 1)
            train_correct += torch.sum(preds == labels.data).item()

        scheduler.step()

        epoch_train_loss = train_loss / len(train_dataset)
        epoch_train_acc = train_correct / len(train_dataset)

        # Validation
        model.eval()
        val_loss, val_correct = 0.0, 0
        with torch.no_grad():
            for images, labels in val_loader:
                images, labels = images.to(device), labels.to(device)
                outputs = model(images)
                loss = criterion(outputs, labels)

                val_loss += loss.item() * images.size(0)
                _, preds = torch.max(outputs, 1)
                val_correct += torch.sum(preds == labels.data).item()

        epoch_val_loss = val_loss / len(val_dataset)
        epoch_val_acc = val_correct / len(val_dataset)
        elapsed = time.time() - start_t

        print(f"Epoch [{epoch}/{epochs_phase2}] ({elapsed:.1f}s) | "
              f"Train Loss: {epoch_train_loss:.4f} Acc: {epoch_train_acc*100:.2f}% | "
              f"Val Loss: {epoch_val_loss:.4f} Acc: {epoch_val_acc*100:.2f}%")

        if epoch_val_acc > best_val_acc:
            best_val_acc = epoch_val_acc
            best_state_dict = {k: v.cpu() for k, v in model.state_dict().items()}

    # 6. Save model checkpoint and index mapping
    print("\n" + "=" * 60)
    print(f"[*] Training Complete! Best Validation Accuracy: {best_val_acc * 100:.2f}%")
    print("=" * 60)

    print(f"[*] Saving model weights to: {MODEL_SAVE_PATH}")
    torch.save(best_state_dict, MODEL_SAVE_PATH)

    print(f"[*] Saving class indices mapping to: {INDICES_SAVE_PATH}")
    indices_str_dict = {str(k): v for k, v in idx_to_class.items()}
    with open(INDICES_SAVE_PATH, "w") as f:
        json.dump(indices_str_dict, f, indent=2)

    # 7. Final Evaluation breakdown per class on validation set
    print("\n[*] Validation Accuracy Breakdown per Class:")
    model.load_state_dict(best_state_dict)
    model.eval()

    class_correct = {i: 0 for i in range(num_classes)}
    class_total = {i: 0 for i in range(num_classes)}

    with torch.no_grad():
        for images, labels in val_loader:
            outputs = model(images)
            _, preds = torch.max(outputs, 1)
            for p, l in zip(preds, labels):
                p_item = p.item()
                l_item = l.item()
                class_total[l_item] += 1
                if p_item == l_item:
                    class_correct[l_item] += 1

    for idx, name in sorted(idx_to_class.items()):
        total = class_total[idx]
        correct = class_correct[idx]
        acc = (correct / total * 100) if total > 0 else 0
        print(f"  • {name}: {acc:.2f}% ({correct}/{total})")

    print("\n[SUCCESS] Model ready for RythuMitra AI inference!")

if __name__ == "__main__":
    train_cotton_model()
