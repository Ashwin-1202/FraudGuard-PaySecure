import os
import json
import time

import joblib
import pandas as pd

from lightgbm import LGBMClassifier
from sklearn.model_selection import train_test_split
from sklearn.metrics import (
    precision_score,
    recall_score,
    f1_score,
    roc_auc_score,
    classification_report,
    confusion_matrix
)


# ============================================================
# CONFIGURATION
# ============================================================

DATA_PATH = "data/fraud_transactions.csv"

MODEL_DIR = "models"
MODEL_PATH = os.path.join(
    MODEL_DIR,
    "fraud_model.joblib"
)

METADATA_PATH = os.path.join(
    MODEL_DIR,
    "fraud_model_metadata.json"
)

RANDOM_STATE = 42


# ============================================================
# 1. LOAD DATASET
# ============================================================

print("=" * 70)
print("PRODUCTION LIGHTGBM FRAUD MODEL")
print("=" * 70)

print("\nLoading dataset...")

df = pd.read_csv(DATA_PATH)

print("Dataset loaded successfully!")
print("Dataset shape:", df.shape)


# ============================================================
# 2. DATASET ANALYSIS
# ============================================================

print("\n" + "=" * 70)
print("DATASET ANALYSIS")
print("=" * 70)

print("\nFraud distribution:")

print(
    df["is_fraud"].value_counts()
)

fraud_percentage = (
    df["is_fraud"].mean() * 100
)

print(
    f"\nFraud percentage: {fraud_percentage:.2f}%"
)

print(
    f"Legitimate percentage: {100 - fraud_percentage:.2f}%"
)


# ============================================================
# 3. REMOVE NON-ML COLUMNS
# ============================================================

print("\n" + "=" * 70)
print("FEATURE PREPARATION")
print("=" * 70)

X = df.drop(
    columns=[
        "transaction_id",
        "user_id",
        "is_fraud"
    ]
)

y = df["is_fraud"]


# ============================================================
# 4. CREATE BEHAVIORAL FEATURES
# ============================================================

print("\nCreating behavioral features...")


# Amount + velocity
X["amount_velocity"] = (
    X["amount_ratio"]
    *
    X["transactions_last_10min"]
)


# Amount + merchant risk
X["amount_merchant_risk"] = (
    X["amount_ratio"]
    *
    X["merchant_risk"]
)


# Velocity + merchant risk
X["velocity_merchant_risk"] = (
    X["transactions_last_10min"]
    *
    X["merchant_risk"]
)


# Amount + velocity + merchant
X["combined_risk_signal"] = (
    X["amount_ratio"]
    *
    X["transactions_last_10min"]
    *
    X["merchant_risk"]
)


# Amount + failed attempts
X["amount_failed_attempts"] = (
    X["amount_ratio"]
    *
    X["failed_attempts_10min"]
)


# Velocity + failed attempts
X["velocity_failed_attempts"] = (
    X["transactions_last_10min"]
    *
    X["failed_attempts_10min"]
)


# Amount + distance
X["amount_distance"] = (
    X["amount_ratio"]
    *
    X["distance_from_home"]
)


# Merchant + distance
X["merchant_distance"] = (
    X["merchant_risk"]
    *
    X["distance_from_home"]
)


print("Behavioral features created successfully!")


# ============================================================
# 5. FEATURE LIST
# ============================================================

FEATURES = list(X.columns)

print("\nTotal ML features:", len(FEATURES))

print("\nML features:")

for index, feature in enumerate(
    FEATURES,
    start=1
):

    print(
        f"{index:2}. {feature}"
    )


# ============================================================
# 6. TRAIN / TEST SPLIT
# ============================================================

print("\n" + "=" * 70)
print("TRAIN TEST SPLIT")
print("=" * 70)

X_train, X_test, y_train, y_test = train_test_split(
    X,
    y,
    test_size=0.20,
    random_state=RANDOM_STATE,
    stratify=y
)

print(
    "Training samples:",
    len(X_train)
)

print(
    "Testing samples:",
    len(X_test)
)


# ============================================================
# 7. CLASS IMBALANCE
# ============================================================

negative_count = (
    y_train == 0
).sum()

positive_count = (
    y_train == 1
).sum()

scale_pos_weight = (
    negative_count /
    positive_count
)

print(
    f"\nCalculated scale_pos_weight: "
    f"{scale_pos_weight:.2f}"
)


# ============================================================
# 8. CREATE LIGHTGBM MODEL
# ============================================================

print("\n" + "=" * 70)
print("INITIALIZING LIGHTGBM")
print("=" * 70)

model = LGBMClassifier(

    n_estimators=400,

    learning_rate=0.05,

    max_depth=6,

    num_leaves=31,

    subsample=0.8,

    colsample_bytree=0.8,

    objective="binary",

    scale_pos_weight=scale_pos_weight,

    random_state=RANDOM_STATE,

    n_jobs=-1,

    verbosity=-1
)


# ============================================================
# 9. TRAIN MODEL
# ============================================================

print("\nTraining LightGBM model...")

training_start = time.perf_counter()

model.fit(
    X_train,
    y_train
)

training_time = (
    time.perf_counter()
    -
    training_start
)

print(
    f"Training completed in "
    f"{training_time:.4f} seconds"
)


# ============================================================
# 10. PREDICTIONS
# ============================================================

print("\nGenerating predictions...")

inference_start = time.perf_counter()

y_probability = model.predict_proba(
    X_test
)[:, 1]

y_prediction = (
    y_probability >= 0.5
).astype(int)

inference_time = (
    time.perf_counter()
    -
    inference_start
)


# ============================================================
# 11. EVALUATION
# ============================================================

print("\n" + "=" * 70)
print("MODEL EVALUATION")
print("=" * 70)


precision = precision_score(
    y_test,
    y_prediction,
    zero_division=0
)

recall = recall_score(
    y_test,
    y_prediction,
    zero_division=0
)

f1 = f1_score(
    y_test,
    y_prediction,
    zero_division=0
)

roc_auc = roc_auc_score(
    y_test,
    y_probability
)


print(
    f"\nPrecision : {precision:.4f}"
)

print(
    f"Recall    : {recall:.4f}"
)

print(
    f"F1 Score  : {f1:.4f}"
)

print(
    f"ROC-AUC   : {roc_auc:.4f}"
)

print(
    f"Training Time  : {training_time:.4f} seconds"
)

print(
    f"Inference Time : {inference_time:.4f} seconds"
)


# ============================================================
# 12. CLASSIFICATION REPORT
# ============================================================

print("\nClassification Report:")

print(
    classification_report(
        y_test,
        y_prediction,
        zero_division=0
    )
)


# ============================================================
# 13. CONFUSION MATRIX
# ============================================================

print("\nConfusion Matrix:")

print(
    confusion_matrix(
        y_test,
        y_prediction
    )
)


# ============================================================
# 14. FEATURE IMPORTANCE
# ============================================================

print("\n" + "=" * 70)
print("TOP FEATURE IMPORTANCE")
print("=" * 70)

feature_importance = pd.DataFrame({

    "feature": FEATURES,

    "importance": model.feature_importances_

})


feature_importance = (
    feature_importance
    .sort_values(
        by="importance",
        ascending=False
    )
)


print(
    feature_importance
    .head(15)
    .to_string(index=False)
)


# ============================================================
# 15. SAVE MODEL DIRECTORY
# ============================================================

os.makedirs(
    MODEL_DIR,
    exist_ok=True
)


# ============================================================
# 16. SAVE MODEL
# ============================================================

print("\n" + "=" * 70)
print("SAVING MODEL")
print("=" * 70)

joblib.dump(
    model,
    MODEL_PATH
)

print(
    "Model saved successfully!"
)

print(
    "Location:",
    MODEL_PATH
)


# ============================================================
# 17. SAVE MODEL METADATA
# ============================================================

metadata = {

    "model_name": "LightGBM",

    "model_type": "LGBMClassifier",

    "model_version": "1.0",

    "dataset": "fraud_transactions.csv",

    "dataset_rows": int(len(df)),

    "dataset_features": int(len(FEATURES)),

    "fraud_percentage": round(
        fraud_percentage,
        4
    ),

    "precision": round(
        float(precision),
        4
    ),

    "recall": round(
        float(recall),
        4
    ),

    "f1_score": round(
        float(f1),
        4
    ),

    "roc_auc": round(
        float(roc_auc),
        4
    ),

    "training_time_seconds": round(
        float(training_time),
        4
    ),

    "inference_time_seconds": round(
        float(inference_time),
        4
    ),

    "threshold": 0.5,

    "scale_pos_weight": round(
        float(scale_pos_weight),
        4
    ),

    "features": FEATURES,

    "behavioral_features": [

        "amount_velocity",

        "amount_merchant_risk",

        "velocity_merchant_risk",

        "combined_risk_signal",

        "amount_failed_attempts",

        "velocity_failed_attempts",

        "amount_distance",

        "merchant_distance"

    ]
}


with open(
    METADATA_PATH,
    "w",
    encoding="utf-8"
) as file:

    json.dump(
        metadata,
        file,
        indent=4
    )


print(
    "\nMetadata saved successfully!"
)

print(
    "Location:",
    METADATA_PATH
)


# ============================================================
# 18. FINAL SUMMARY
# ============================================================

print("\n" + "=" * 70)
print("LIGHTGBM TRAINING COMPLETED")
print("=" * 70)

print(
    f"\nModel       : LightGBM"
)

print(
    f"Precision   : {precision:.4f}"
)

print(
    f"Recall      : {recall:.4f}"
)

print(
    f"F1 Score    : {f1:.4f}"
)

print(
    f"ROC-AUC     : {roc_auc:.4f}"
)

print(
    f"Model Path  : {MODEL_PATH}"
)

print(
    f"Metadata    : {METADATA_PATH}"
)

print("\nProduction model is ready.")