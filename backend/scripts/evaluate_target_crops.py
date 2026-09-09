import os
import json
import torch
import torch.nn as nn
from torchvision import transforms, datasets, models
from torch.utils.data import DataLoader
from sklearn.metrics import classification_report, precision_recall_fscore_support, accuracy_score, confusion_matrix
from PIL import Image

DATASET_DIR = r"c:\Users\Yogendar\Downloads\Ruthu mitra\dataset_target_crops"
MODEL_DIR = r"c:\Users\Yogendar\Downloads\Ruthu mitra\backend\app\ml\models"
EVAL_DIR = os.path.join(MODEL_DIR, "evaluation")

device = torch.device("cuda" if torch.cuda.is_available() else "cpu")

val_transforms = transforms.Compose([
    transforms.Resize((224, 224)),
    transforms.ToTensor(),
    transforms.Normalize(mean=[0.485, 0.456, 0.406], std=[0.229, 0.224, 0.225])
])

def load_model(model_name):
    model_path = os.path.join(MODEL_DIR, f"{model_name}.pt")
    indices_path = os.path.join(MODEL_DIR, f"{model_name}_indices.json")

    if not os.path.exists(model_path) or not os.path.exists(indices_path):
        raise FileNotFoundError(f"Model or indices missing for {model_name}")

    with open(indices_path, "r") as f:
        class_indices = json.load(f)
        
    num_classes = len(class_indices)
    weights = models.MobileNet_V3_Small_Weights.DEFAULT
    model = models.mobilenet_v3_small(weights=weights)
    in_features = model.classifier[3].in_features
    model.classifier[3] = nn.Linear(in_features, num_classes)
    
    model.load_state_dict(torch.load(model_path, map_location=device))
    model = model.to(device)
    model.eval()
    return model, class_indices

def evaluate_model_on_test_set(model, class_indices, test_dir):
    test_dataset = datasets.ImageFolder(test_dir, transform=val_transforms)
    test_loader = DataLoader(test_dataset, batch_size=32, shuffle=False)

    all_preds = []
    all_targets = []

    with torch.no_grad():
        for inputs, labels in test_loader:
            inputs = inputs.to(device)
            outputs = model(inputs)
            preds = torch.argmax(outputs, dim=1).cpu().numpy()
            all_preds.extend(preds)
            all_targets.extend(labels.numpy())

    class_names = [class_indices[str(i)] for i in range(len(class_indices))]
    
    acc = accuracy_score(all_targets, all_preds)
    macro_p, macro_r, macro_f1, _ = precision_recall_fscore_support(all_targets, all_preds, average='macro', zero_division=0)
    weighted_p, weighted_r, weighted_f1, _ = precision_recall_fscore_support(all_targets, all_preds, average='weighted', zero_division=0)
    
    report = classification_report(all_targets, all_preds, target_names=class_names, digits=4, zero_division=0)
    cm = confusion_matrix(all_targets, all_preds)

    return {
        "accuracy": float(acc),
        "macro_precision": float(macro_p),
        "macro_recall": float(macro_r),
        "macro_f1": float(macro_f1),
        "weighted_precision": float(weighted_p),
        "weighted_recall": float(weighted_r),
        "weighted_f1": float(weighted_f1),
        "report": report,
        "confusion_matrix": cm.tolist(),
        "class_names": class_names,
        "total_test_samples": len(all_targets)
    }

def run_evaluation():
    print("==================================================")
    print(" PHASE 4: HELD-OUT TEST SET STRICT EVALUATION    ")
    print("==================================================")

    # 1. Evaluate Unified Target 4-Crop Model
    target_model, target_indices = load_model("target_crop_model")
    target_test_dir = os.path.join(DATASET_DIR, "test")
    res_target = evaluate_model_on_test_set(target_model, target_indices, target_test_dir)

    print(f"\n--- UNIFIED 12-CLASS TARGET MODEL EVALUATION ---")
    print(f"Total Held-Out Test Samples: {res_target['total_test_samples']}")
    print(f"Overall Test Accuracy:       {res_target['accuracy']*100:.2f}%")
    print(f"Macro Precision:             {res_target['macro_precision']*100:.2f}%")
    print(f"Macro Recall:                {res_target['macro_recall']*100:.2f}%")
    print(f"Macro F1-Score:              {res_target['macro_f1']*100:.2f}%")
    print(f"Weighted F1-Score:           {res_target['weighted_f1']*100:.2f}%")
    print("\nPer-Class Classification Report:\n")
    print(res_target['report'])

    # Save confusion matrix
    os.makedirs(EVAL_DIR, exist_ok=True)
    cm_path = os.path.join(EVAL_DIR, "target_confusion_matrix.json")
    with open(cm_path, "w") as f:
        json.dump({
            "classes": res_target["class_names"],
            "matrix": res_target["confusion_matrix"]
        }, f, indent=2)
    print(f"Target confusion matrix saved to: {cm_path}")

    # 2. Evaluate Crop-Specific Modular Classifiers
    crop_results = {}
    for crop in ["cotton", "paddy", "chilli", "maize"]:
        m, idxs = load_model(f"{crop}_model")
        t_dir = os.path.join(DATASET_DIR, f"{crop}_test")
        res = evaluate_model_on_test_set(m, idxs, t_dir)
        crop_results[crop] = res
        print(f"\n--- CROP-SPECIFIC MODEL: {crop.upper()} ---")
        print(f"Test Samples: {res['total_test_samples']}")
        print(f"Accuracy:     {res['accuracy']*100:.2f}%")
        print(f"Macro F1:     {res['macro_f1']*100:.2f}%")
        print(f"Weighted F1:  {res['weighted_f1']*100:.2f}%")

    # 3. Single-Image Real Inference Pipeline Test
    print("\n==================================================")
    print(" REAL SINGLE-IMAGE INFERENCE TEST (HELD-OUT SET)  ")
    print("==================================================")

    test_samples = [
        # Cotton
        ("cotton", os.path.join(DATASET_DIR, "cotton_test", "Cotton_Bacterial_Blight")),
        ("cotton", os.path.join(DATASET_DIR, "cotton_test", "Cotton_Diseased_Plant")),
        # Paddy
        ("paddy", os.path.join(DATASET_DIR, "paddy_test", "Paddy_Bacterial_Leaf_Blight")),
        ("paddy", os.path.join(DATASET_DIR, "paddy_test", "Paddy_Brown_Spot")),
        # Chilli
        ("chilli", os.path.join(DATASET_DIR, "chilli_test", "Chilli_Bacterial_Spot")),
        ("chilli", os.path.join(DATASET_DIR, "chilli_test", "Chilli_Healthy")),
        # Maize
        ("maize", os.path.join(DATASET_DIR, "maize_test", "Maize_Common_Rust")),
        ("maize", os.path.join(DATASET_DIR, "maize_test", "Maize_Northern_Leaf_Blight"))
    ]

    for crop_type, folder in test_samples:
        if not os.path.exists(folder):
            continue
        imgs = [os.path.join(folder, f) for f in os.listdir(folder) if f.lower().endswith(('.jpg', '.jpeg', '.png'))]
        if not imgs:
            continue
            
        sample_img_path = imgs[0]
        actual_label = os.path.basename(folder)
        
        # Load model for this crop
        m, idxs = load_model(f"{crop_type}_model")
        
        # Perform inference
        img = Image.open(sample_img_path).convert("RGB")
        tensor = val_transforms(img).unsqueeze(0).to(device)
        
        with torch.no_grad():
            outputs = m(tensor)
            probs = torch.softmax(outputs, dim=1)[0]
            conf, pred_idx = torch.max(probs, dim=0)
            
        pred_label = idxs[str(pred_idx.item())]
        conf_pct = conf.item() * 100
        is_low_conf = conf.item() < 0.40
        is_correct = (pred_label == actual_label)

        print(f"\nImage: {os.path.basename(sample_img_path)}")
        print(f"  * Crop Context:     {crop_type.upper()}")
        print(f"  * Actual Label:     {actual_label}")
        print(f"  * Predicted Label:  {pred_label}")
        print(f"  * Confidence:       {conf_pct:.2f}%")
        print(f"  * Low Conf Alert:   {is_low_conf}")
        print(f"  * Result Match:     {'CORRECT' if is_correct else 'INCORRECT'}")

if __name__ == "__main__":
    run_evaluation()
