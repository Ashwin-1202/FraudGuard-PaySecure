import pandas as pd
import joblib

from sklearn.ensemble import IsolationForest
from sklearn.pipeline import Pipeline
from sklearn.preprocessing import StandardScaler


# ---------------------------------------------
# 1. LOAD DATA
# ---------------------------------------------

DATA_PATH = "data/fraud_transactions.csv"

df = pd.read_csv(DATA_PATH)

print("Dataset loaded!")
print("Shape:", df.shape)


# ---------------------------------------------
# 2. SELECT ONLY LEGITIMATE TRANSACTIONS
# ---------------------------------------------

normal_data = df[df["is_fraud"] == 0].copy()

print("\nNormal transactions:", len(normal_data))


# ---------------------------------------------
# 3. FEATURES
# ---------------------------------------------

features = [
    "amount",
    "avg_user_amount",
    "amount_ratio",
    "transactions_last_10min",
    "new_device",
    "new_location",
    "international",
    "merchant_risk",
    "account_age_days",
    "device_age_days",
    "distance_from_home",
    "failed_attempts_10min",
    "hour",
    "day_of_week",
    "is_weekend",
    "unusual_hour"
]

X_normal = normal_data[features]


print("\nFeatures used for anomaly detection:")
print(features)


# ---------------------------------------------
# 4. CREATE ANOMALY PIPELINE
# ---------------------------------------------

anomaly_model = Pipeline([
    (
        "scaler",
        StandardScaler()
    ),

    (
        "isolation_forest",
        IsolationForest(
            n_estimators=200,
            contamination=0.05,
            random_state=42,
            n_jobs=-1
        )
    )
])


# ---------------------------------------------
# 5. TRAIN
# ---------------------------------------------

print("\nTraining Isolation Forest...")

anomaly_model.fit(X_normal)

print("Anomaly model training completed!")


# ---------------------------------------------
# 6. SAVE MODEL
# ---------------------------------------------

MODEL_PATH = "models/anomaly_model.joblib"

joblib.dump(
    anomaly_model,
    MODEL_PATH
)

print("\n========================================")
print("Anomaly model saved successfully!")
print("========================================")

print("Location:", MODEL_PATH)