import os
import json
import time
from PIL import Image
import torch
import torch.nn as nn
from torch.utils.data import Dataset, DataLoader
from torchvision import transforms, models

# Paths
BASE_DIR = os.path.dirname(__file__)
METADATA_DIR = os.path.join(BASE_DIR, "dataset_metadata")
MODELS_DIR = os.path.join(BASE_DIR, "backend", "app", "ml", "models")
os.makedirs(MODELS_DIR, exist_ok=True)

class CropDataset(Dataset):
    def __init__(self, json_path, transform=None, max_samples_per_class=None):
        with open(json_path, "r", encoding="utf-8") as f:
            self.data = json.load(f)

        if max_samples_per_class:
            class_counts = {}
            filtered = []
            for item in self.data:
                c = item["class"]
                class_counts[c] = class_counts.get(c, 0) + 1
                if class_counts[c] <= max_samples_per_class:
                    filtered.append(item)
            self.data = filtered

        self.transform = transform

    def __len__(self):
        return len(self.data)

    def __getitem__(self, idx):
        item = self.data[idx]
        img_path = item["path"]
        label = item["label"]

        try:
            image = Image.open(img_path).convert("RGB")
        except Exception:
            # Fallback dummy image in case of runtime disk issue
            image = Image.new("RGB", (224, 224), color=(34, 139, 34))

        if self.transform:
            image = self.transform(image)

        return image, label

def compute_metrics(confusion_matrix, idx_to_class):
    num_classes = confusion_matrix.shape[0]
    total_samples = confusion_matrix.sum().item()
    correct_samples = confusion_matrix.diag().sum().item()
    overall_accuracy = correct_samples / total_samples if total_samples > 0 else 0.0

    class_metrics = {}
    precisions = []
    recalls = []
    f1s = []
    supports = []

    for i in range(num_classes):
        tp = confusion_matrix[i, i].item()
        fp = confusion_matrix[:, i].sum().item() - tp
        fn = confusion_matrix[i, :].sum().item() - tp
        support = confusion_matrix[i, :].sum().item()

        precision = tp / (tp + fp) if (tp + fp) > 0 else 0.0
        recall = tp / (tp + fn) if (tp + fn) > 0 else 0.0
        f1 = 2 * (precision * recall) / (precision + recall) if (precision + recall) > 0 else 0.0

        cls_name = idx_to_class.get(str(i), idx_to_class.get(i, f"Class_{i}"))
        class_metrics[cls_name] = {
            "precision": round(precision, 4),
            "recall": round(recall, 4),
            "f1_score": round(f1, 4),
            "support": int(support)
        }

        precisions.append(precision)
        recalls.append(recall)
        f1s.append(f1)
        supports.append(support)

    macro_precision = sum(precisions) / num_classes if num_classes > 0 else 0.0
    macro_recall = sum(recalls) / num_classes if num_classes > 0 else 0.0
    macro_f1 = sum(f1s) / num_classes if num_classes > 0 else 0.0

    total_supp = sum(supports)
    if total_supp > 0:
        weighted_precision = sum(p * s for p, s in zip(precisions, supports)) / total_supp
        weighted_recall = sum(r * s for r, s in zip(recalls, supports)) / total_supp
        weighted_f1 = sum(f * s for f, s in zip(f1s, supports)) / total_supp
    else:
        weighted_precision = weighted_recall = weighted_f1 = 0.0

    return {
        "accuracy": round(overall_accuracy, 4),
        "macro_precision": round(macro_precision, 4),
        "macro_recall": round(macro_recall, 4),
        "macro_f1": round(macro_f1, 4),
        "weighted_precision": round(weighted_precision, 4),
        "weighted_recall": round(weighted_recall, 4),
        "weighted_f1": round(weighted_f1, 4),
        "class_details": class_metrics
    }

def train_and_evaluate():
    print("==================================================")
    print("RYTHU MITRA TRANSFER-LEARNING MODEL TRAINING")
    print("Architecture: MobileNetV3-Small (Pretrained ImageNet)")
    print("Target Classes: 22 (Cashew, Cassava, Maize, Tomato)")
    print("==================================================")

    # Load class indices
    with open(os.path.join(METADATA_DIR, "class_indices.json"), "r", encoding="utf-8") as f:
        idx_to_class = json.load(f)
    num_classes = len(idx_to_class)
    print(f"Loaded {num_classes} classes.")

    # Data Transforms
    train_transform = transforms.Compose([
        transforms.Resize((224, 224)),
        transforms.RandomHorizontalFlip(),
        transforms.RandomRotation(15),
        transforms.ColorJitter(brightness=0.1, contrast=0.1),
        transforms.ToTensor(),
        transforms.Normalize([0.485, 0.456, 0.406], [0.229, 0.224, 0.225])
    ])

    eval_transform = transforms.Compose([
        transforms.Resize((224, 224)),
        transforms.ToTensor(),
        transforms.Normalize([0.485, 0.456, 0.406], [0.229, 0.224, 0.225])
    ])

    # Datasets
    train_json = os.path.join(METADATA_DIR, "train_split.json")
    val_json = os.path.join(METADATA_DIR, "val_split.json")
    test_json = os.path.join(METADATA_DIR, "test_split.json")

    # For CPU execution speed and high convergence: 60 balanced samples per class for training head
    train_dataset = CropDataset(train_json, transform=train_transform, max_samples_per_class=60)
    val_dataset = CropDataset(val_json, transform=eval_transform, max_samples_per_class=15)
    test_dataset = CropDataset(test_json, transform=eval_transform, max_samples_per_class=15)

    print(f"Training subset:   {len(train_dataset)} images")
    print(f"Validation subset: {len(val_dataset)} images")
    print(f"Testing subset:    {len(test_dataset)} images")

    train_loader = DataLoader(train_dataset, batch_size=32, shuffle=True, num_workers=0)
    val_loader = DataLoader(val_dataset, batch_size=32, shuffle=False, num_workers=0)
    test_loader = DataLoader(test_dataset, batch_size=32, shuffle=False, num_workers=0)

    # Initialize Model with MobileNetV3-Small
    device = torch.device("cuda:0" if torch.cuda.is_available() else "cpu")
    print(f"Training on device: {device}")

    try:
        model = models.mobilenet_v3_small(weights=models.MobileNet_V3_Small_Weights.DEFAULT)
    except Exception:
        model = models.mobilenet_v3_small(weights=None)

    # Replace classifier head for 22 classes
    in_features = model.classifier[3].in_features
    model.classifier[3] = nn.Linear(in_features, num_classes)
    model.to(device)

    criterion = nn.CrossEntropyLoss()
    optimizer = torch.optim.Adam(model.parameters(), lr=0.001)

    epochs = 2
    for epoch in range(1, epochs + 1):
        start_time = time.time()
        model.train()
        running_loss = 0.0
        correct = 0
        total = 0

        for images, labels in train_loader:
            images, labels = images.to(device), labels.to(device)
            optimizer.zero_grad()
            outputs = model(images)
            loss = criterion(outputs, labels)
            loss.backward()
            optimizer.step()

            running_loss += loss.item() * images.size(0)
            _, predicted = outputs.max(1)
            total += labels.size(0)
            correct += predicted.eq(labels).sum().item()

        epoch_loss = running_loss / total
        epoch_acc = correct / total

        # Validation pass
        model.eval()
        val_correct = 0
        val_total = 0
        with torch.no_grad():
            for images, labels in val_loader:
                images, labels = images.to(device), labels.to(device)
                outputs = model(images)
                _, predicted = outputs.max(1)
                val_total += labels.size(0)
                val_correct += predicted.eq(labels).sum().item()

        val_acc = val_correct / val_total if val_total > 0 else 0
        elapsed = time.time() - start_time
        print(f"Epoch [{epoch}/{epochs}] ({elapsed:.1f}s) | Train Loss: {epoch_loss:.4f} | Train Acc: {epoch_acc*100:.2f}% | Val Acc: {val_acc*100:.2f}%")

    # Evaluation on Held-Out Test Set
    print("\n==================================================")
    print("EVALUATING MODEL ON HELD-OUT TEST SPLIT...")
    print("==================================================")
    model.eval()
    confusion_matrix = torch.zeros(num_classes, num_classes, dtype=torch.long)

    with torch.no_grad():
        for images, labels in test_loader:
            images, labels = images.to(device), labels.to(device)
            outputs = model(images)
            _, preds = outputs.max(1)
            for t, p in zip(labels.view(-1), preds.view(-1)):
                confusion_matrix[t.long(), p.long()] += 1

    metrics = compute_metrics(confusion_matrix, idx_to_class)

    print(f"Test Accuracy:          {metrics['accuracy'] * 100:.2f}%")
    print(f"Macro Precision:        {metrics['macro_precision']:.4f}")
    print(f"Macro Recall:           {metrics['macro_recall']:.4f}")
    print(f"Macro F1-Score:         {metrics['macro_f1']:.4f}")
    print(f"Weighted F1-Score:      {metrics['weighted_f1']:.4f}")
    print("==================================================")

    # Save Model Weights
    output_model_path = os.path.join(MODELS_DIR, "crop_disease_model.pt")
    torch.save(model.state_dict(), output_model_path)
    print(f"Trained model saved to: {output_model_path}")

    # Save Evaluation Report
    metrics["confusion_matrix"] = confusion_matrix.tolist()
    report_path = os.path.join(METADATA_DIR, "evaluation_report.json")
    with open(report_path, "w", encoding="utf-8") as f:
        json.dump(metrics, f, indent=2)
    print(f"Evaluation report saved to: {report_path}")

    return metrics

if __name__ == "__main__":
    train_and_evaluate()
