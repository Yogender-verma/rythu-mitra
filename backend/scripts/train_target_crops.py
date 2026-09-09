import os
import json
import time
import copy
import torch
import torch.nn as nn
import torch.optim as optim
from torchvision import transforms, datasets, models
from torch.utils.data import DataLoader, WeightedRandomSampler
import numpy as np

DATASET_DIR = r"c:\Users\Yogendar\Downloads\Ruthu mitra\dataset_target_crops"
MODEL_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "app", "ml", "models"))

# Device configuration
device = torch.device("cuda" if torch.cuda.is_available() else "cpu")

# Agricultural image data augmentations for training
train_transforms = transforms.Compose([
    transforms.Resize((224, 224)),
    transforms.RandomHorizontalFlip(p=0.5),
    transforms.RandomRotation(degrees=15),
    transforms.ColorJitter(brightness=0.15, contrast=0.15, saturation=0.15),
    transforms.ToTensor(),
    transforms.Normalize(mean=[0.485, 0.456, 0.406], std=[0.229, 0.224, 0.225])
])

val_transforms = transforms.Compose([
    transforms.Resize((224, 224)),
    transforms.ToTensor(),
    transforms.Normalize(mean=[0.485, 0.456, 0.406], std=[0.229, 0.224, 0.225])
])

def train_model(model_name, train_dir, val_dir, num_epochs=6, batch_size=32, lr=0.001):
    print(f"\n==================================================")
    print(f" TRAINING MODEL: {model_name} on {device} ")
    print(f"==================================================")

    train_dataset = datasets.ImageFolder(train_dir, transform=train_transforms)
    val_dataset = datasets.ImageFolder(val_dir, transform=val_transforms)

    num_classes = len(train_dataset.classes)
    print(f"Classes ({num_classes}): {train_dataset.classes}")

    # Compute class weights for weighted loss
    class_counts = [0] * num_classes
    for _, label in train_dataset.samples:
        class_counts[label] += 1
    
    class_weights = [1.0 / (c if c > 0 else 1) for c in class_counts]
    sample_weights = [class_weights[label] for _, label in train_dataset.samples]
    sampler = WeightedRandomSampler(weights=sample_weights, num_samples=len(sample_weights), replacement=True)

    train_loader = DataLoader(train_dataset, batch_size=batch_size, sampler=sampler, num_workers=0)
    val_loader = DataLoader(val_dataset, batch_size=batch_size, shuffle=False, num_workers=0)

    # Use MobileNetV3 Small transfer learning
    weights = models.MobileNet_V3_Small_Weights.DEFAULT
    model = models.mobilenet_v3_small(weights=weights)
    
    # Replace classifier head
    in_features = model.classifier[3].in_features
    model.classifier[3] = nn.Linear(in_features, num_classes)
    model = model.to(device)

    criterion = nn.CrossEntropyLoss()
    optimizer = optim.AdamW(model.parameters(), lr=lr, weight_decay=1e-4)
    scheduler = optim.lr_scheduler.ReduceLROnPlateau(optimizer, mode='min', factor=0.5, patience=2)

    best_model_wts = copy.deepcopy(model.state_dict())
    best_acc = 0.0

    for epoch in range(num_epochs):
        print(f"Epoch {epoch+1}/{num_epochs}")
        print("-" * 20)

        # Training phase
        model.train()
        running_loss = 0.0
        running_corrects = 0

        for inputs, labels in train_loader:
            inputs, labels = inputs.to(device), labels.to(device)
            optimizer.zero_grad()

            outputs = model(inputs)
            _, preds = torch.max(outputs, 1)
            loss = criterion(outputs, labels)

            loss.backward()
            optimizer.step()

            running_loss += loss.item() * inputs.size(0)
            running_corrects += torch.sum(preds == labels.data)

        epoch_loss = running_loss / len(train_dataset)
        epoch_acc = running_corrects.double() / len(train_dataset)
        print(f"Train Loss: {epoch_loss:.4f} Acc: {epoch_acc:.4f}")

        # Validation phase
        model.eval()
        val_loss = 0.0
        val_corrects = 0

        with torch.no_grad():
            for inputs, labels in val_loader:
                inputs, labels = inputs.to(device), labels.to(device)
                outputs = model(inputs)
                _, preds = torch.max(outputs, 1)
                loss = criterion(outputs, labels)

                val_loss += loss.item() * inputs.size(0)
                val_corrects += torch.sum(preds == labels.data)

        val_epoch_loss = val_loss / len(val_dataset)
        val_epoch_acc = val_corrects.double() / len(val_dataset)
        print(f"Val Loss:   {val_epoch_loss:.4f} Acc: {val_epoch_acc:.4f}")

        scheduler.step(val_epoch_loss)

        if val_epoch_acc > best_acc:
            best_acc = val_epoch_acc
            best_model_wts = copy.deepcopy(model.state_dict())

    print(f"\nBest Validation Accuracy for {model_name}: {best_acc:.4f}")
    model.load_state_dict(best_model_wts)

    # Save model weights & class mapping
    os.makedirs(MODEL_DIR, exist_ok=True)
    save_path = os.path.join(MODEL_DIR, f"{model_name}.pt")
    torch.save(model.state_dict(), save_path)
    
    class_indices = {i: cls_name for i, cls_name in enumerate(train_dataset.classes)}
    indices_path = os.path.join(MODEL_DIR, f"{model_name}_indices.json")
    with open(indices_path, "w") as f:
        json.dump(class_indices, f, indent=2)

    print(f"Model saved to: {save_path}")
    print(f"Indices saved to: {indices_path}")
    return model, class_indices

def create_crop_subdatasets():
    crop_classes = {
        "cotton": ["Cotton_Bacterial_Blight", "Cotton_Diseased_Plant", "Cotton_Healthy"],
        "paddy": ["Paddy_Bacterial_Leaf_Blight", "Paddy_Brown_Spot", "Paddy_Leaf_Smut"],
        "chilli": ["Chilli_Bacterial_Spot", "Chilli_Healthy"],
        "maize": ["Maize_Common_Rust", "Maize_Gray_Leaf_Spot", "Maize_Healthy", "Maize_Northern_Leaf_Blight"]
    }
    
    import shutil
    for crop, classes in crop_classes.items():
        for split in ["train", "val", "test"]:
            crop_split_dir = os.path.join(DATASET_DIR, f"{crop}_{split}")
            os.makedirs(crop_split_dir, exist_ok=True)
            for cls_name in classes:
                src_cls_dir = os.path.join(DATASET_DIR, split, cls_name)
                dest_cls_dir = os.path.join(crop_split_dir, cls_name)
                if os.path.exists(src_cls_dir):
                    if not os.path.exists(dest_cls_dir):
                        shutil.copytree(src_cls_dir, dest_cls_dir)

if __name__ == "__main__":
    train_dir = os.path.join(DATASET_DIR, "train")
    val_dir = os.path.join(DATASET_DIR, "val")
    
    if not os.path.exists(train_dir):
        print("Running audit_target_dataset first to generate clean dataset...")
        from audit_target_dataset import run_audit
        run_audit()
        
    create_crop_subdatasets()
    
    # 1. Train unified 12-class target model
    train_model("target_crop_model", train_dir, val_dir, num_epochs=5, batch_size=32)
    
    # 2. Train crop-specific modular classifiers
    for crop in ["cotton", "paddy", "chilli", "maize"]:
        crop_train_dir = os.path.join(DATASET_DIR, f"{crop}_train")
        crop_val_dir = os.path.join(DATASET_DIR, f"{crop}_val")
        train_model(f"{crop}_model", crop_train_dir, crop_val_dir, num_epochs=5, batch_size=32)

