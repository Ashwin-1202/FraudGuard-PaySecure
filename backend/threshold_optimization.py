"""
Step 5: Threshold Optimization for Full Hybrid Fraud Detection

Hybrid score:
    45% LightGBM fraud score
    30% Isolation Forest anomaly score
    25% Rule engine score

The original 80/20 held-out portion is split into:
    50% validation -> threshold selection
    50% holdout    -> final evaluation

This prevents choosing the threshold and reporting performance
on exactly the same transactions.
"""

import os
import json
import time

import joblib
import numpy as np
import pandas as pd

from sklearn.metrics import (
    precision_score,
    recall_score,
    f1_score,
    roc_auc_score,
    confusion_matrix,
)

from sklearn.model_selection import train_test_split


# ============================================================
# CONFIGURATION
# ============================================================

DATA_PATH = "data/fraud_transactions.csv"

FRAUD_MODEL_PATH = "models/fraud_model.joblib"
ANOMALY_MODEL_PATH = "models/anomaly_model.joblib"

OUTPUT_DIR = "experiments"

RESULTS_CSV = os.path.join(
    OUTPUT_DIR,
    "threshold_optimization_results.csv"
)

RESULTS_JSON = os.path.join(
    OUTPUT_DIR,
    "threshold_optimization_results.json"
)

RANDOM_STATE = 42

# Hybrid weights
ML_WEIGHT = 0.45
ANOMALY_WEIGHT = 0.30
RULE_WEIGHT = 0.25


# ============================================================
# FEATURES
# ============================================================

BASE_FEATURES = [
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
    "unusual_hour",
]


ENGINEERED_FEATURES = [
    "amount_velocity",
    "amount_merchant_risk",
    "velocity_merchant_risk",
    "combined_risk_signal",
    "amount_failed_attempts",
    "velocity_failed_attempts",
    "amount_distance",
    "merchant_distance",
]


ML_FEATURES = BASE_FEATURES + ENGINEERED_FEATURES


# ============================================================
# LOAD MODELS
# ============================================================

def load_models():

    print("=" * 70)
    print("LOADING MODELS")
    print("=" * 70)

    fraud_model = joblib.load(FRAUD_MODEL_PATH)
    anomaly_model = joblib.load(ANOMALY_MODEL_PATH)

    print("Fraud model loaded successfully.")
    print("Anomaly model loaded successfully.")

    return fraud_model, anomaly_model


# ============================================================
# ENGINEERED FEATURES
# ============================================================

def create_engineered_features(df):

    df = df.copy()

    df["amount_velocity"] = (
        df["amount_ratio"]
        * df["transactions_last_10min"]
    )

    df["amount_merchant_risk"] = (
        df["amount_ratio"]
        * df["merchant_risk"]
    )

    df["velocity_merchant_risk"] = (
        df["transactions_last_10min"]
        * df["merchant_risk"]
    )

    df["combined_risk_signal"] = (
        df["amount_ratio"]
        * df["transactions_last_10min"]
        * df["merchant_risk"]
    )

    df["amount_failed_attempts"] = (
        df["amount_ratio"]
        * df["failed_attempts_10min"]
    )

    df["velocity_failed_attempts"] = (
        df["transactions_last_10min"]
        * df["failed_attempts_10min"]
    )

    df["amount_distance"] = (
        df["amount_ratio"]
        * df["distance_from_home"]
    )

    df["merchant_distance"] = (
        df["merchant_risk"]
        * df["distance_from_home"]
    )

    return df


# ============================================================
# RULE ENGINE
# ============================================================

def calculate_rule_score(row):

    score = 0

    # --------------------------------------------------------
    # Individual rules
    # --------------------------------------------------------

    if row["new_device"] == 1:
        score += 3

    if row["new_location"] == 1:
        score += 3

    if row["international"] == 1:
        score += 3

    velocity = row["transactions_last_10min"]

    if velocity >= 15:
        score += 4
    elif velocity >= 10:
        score += 5
    elif velocity >= 5:
        score += 3

    failed_attempts = row["failed_attempts_10min"]

    if failed_attempts >= 3:
        score += 3

    amount_ratio = row["amount_ratio"]

    if amount_ratio > 10:
        score += 5
    elif amount_ratio > 5:
        score += 4
    elif amount_ratio > 2:
        score += 3

    merchant_risk = row["merchant_risk"]

    if merchant_risk >= 9:
        score += 5
    elif merchant_risk >= 7:
        score += 3

    distance = row["distance_from_home"]

    if distance >= 200:
        score += 3
    elif distance >= 50:
        score += 2

    if row["unusual_hour"] == 1:
        score += 2

    # --------------------------------------------------------
    # Behavioral combinations
    # --------------------------------------------------------

    if amount_ratio > 2 and velocity >= 5:
        score += 5

    if merchant_risk >= 7 and velocity >= 5:
        score += 3

    if amount_ratio > 2 and merchant_risk >= 7:
        score += 3

    if (
        amount_ratio > 2
        and velocity >= 5
        and merchant_risk >= 7
    ):
        score += 5

    return score


def calculate_rule_scores(df):

    print("Calculating rule-engine scores...")

    scores = df.apply(
        calculate_rule_score,
        axis=1
    )

    scores = scores.astype(float)

    # Normalize to 0-100.
    #
    # The theoretical maximum can exceed 30,
    # so 40 is used as the normalization ceiling,
    # matching the existing hybrid logic.

    normalized = np.clip(
        scores / 40.0 * 100.0,
        0,
        100
    )

    return normalized.to_numpy()


# ============================================================
# ANOMALY SCORE
# ============================================================

def calculate_anomaly_scores(anomaly_model, df):

    print("Calculating anomaly scores...")

    X_anomaly = df[BASE_FEATURES]

    raw_scores = anomaly_model.decision_function(
        X_anomaly
    )

    # Convert Isolation Forest decision function
    # into a 0-100 anomaly score.
    #
    # Higher value = more anomalous.

    anomaly_scores = 50 - (
        raw_scores * 250
    )

    anomaly_scores = np.clip(
        anomaly_scores,
        0,
        100
    )

    return anomaly_scores


# ============================================================
# HYBRID SCORE
# ============================================================

def calculate_hybrid_scores(
    fraud_model,
    anomaly_model,
    df,
):

    print("Calculating hybrid risk scores...")

    # --------------------------------------------------------
    # ML prediction
    # --------------------------------------------------------

    X_ml = df[ML_FEATURES]

    fraud_probabilities = fraud_model.predict_proba(
        X_ml
    )[:, 1]

    fraud_scores = fraud_probabilities * 100

    # --------------------------------------------------------
    # Anomaly score
    # --------------------------------------------------------

    anomaly_scores = calculate_anomaly_scores(
        anomaly_model,
        df
    )

    # --------------------------------------------------------
    # Rule score
    # --------------------------------------------------------

    rule_scores = calculate_rule_scores(df)

    # --------------------------------------------------------
    # Hybrid score
    # --------------------------------------------------------

    hybrid_scores = (
        fraud_scores * ML_WEIGHT
        + anomaly_scores * ANOMALY_WEIGHT
        + rule_scores * RULE_WEIGHT
    )

    hybrid_scores = np.clip(
        hybrid_scores,
        0,
        100
    )

    # --------------------------------------------------------
    # Behavioral escalation
    # Same logic as risk_engine.py
    # --------------------------------------------------------

    escalated_scores = hybrid_scores.copy()

    for i in range(len(escalated_scores)):

        if (
            anomaly_scores[i] >= 70
            and rule_scores[i] >= 40
            and escalated_scores[i] < 31
        ):
            escalated_scores[i] = 31

    return (
        fraud_probabilities,
        fraud_scores,
        anomaly_scores,
        rule_scores,
        escalated_scores,
    )


# ============================================================
# METRICS
# ============================================================

def calculate_metrics(
    y_true,
    scores,
    threshold,
):

    predictions = (
        scores >= threshold
    ).astype(int)

    precision = precision_score(
        y_true,
        predictions,
        zero_division=0
    )

    recall = recall_score(
        y_true,
        predictions,
        zero_division=0
    )

    f1 = f1_score(
        y_true,
        predictions,
        zero_division=0
    )

    cm = confusion_matrix(
        y_true,
        predictions
    )

    tn, fp, fn, tp = cm.ravel()

    fpr = fp / (fp + tn)

    fnr = fn / (fn + tp)

    return {
        "threshold": float(threshold),
        "precision": float(precision),
        "recall": float(recall),
        "f1": float(f1),
        "fpr": float(fpr),
        "fnr": float(fnr),
        "true_negative": int(tn),
        "false_positive": int(fp),
        "false_negative": int(fn),
        "true_positive": int(tp),
    }


# ============================================================
# MAIN
# ============================================================

def main():

    start_time = time.time()

    print()
    print("=" * 70)
    print("STEP 5: HYBRID THRESHOLD OPTIMIZATION")
    print("=" * 70)
    print()

    os.makedirs(
        OUTPUT_DIR,
        exist_ok=True
    )

    # ========================================================
    # LOAD DATA
    # ========================================================

    print("Loading dataset...")

    df = pd.read_csv(
        DATA_PATH
    )

    print(
        f"Dataset shape: {df.shape}"
    )

    print(
        f"Fraud transactions: "
        f"{df['is_fraud'].sum()}"
    )

    print(
        f"Normal transactions: "
        f"{(df['is_fraud'] == 0).sum()}"
    )

    # ========================================================
    # CREATE ENGINEERED FEATURES
    # ========================================================

    df = create_engineered_features(
        df
    )

    # ========================================================
    # LOAD MODELS
    # ========================================================

    fraud_model, anomaly_model = load_models()

    # ========================================================
    # ORIGINAL TRAIN / TEST SPLIT
    #
    # Same split used in previous experiments.
    # ========================================================

    indices = np.arange(
        len(df)
    )

    train_indices, test_indices = train_test_split(
        indices,
        test_size=0.20,
        random_state=RANDOM_STATE,
        stratify=df["is_fraud"]
    )

    print()
    print("=" * 70)
    print("ORIGINAL HOLDOUT SPLIT")
    print("=" * 70)

    print(
        f"Training transactions: "
        f"{len(train_indices)}"
    )

    print(
        f"Original holdout transactions: "
        f"{len(test_indices)}"
    )

    # ========================================================
    # SPLIT ORIGINAL HOLDOUT INTO:
    #
    # Validation = threshold selection
    # Final test = final evaluation
    # ========================================================

    validation_indices, final_test_indices = train_test_split(
        test_indices,
        test_size=0.50,
        random_state=RANDOM_STATE,
        stratify=df.loc[
            test_indices,
            "is_fraud"
        ]
    )

    df_validation = df.loc[
        validation_indices
    ].copy()

    df_final_test = df.loc[
        final_test_indices
    ].copy()

    y_validation = (
        df_validation["is_fraud"]
        .to_numpy()
    )

    y_final_test = (
        df_final_test["is_fraud"]
        .to_numpy()
    )

    print()
    print("=" * 70)
    print("VALIDATION / FINAL TEST SPLIT")
    print("=" * 70)

    print(
        f"Validation transactions: "
        f"{len(df_validation)}"
    )

    print(
        f"Final test transactions: "
        f"{len(df_final_test)}"
    )

    print(
        f"Validation fraud rate: "
        f"{y_validation.mean() * 100:.2f}%"
    )

    print(
        f"Final test fraud rate: "
        f"{y_final_test.mean() * 100:.2f}%"
    )

    # ========================================================
    # CALCULATE SCORES ONCE
    # ========================================================

    print()
    print("=" * 70)
    print("GENERATING VALIDATION SCORES")
    print("=" * 70)

    (
        validation_prob,
        validation_ml,
        validation_anomaly,
        validation_rules,
        validation_hybrid,
    ) = calculate_hybrid_scores(
        fraud_model,
        anomaly_model,
        df_validation
    )

    print()
    print("=" * 70)
    print("GENERATING FINAL TEST SCORES")
    print("=" * 70)

    (
        final_prob,
        final_ml,
        final_anomaly,
        final_rules,
        final_hybrid,
    ) = calculate_hybrid_scores(
        fraud_model,
        anomaly_model,
        df_final_test
    )

    # ========================================================
    # ROC-AUC
    #
    # ROC-AUC doesn't depend on threshold.
    # ========================================================

    validation_auc = roc_auc_score(
        y_validation,
        validation_hybrid
    )

    final_auc = roc_auc_score(
        y_final_test,
        final_hybrid
    )

    print()
    print(
        f"Validation ROC-AUC: "
        f"{validation_auc:.4f}"
    )

    print(
        f"Final Test ROC-AUC: "
        f"{final_auc:.4f}"
    )

    # ========================================================
    # THRESHOLD SEARCH
    # ========================================================

    print()
    print("=" * 70)
    print("SEARCHING FOR BEST THRESHOLD")
    print("=" * 70)

    threshold_results = []

    # Search every threshold from 20 to 80.
    # This gives a more precise result than only checking
    # 20, 25, 30, etc.

    for threshold in range(
        20,
        81
    ):

        metrics = calculate_metrics(
            y_validation,
            validation_hybrid,
            threshold
        )

        threshold_results.append(
            metrics
        )

    threshold_df = pd.DataFrame(
        threshold_results
    )

    # ========================================================
    # BEST F1
    # ========================================================

    best_row = threshold_df.loc[
        threshold_df["f1"].idxmax()
    ]

    best_threshold = float(
        best_row["threshold"]
    )

    print()
    print("=" * 70)
    print("BEST THRESHOLD")
    print("=" * 70)

    print(
        f"Best threshold : "
        f"{best_threshold:.0f}"
    )

    print(
        f"Precision      : "
        f"{best_row['precision']:.4f}"
    )

    print(
        f"Recall         : "
        f"{best_row['recall']:.4f}"
    )

    print(
        f"F1 Score       : "
        f"{best_row['f1']:.4f}"
    )

    print(
        f"FPR            : "
        f"{best_row['fpr']:.4f}"
    )

    print(
        f"FNR            : "
        f"{best_row['fnr']:.4f}"
    )

    # ========================================================
    # PRINT THRESHOLD TABLE
    # ========================================================

    print()
    print("=" * 70)
    print("THRESHOLD COMPARISON")
    print("=" * 70)

    display_df = threshold_df[
        threshold_df["threshold"] % 5 == 0
    ][
        [
            "threshold",
            "precision",
            "recall",
            "f1",
            "fpr",
            "fnr",
        ]
    ].copy()

    print(
        display_df.to_string(
            index=False,
            float_format=lambda x: f"{x:.4f}"
        )
    )

    # ========================================================
    # FINAL EVALUATION
    # ========================================================

    print()
    print("=" * 70)
    print("FINAL EVALUATION ON UNSEEN HOLDOUT")
    print("=" * 70)

    final_metrics = calculate_metrics(
        y_final_test,
        final_hybrid,
        best_threshold
    )

    print(
        f"Threshold      : "
        f"{final_metrics['threshold']:.0f}"
    )

    print(
        f"Precision      : "
        f"{final_metrics['precision']:.4f}"
    )

    print(
        f"Recall         : "
        f"{final_metrics['recall']:.4f}"
    )

    print(
        f"F1 Score       : "
        f"{final_metrics['f1']:.4f}"
    )

    print(
        f"ROC-AUC        : "
        f"{final_auc:.4f}"
    )

    print(
        f"FPR            : "
        f"{final_metrics['fpr']:.4f}"
    )

    print(
        f"FNR            : "
        f"{final_metrics['fnr']:.4f}"
    )

    # ========================================================
    # CONFUSION MATRIX
    # ========================================================

    print()
    print("Confusion Matrix:")

    cm = np.array(
        [
            [
                final_metrics["true_negative"],
                final_metrics["false_positive"],
            ],
            [
                final_metrics["false_negative"],
                final_metrics["true_positive"],
            ],
        ]
    )

    print(cm)

    # ========================================================
    # SAVE CSV
    # ========================================================

    threshold_df.to_csv(
        RESULTS_CSV,
        index=False
    )

    # ========================================================
    # SAVE JSON
    # ========================================================

    results_json = {
        "method": "Full Hybrid Threshold Optimization",

        "dataset": {
            "total_transactions": int(len(df)),
            "fraud_transactions": int(
                df["is_fraud"].sum()
            ),
            "normal_transactions": int(
                (df["is_fraud"] == 0).sum()
            ),
        },

        "split": {
            "original_training_size": int(
                len(train_indices)
            ),
            "original_holdout_size": int(
                len(test_indices)
            ),
            "validation_size": int(
                len(validation_indices)
            ),
            "final_test_size": int(
                len(final_test_indices)
            ),
        },

        "hybrid_weights": {
            "lightgbm": ML_WEIGHT,
            "anomaly": ANOMALY_WEIGHT,
            "rules": RULE_WEIGHT,
        },

        "best_threshold": best_threshold,

        "validation_metrics": {
            "precision": float(
                best_row["precision"]
            ),
            "recall": float(
                best_row["recall"]
            ),
            "f1": float(
                best_row["f1"]
            ),
            "fpr": float(
                best_row["fpr"]
            ),
            "fnr": float(
                best_row["fnr"]
            ),
            "roc_auc": float(
                validation_auc
            ),
        },

        "final_test_metrics": {
            **final_metrics,
            "roc_auc": float(
                final_auc
            ),
        },

        "threshold_results": threshold_results,

        "runtime_seconds": (
            time.time() - start_time
        ),
    }

    with open(
        RESULTS_JSON,
        "w"
    ) as f:

        json.dump(
            results_json,
            f,
            indent=4
        )

    # ========================================================
    # FINAL SUMMARY
    # ========================================================

    print()
    print("=" * 70)
    print("STEP 5 COMPLETED")
    print("=" * 70)

    print(
        f"Best threshold : "
        f"{best_threshold:.0f}"
    )

    print(
        f"Final Precision: "
        f"{final_metrics['precision']:.4f}"
    )

    print(
        f"Final Recall   : "
        f"{final_metrics['recall']:.4f}"
    )

    print(
        f"Final F1       : "
        f"{final_metrics['f1']:.4f}"
    )

    print(
        f"Final ROC-AUC  : "
        f"{final_auc:.4f}"
    )

    print()
    print(
        f"CSV saved to : "
        f"{RESULTS_CSV}"
    )

    print(
        f"JSON saved to: "
        f"{RESULTS_JSON}"
    )

    print()
    print(
        "Next step: update risk_engine.py "
        "with the optimized threshold."
    )


if __name__ == "__main__":
    main()