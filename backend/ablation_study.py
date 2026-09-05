import os
import json
import time
import joblib
import numpy as np
import pandas as pd

from sklearn.model_selection import train_test_split
from sklearn.metrics import (
    precision_score,
    recall_score,
    f1_score,
    roc_auc_score,
    confusion_matrix,
)


# ============================================================
# CONFIGURATION
# ============================================================

DATA_PATH = "data/fraud_transactions.csv"
MODEL_PATH = "models/fraud_model.joblib"

OUTPUT_DIR = "experiments"

RANDOM_STATE = 42

# Risk thresholds
ML_THRESHOLD = 0.50
ANOMALY_THRESHOLD = 50.0
RULE_THRESHOLD = 40.0
HYBRID_THRESHOLD = 50.0


# ============================================================
# FEATURE DEFINITIONS
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
# CREATE ENGINEERED FEATURES
# ============================================================

def create_engineered_features(df):
    """
    Create the same behavioral features used during
    LightGBM training.
    """

    df = df.copy()

    df["amount_velocity"] = (
        df["amount"] *
        (df["transactions_last_10min"] + 1)
    )

    df["amount_merchant_risk"] = (
        df["amount_ratio"] *
        df["merchant_risk"]
    )

    df["velocity_merchant_risk"] = (
        df["transactions_last_10min"] *
        df["merchant_risk"]
    )

    df["combined_risk_signal"] = (
        df["amount_ratio"] *
        (df["transactions_last_10min"] + 1) *
        (df["merchant_risk"] + 1)
    )

    df["amount_failed_attempts"] = (
        df["amount_ratio"] *
        (df["failed_attempts_10min"] + 1)
    )

    df["velocity_failed_attempts"] = (
        df["transactions_last_10min"] *
        (df["failed_attempts_10min"] + 1)
    )

    df["amount_distance"] = (
        df["amount_ratio"] *
        (df["distance_from_home"] + 1)
    )

    df["merchant_distance"] = (
        df["merchant_risk"] *
        (df["distance_from_home"] + 1)
    )

    return df


# ============================================================
# ANOMALY MODEL FEATURES
# ============================================================

def create_anomaly_features(df):
    return df[BASE_FEATURES].copy()


# ============================================================
# RULE ENGINE
# ============================================================

def calculate_rule_score(row):
    """
    Same rule logic used by the risk engine.

    Returns:
        score
        reasons
    """

    score = 0

    # --------------------------------------------------------
    # Basic risk indicators
    # --------------------------------------------------------

    if row["new_device"] == 1:
        score += 3

    if row["new_location"] == 1:
        score += 3

    if row["international"] == 1:
        score += 3

    # --------------------------------------------------------
    # Transaction velocity
    # --------------------------------------------------------

    velocity = row["transactions_last_10min"]

    if velocity >= 5:
        score += 3

    if velocity >= 10:
        score += 5

    if velocity >= 15:
        score += 4

    # --------------------------------------------------------
    # Failed attempts
    # --------------------------------------------------------

    if row["failed_attempts_10min"] >= 3:
        score += 3

    # --------------------------------------------------------
    # Amount ratio
    # --------------------------------------------------------

    ratio = row["amount_ratio"]

    if ratio > 2:
        score += 3

    if ratio > 5:
        score += 4

    if ratio > 10:
        score += 5

    # --------------------------------------------------------
    # Merchant risk
    # --------------------------------------------------------

    merchant = row["merchant_risk"]

    if merchant >= 7:
        score += 3

    if merchant >= 9:
        score += 2

    # --------------------------------------------------------
    # Distance
    # --------------------------------------------------------

    distance = row["distance_from_home"]

    if distance >= 50:
        score += 2

    if distance >= 200:
        score += 3

    # --------------------------------------------------------
    # Unusual hour
    # --------------------------------------------------------

    if row["unusual_hour"] == 1:
        score += 2

    # --------------------------------------------------------
    # Behavioral combinations
    # --------------------------------------------------------

    if (
        ratio > 2 and
        velocity >= 5
    ):
        score += 5

    if (
        merchant >= 7 and
        velocity >= 5
    ):
        score += 3

    if (
        ratio > 2 and
        merchant >= 7
    ):
        score += 3

    if (
        ratio > 2 and
        velocity >= 5 and
        merchant >= 7
    ):
        score += 5

    return score


# ============================================================
# ANOMALY SCORE
# ============================================================

def calculate_anomaly_scores(
    anomaly_model,
    df
):
    """
    Convert Isolation Forest decision function
    into a 0-100 anomaly score.

    Higher score = more anomalous.
    """

    X = create_anomaly_features(df)

    raw_scores = anomaly_model.decision_function(X)

    anomaly_scores = (
        50 -
        raw_scores * 250
    )

    anomaly_scores = np.clip(
        anomaly_scores,
        0,
        100
    )

    return anomaly_scores


# ============================================================
# MAIN
# ============================================================

def main():

    print("=" * 70)
    print("RISK ENGINE ABLATION STUDY")
    print("=" * 70)

    # --------------------------------------------------------
    # Create output directory
    # --------------------------------------------------------

    os.makedirs(
        OUTPUT_DIR,
        exist_ok=True
    )

    # --------------------------------------------------------
    # Load dataset
    # --------------------------------------------------------

    print("\nLoading dataset...")

    df = pd.read_csv(DATA_PATH)

    print(
        f"Dataset shape: {df.shape}"
    )

    print(
        f"Fraud transactions: "
        f"{df['is_fraud'].sum()}"
    )

    print(
        f"Legitimate transactions: "
        f"{(df['is_fraud'] == 0).sum()}"
    )

    # --------------------------------------------------------
    # Create ML features
    # --------------------------------------------------------

    print("\nCreating behavioral features...")

    df = create_engineered_features(df)

    X = df[ML_FEATURES]

    y = df["is_fraud"]

    # --------------------------------------------------------
    # Same train/test split
    # --------------------------------------------------------

    print("\nCreating test set...")

    (
        X_train,
        X_test,
        y_train,
        y_test
    ) = train_test_split(
        X,
        y,
        test_size=0.20,
        stratify=y,
        random_state=RANDOM_STATE
    )

    print(
        f"Training samples: {len(X_train)}"
    )

    print(
        f"Testing samples: {len(X_test)}"
    )

    # --------------------------------------------------------
    # Load LightGBM
    # --------------------------------------------------------

    print("\nLoading LightGBM model...")

    fraud_model = joblib.load(
        MODEL_PATH
    )

    print(
        f"Model loaded from: {MODEL_PATH}"
    )

    # --------------------------------------------------------
    # ML predictions
    # --------------------------------------------------------

    print("\nGenerating LightGBM predictions...")

    start_time = time.time()

    fraud_probability = (
        fraud_model.predict_proba(
            X_test
        )[:, 1]
    )

    ml_inference_time = (
        time.time() -
        start_time
    )

    fraud_score = (
        fraud_probability * 100
    )

    # --------------------------------------------------------
    # Anomaly model
    # --------------------------------------------------------

    print("\nLoading anomaly model...")

    anomaly_model = joblib.load(
        "models/anomaly_model.joblib"
    )

    # Need original test rows for anomaly features
    test_indices = X_test.index

    df_test = df.loc[
        test_indices
    ].copy()

    print(
        "Generating anomaly scores..."
    )

    start_time = time.time()

    anomaly_scores = calculate_anomaly_scores(
        anomaly_model,
        df_test
    )

    anomaly_inference_time = (
        time.time() -
        start_time
    )

    # --------------------------------------------------------
    # Rule scores
    # --------------------------------------------------------

    print(
        "\nCalculating rule-engine scores..."
    )

    rule_scores = []

    for _, row in df_test.iterrows():

        score = calculate_rule_score(
            row
        )

        rule_scores.append(
            score
        )

    rule_scores = np.array(
        rule_scores
    )

    # --------------------------------------------------------
    # Normalize rule score
    # --------------------------------------------------------

    MAX_RULE_SCORE = 60.0

    normalized_rule_scores = (
        rule_scores /
        MAX_RULE_SCORE
    ) * 100

    normalized_rule_scores = np.clip(
        normalized_rule_scores,
        0,
        100
    )

    # ========================================================
    # ABLATION CONFIGURATIONS
    # ========================================================

    print("\n" + "=" * 70)
    print("RUNNING ABLATION CONFIGURATIONS")
    print("=" * 70)

    results = []

    # --------------------------------------------------------
    # A. ML ONLY
    # --------------------------------------------------------

    print("\n[1/4] LightGBM Only")

    ml_only_score = fraud_score.copy()

    ml_only_prediction = (
        fraud_probability >=
        ML_THRESHOLD
    ).astype(int)

    results.append(
        evaluate_configuration(
            name="LightGBM Only",
            scores=ml_only_score,
            predictions=ml_only_prediction,
            y_true=y_test,
            inference_time=ml_inference_time
        )
    )

    # --------------------------------------------------------
    # B. ML + ANOMALY
    # --------------------------------------------------------

    print("[2/4] LightGBM + Anomaly")

    ml_anomaly_score = (
        fraud_score * 0.70 +
        anomaly_scores * 0.30
    )

    ml_anomaly_prediction = (
        ml_anomaly_score >=
        HYBRID_THRESHOLD
    ).astype(int)

    results.append(
        evaluate_configuration(
            name="LightGBM + Anomaly",
            scores=ml_anomaly_score,
            predictions=ml_anomaly_prediction,
            y_true=y_test,
            inference_time=(
                ml_inference_time +
                anomaly_inference_time
            )
        )
    )

    # --------------------------------------------------------
    # C. ML + RULES
    # --------------------------------------------------------

    print("[3/4] LightGBM + Rules")

    ml_rules_score = (
        fraud_score * 0.70 +
        normalized_rule_scores * 0.30
    )

    ml_rules_prediction = (
        ml_rules_score >=
        HYBRID_THRESHOLD
    ).astype(int)

    results.append(
        evaluate_configuration(
            name="LightGBM + Rules",
            scores=ml_rules_score,
            predictions=ml_rules_prediction,
            y_true=y_test,
            inference_time=ml_inference_time
        )
    )

    # --------------------------------------------------------
    # D. FULL HYBRID
    # --------------------------------------------------------

    print("[4/4] Full Hybrid")

    hybrid_score = (
        fraud_score * 0.45 +
        anomaly_scores * 0.30 +
        normalized_rule_scores * 0.25
    )

    hybrid_prediction = (
        hybrid_score >=
        HYBRID_THRESHOLD
    ).astype(int)

    results.append(
        evaluate_configuration(
            name="Full Hybrid",
            scores=hybrid_score,
            predictions=hybrid_prediction,
            y_true=y_test,
            inference_time=(
                ml_inference_time +
                anomaly_inference_time
            )
        )
    )

    # ========================================================
    # RESULTS
    # ========================================================

    results_df = pd.DataFrame(
        results
    )

    print("\n" + "=" * 70)
    print("ABLATION RESULTS")
    print("=" * 70)

    print(
        results_df[
            [
                "configuration",
                "precision",
                "recall",
                "f1_score",
                "roc_auc",
                "inference_time"
            ]
        ].to_string(
            index=False
        )
    )

    # ========================================================
    # BEST MODEL
    # ========================================================

    best_index = (
        results_df["f1_score"]
        .idxmax()
    )

    best_model = (
        results_df.loc[
            best_index,
            "configuration"
        ]
    )

    print("\n" + "=" * 70)

    print(
        f"BEST CONFIGURATION: {best_model}"
    )

    print(
        f"Best F1 Score: "
        f"{results_df.loc[best_index, 'f1_score']:.4f}"
    )

    print(
        f"Best Recall: "
        f"{results_df.loc[best_index, 'recall']:.4f}"
    )

    print(
        f"Best Precision: "
        f"{results_df.loc[best_index, 'precision']:.4f}"
    )

    print(
        f"Best ROC-AUC: "
        f"{results_df.loc[best_index, 'roc_auc']:.4f}"
    )

    # ========================================================
    # SAVE CSV
    # ========================================================

    csv_path = (
        f"{OUTPUT_DIR}/"
        "ablation_results.csv"
    )

    results_df.to_csv(
        csv_path,
        index=False
    )

    print(
        f"\nResults saved to: {csv_path}"
    )

    # ========================================================
    # SAVE JSON
    # ========================================================

    json_path = (
        f"{OUTPUT_DIR}/"
        "ablation_results.json"
    )

    output_json = {
        "experiment": "Risk Engine Ablation Study",
        "dataset": {
            "total_transactions": int(len(df)),
            "fraud_transactions": int(
                df["is_fraud"].sum()
            ),
            "legitimate_transactions": int(
                (df["is_fraud"] == 0).sum()
            ),
            "fraud_rate": float(
                df["is_fraud"].mean()
            )
        },
        "configurations": results,
        "best_configuration": best_model
    }

    with open(
        json_path,
        "w"
    ) as f:

        json.dump(
            output_json,
            f,
            indent=4
        )

    print(
        f"Results saved to: {json_path}"
    )

    print("\n" + "=" * 70)
    print("ABLATION STUDY COMPLETED")
    print("=" * 70)


# ============================================================
# EVALUATION FUNCTION
# ============================================================

def evaluate_configuration(
    name,
    scores,
    predictions,
    y_true,
    inference_time
):

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

    roc_auc = roc_auc_score(
        y_true,
        scores / 100
    )

    cm = confusion_matrix(
        y_true,
        predictions
    )

    tn, fp, fn, tp = cm.ravel()

    false_positive_rate = (
        fp /
        (fp + tn)
        if (fp + tn) > 0
        else 0
    )

    false_negative_rate = (
        fn /
        (fn + tp)
        if (fn + tp) > 0
        else 0
    )

    print(
        f"\n{name}"
    )

    print(
        f"  Precision : {precision:.4f}"
    )

    print(
        f"  Recall    : {recall:.4f}"
    )

    print(
        f"  F1 Score  : {f1:.4f}"
    )

    print(
        f"  ROC-AUC   : {roc_auc:.4f}"
    )

    print(
        f"  FPR       : {false_positive_rate:.4f}"
    )

    print(
        f"  FNR       : {false_negative_rate:.4f}"
    )

    print(
        "  Confusion Matrix:"
    )

    print(
        cm
    )

    return {
        "configuration": name,
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
        "false_positive_rate": round(
            float(false_positive_rate),
            4
        ),
        "false_negative_rate": round(
            float(false_negative_rate),
            4
        ),
        "inference_time": round(
            float(inference_time),
            6
        ),
        "true_negative": int(tn),
        "false_positive": int(fp),
        "false_negative": int(fn),
        "true_positive": int(tp)
    }


# ============================================================
# ENTRY POINT
# ============================================================

if __name__ == "__main__":
    main()