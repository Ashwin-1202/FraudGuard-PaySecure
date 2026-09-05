import pandas as pd
import joblib

from xgboost import XGBClassifier
from sklearn.model_selection import train_test_split
from sklearn.metrics import (
    classification_report,
    confusion_matrix,
    roc_auc_score
)


# ==================================================
# 1. LOAD DATA
# ==================================================

DATA_PATH = "data/fraud_transactions.csv"

df = pd.read_csv(DATA_PATH)

print("Dataset loaded!")
print("Shape:", df.shape)


# ==================================================
# 2. REMOVE NON-ML COLUMNS
# ==================================================

X = df.drop(
    columns=[
        "transaction_id",
        "user_id",
        "is_fraud"
    ]
)

y = df["is_fraud"]


# ==================================================
# 3. CREATE BEHAVIORAL FEATURES
# ==================================================

print("\nCreating behavioral interaction features...")


# Amount + velocity
X["amount_velocity"] = (
    X["amount_ratio"]
    * X["transactions_last_10min"]
)


# Amount + merchant risk
X["amount_merchant_risk"] = (
    X["amount_ratio"]
    * X["merchant_risk"]
)


# Velocity + merchant risk
X["velocity_merchant_risk"] = (
    X["transactions_last_10min"]
    * X["merchant_risk"]
)


# Amount + velocity + merchant
X["combined_risk_signal"] = (
    X["amount_ratio"]
    * X["transactions_last_10min"]
    * X["merchant_risk"]
)


# Amount + failed attempts
X["amount_failed_attempts"] = (
    X["amount_ratio"]
    * X["failed_attempts_10min"]
)


# Velocity + failed attempts
X["velocity_failed_attempts"] = (
    X["transactions_last_10min"]
    * X["failed_attempts_10min"]
)


# Amount + distance
X["amount_distance"] = (
    X["amount_ratio"]
    * X["distance_from_home"]
)


# Merchant + distance
X["merchant_distance"] = (
    X["merchant_risk"]
    * X["distance_from_home"]
)


print("\nBehavioral features created:")

behavior_features = [
    "amount_velocity",
    "amount_merchant_risk",
    "velocity_merchant_risk",
    "combined_risk_signal",
    "amount_failed_attempts",
    "velocity_failed_attempts",
    "amount_distance",
    "merchant_distance"
]

print(behavior_features)


# ==================================================
# 4. TRAIN / TEST SPLIT
# ==================================================

X_train, X_test, y_train, y_test = train_test_split(
    X,
    y,
    test_size=0.20,
    random_state=42,
    stratify=y
)

print("\nTraining samples:", len(X_train))
print("Testing samples:", len(X_test))


# ==================================================
# 5. CREATE XGBOOST MODEL
# ==================================================

model = XGBClassifier(

    n_estimators=400,

    max_depth=6,

    learning_rate=0.05,

    subsample=0.8,

    colsample_bytree=0.8,

    objective="binary:logistic",

    eval_metric="logloss",

    scale_pos_weight=10.5,

    random_state=42,

    n_jobs=-1
)


# ==================================================
# 6. TRAIN
# ==================================================

print("\nTraining XGBoost model...")

model.fit(
    X_train,
    y_train
)

print("Training completed!")


# ==================================================
# 7. PREDICTIONS
# ==================================================

y_probability = model.predict_proba(
    X_test
)[:, 1]


y_prediction = (
    y_probability >= 0.5
).astype(int)


# ==================================================
# 8. EVALUATION
# ==================================================

print("\n========================================")
print("MODEL EVALUATION")
print("========================================")


# ROC-AUC

roc_auc = roc_auc_score(
    y_test,
    y_probability
)

print(
    "\nROC-AUC:",
    round(
        roc_auc,
        4
    )
)


# Classification report

print("\nClassification Report:")

print(
    classification_report(
        y_test,
        y_prediction
    )
)


# Confusion matrix

print("\nConfusion Matrix:")

print(
    confusion_matrix(
        y_test,
        y_prediction
    )
)


# ==================================================
# 9. FEATURE IMPORTANCE
# ==================================================

print("\n========================================")
print("TOP FEATURE IMPORTANCE")
print("========================================")


feature_importance = pd.DataFrame({

    "feature": X.columns,

    "importance": model.feature_importances_

})


feature_importance = feature_importance.sort_values(
    by="importance",
    ascending=False
)


print(
    feature_importance.head(15).to_string(
        index=False
    )
)


# ==================================================
# 10. SAVE MODEL
# ==================================================

MODEL_PATH = "models/fraud_model.joblib"

joblib.dump(
    model,
    MODEL_PATH
)


print("\n========================================")
print("Model saved successfully!")
print("========================================")

print(
    "Location:",
    MODEL_PATH
)