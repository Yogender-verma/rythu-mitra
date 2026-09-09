import os
import json
import torch
import torch.nn as nn
import torch.optim as optim
from torchvision import transforms, datasets, models
from torch.utils.data import DataLoader, Subset
from sklearn.metrics import classification_report, confusion_matrix, precision_recall_fscore_support, accuracy_score
import numpy as np

def train_crop_model():
    print("==================================================")
    print("  ALL-CROP (43 CLASSES) PYTORCH MODEL TRAINING    ")
    print("==================================================")

    data_dir = "dataset"
    train_dir = os.path.join(data_dir, "train")
    val_dir = os.path.join(data_dir, "val")
    test_dir = os.path.join(data_dir, "test")

    data_transforms = {
        'train': transforms.Compose([
            transforms.Resize((224, 224)),
            transforms.RandomHorizontalFlip(),
            transforms.ToTensor(),
            transforms.Normalize([0.485, 0.456, 0.406], [0.229, 0.224, 0.225])
        ]),
        'val_test': transforms.Compose([
            transforms.Resize((224, 224)),
            transforms.ToTensor(),
            transforms.Normalize([0.485, 0.456, 0.406], [0.229, 0.224, 0.225])
        ]),
    }

    full_train = datasets.ImageFolder(train_dir, transform=data_transforms['train'])
    val_dataset = datasets.ImageFolder(val_dir, transform=data_transforms['val_test'])
    test_dataset = datasets.ImageFolder(test_dir, transform=data_transforms['val_test'])

    class_names = full_train.classes
    num_classes = len(class_names)

    # Balance training set: max 60 samples per class across all 43 classes for ultra-fast execution
    class_indices = {}
    for idx, (_, label) in enumerate(full_train.samples):
        class_indices.setdefault(label, []).append(idx)

    selected_indices = []
    for label, idxs in class_indices.items():
        np.random.seed(42)
        sampled = np.random.choice(idxs, min(60, len(idxs)), replace=False)
        selected_indices.extend(sampled)

    train_dataset = Subset(full_train, selected_indices)

    train_loader = DataLoader(train_dataset, batch_size=128, shuffle=True)
    val_loader = DataLoader(val_dataset, batch_size=128, shuffle=False)
    test_loader = DataLoader(test_dataset, batch_size=128, shuffle=False)

    print(f"Loaded {len(train_dataset)} balanced train samples (from {len(full_train)} total), {len(val_dataset)} val, {len(test_dataset)} test across {num_classes} crop classes.")

    device = torch.device("cuda:0" if torch.cuda.is_available() else "cpu")
    print(f"Training on device: {device}")

    model = models.mobilenet_v3_small(weights=models.MobileNet_V3_Small_Weights.DEFAULT)
    
    # Freeze feature extractor for fast transfer learning
    for param in model.features.parameters():
        param.requires_grad = False

    in_features = model.classifier[3].in_features
    model.classifier[3] = nn.Linear(in_features, num_classes)
    model = model.to(device)

    criterion = nn.CrossEntropyLoss()
    optimizer = optim.Adam(model.classifier.parameters(), lr=0.003)

    epochs = 2
    print("\n--- Starting All-Crop PyTorch Model Training ---")
    for epoch in range(epochs):
        model.train()
        running_loss = 0.0
        running_corrects = 0

        for inputs, labels in train_loader:
            inputs = inputs.to(device)
            labels = labels.to(device)

            optimizer.zero_grad()
            outputs = model(inputs)
            loss = criterion(outputs, labels)
            _, preds = torch.max(outputs, 1)

            loss.backward()
            optimizer.step()

            running_loss += loss.item() * inputs.size(0)
            running_corrects += torch.sum(preds == labels.data)

        epoch_loss = running_loss / len(train_dataset)
        epoch_acc = running_corrects.double() / len(train_dataset)

        # Validation
        model.eval()
        val_loss = 0.0
        val_corrects = 0
        with torch.no_grad():
            for inputs, labels in val_loader:
                inputs = inputs.to(device)
                labels = labels.to(device)
                outputs = model(inputs)
                loss = criterion(outputs, labels)
                _, preds = torch.max(outputs, 1)
                val_loss += loss.item() * inputs.size(0)
                val_corrects += torch.sum(preds == labels.data)

        val_epoch_loss = val_loss / len(val_dataset)
        val_epoch_acc = val_corrects.double() / len(val_dataset)

        print(f"Epoch {epoch+1}/{epochs} | Train Loss: {epoch_loss:.4f} Acc: {epoch_acc:.4f} | Val Loss: {val_epoch_loss:.4f} Acc: {val_epoch_acc:.4f}")

    # Save Model Weights & Class Indices
    model_dir = os.path.join("backend", "app", "ml", "models")
    os.makedirs(model_dir, exist_ok=True)
    model_path = os.path.join(model_dir, "crop_disease_model.pt")
    torch.save(model.state_dict(), model_path)

    class_indices_path = os.path.join(model_dir, "class_indices.json")
    with open(class_indices_path, "w") as f:
        json.dump({i: cls for i, cls in enumerate(class_names)}, f, indent=2)

    print(f"\nAll-Crop 43-Class Model saved successfully to: {model_path}")
    print(f"Class indices saved to: {class_indices_path}")

if __name__ == "__main__":
    train_crop_model()
