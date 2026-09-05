"""
Step 7: Concept Drift Simulation

Simulates changing fraud patterns over time and measures
whether the fraud detection model continues to perform well.

Fraud patterns simulated:

Month 1:
    Baseline fraud behavior

Month 2:
    Increased international fraud

Month 3:
    Low-and-slow fraud

Month 4:
    Account takeover behavior

The script:
1. Loads the trained LightGBM fraud model.
2. Loads the current fraud dataset.
3. Creates four simulated monthly datasets.
4. Applies changing fraud patterns.
5. Generates fraud probabilities.
6. Calculates precision, recall, F1 and FPR.
7. Measures distribution drift.
8. Determines whether model retraining is recommended.
9. Saves results for later dashboard/monitoring use.
"""

import os
import json
import joblib
import warnings

import numpy as np
import pandas as pd

from sklearn.metrics import (
    precision_score,
    recall_score,
    f1_score,
    roc_auc_score,
)


# ============================================================
# CONFIGURATION
# ============================================================

DATA_PATH = "data/fraud_transactions.csv"
MODEL_PATH = "models/fraud_model.joblib"

OUTPUT_DIR = "experiments"

RANDOM_STATE = 42

# Alert / classification threshold from Step 5
RISK_THRESHOLD = 52

# Fraud probability threshold corresponding to the
# hybrid risk threshold is not directly identical.
# For drift monitoring we use the model probability
# threshold of 0.50.
MODEL_THRESHOLD = 0.50

# Drift threshold
DRIFT_THRESHOLD = 0.10

# Number of transactions per simulated month
MONTH_SIZE = 5000


# ============================================================
# FEATURE CONFIGURATION
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
# HELPER FUNCTIONS
# ============================================================


def create_ml_features(df):
    """
    Recreate the same engineered features used during
    LightGBM training.
    """

    data = df.copy()

    data["amount_velocity"] = (
        data["amount"] *
        data["transactions_last_10min"]
    )

    data["amount_merchant_risk"] = (
        data["amount"] *
        data["merchant_risk"]
    )

    data["velocity_merchant_risk"] = (
        data["transactions_last_10min"] *
        data["merchant_risk"]
    )

    data["combined_risk_signal"] = (
        data["amount_ratio"] *
        data["transactions_last_10min"] *
        (1 + data["merchant_risk"] / 10)
    )

    data["amount_failed_attempts"] = (
        data["amount"] *
        data["failed_attempts_10min"]
    )

    data["velocity_failed_attempts"] = (
        data["transactions_last_10min"] *
        data["failed_attempts_10min"]
    )

    data["amount_distance"] = (
        data["amount"] *
        data["distance_from_home"]
    )

    data["merchant_distance"] = (
        data["merchant_risk"] *
        data["distance_from_home"]
    )

    return data


# ============================================================
# LOAD MODEL
# ============================================================


def load_model():
    """
    Load the trained LightGBM fraud model.
    """

    if not os.path.exists(MODEL_PATH):
        raise FileNotFoundError(
            f"Fraud model not found: {MODEL_PATH}"
        )

    model = joblib.load(MODEL_PATH)

    print("Fraud model loaded!")

    return model


# ============================================================
# LOAD DATASET
# ============================================================


def load_dataset():
    """
    Load the original fraud dataset.
    """

    if not os.path.exists(DATA_PATH):
        raise FileNotFoundError(
            f"Dataset not found: {DATA_PATH}"
        )

    df = pd.read_csv(DATA_PATH)

    print("Dataset loaded!")
    print(f"Dataset shape: {df.shape}")

    if "is_fraud" not in df.columns:
        raise ValueError(
            "Dataset must contain 'is_fraud' column."
        )

    return df


# ============================================================
# CREATE BASELINE MONTH
# ============================================================


def create_month_1(df, rng):
    """
    Month 1:
    Baseline fraud behavior.

    We randomly sample transactions from the
    original dataset.
    """

    month = df.sample(
        n=MONTH_SIZE,
        replace=True,
        random_state=RANDOM_STATE,
    ).copy()

    month.reset_index(drop=True, inplace=True)

    return month


# ============================================================
# MONTH 2 — INTERNATIONAL FRAUD
# ============================================================


def create_month_2(df, rng):
    """
    Month 2:

    Fraudsters increasingly use international
    transactions.

    Changes:
        international ↑
        distance_from_home ↑
        merchant_risk ↑ slightly
    """

    month = df.sample(
        n=MONTH_SIZE,
        replace=True,
        random_state=RANDOM_STATE + 1,
    ).copy()

    month.reset_index(drop=True, inplace=True)

    fraud_mask = month["is_fraud"] == 1

    fraud_count = fraud_mask.sum()

    if fraud_count > 0:

        month.loc[
            fraud_mask,
            "international"
        ] = 1

        month.loc[
            fraud_mask,
            "distance_from_home"
        ] = np.maximum(
            month.loc[
                fraud_mask,
                "distance_from_home"
            ].values,
            rng.integers(
                100,
                500,
                size=fraud_count
            )
        )

        month.loc[
            fraud_mask,
            "merchant_risk"
        ] = np.minimum(
            10,
            month.loc[
                fraud_mask,
                "merchant_risk"
            ].values + 1
        )

    return month


# ============================================================
# MONTH 3 — LOW AND SLOW FRAUD
# ============================================================


def create_month_3(df, rng):
    """
    Month 3:

    Fraudsters avoid obvious high velocity.

    Instead of many transactions quickly,
    they use moderately unusual amounts
    with repeated transactions over time.

    Changes:
        transactions_last_10min ↓
        amount_ratio moderately elevated
        merchant_risk moderately elevated
        failed attempts remain low
    """

    month = df.sample(
        n=MONTH_SIZE,
        replace=True,
        random_state=RANDOM_STATE + 2,
    ).copy()

    month.reset_index(drop=True, inplace=True)

    fraud_mask = month["is_fraud"] == 1

    fraud_count = fraud_mask.sum()

    if fraud_count > 0:

        month.loc[
            fraud_mask,
            "transactions_last_10min"
        ] = rng.integers(
            1,
            4,
            size=fraud_count
        )

        month.loc[
            fraud_mask,
            "amount_ratio"
        ] = rng.uniform(
            1.8,
            3.5,
            size=fraud_count
        )

        month.loc[
            fraud_mask,
            "merchant_risk"
        ] = rng.integers(
            5,
            9,
            size=fraud_count
        )

        month.loc[
            fraud_mask,
            "failed_attempts_10min"
        ] = rng.integers(
            0,
            2,
            size=fraud_count
        )

        month.loc[
            fraud_mask,
            "unusual_hour"
        ] = rng.integers(
            0,
            2,
            size=fraud_count
        )

    return month


# ============================================================
# MONTH 4 — ACCOUNT TAKEOVER
# ============================================================


def create_month_4(df, rng):
    """
    Month 4:

    Account takeover fraud.

    Typical behavior:
        new device
        new location
        unusual hour
        failed login/payment attempts
        large transaction
    """

    month = df.sample(
        n=MONTH_SIZE,
        replace=True,
        random_state=RANDOM_STATE + 3,
    ).copy()

    month.reset_index(drop=True, inplace=True)

    fraud_mask = month["is_fraud"] == 1

    fraud_count = fraud_mask.sum()

    if fraud_count > 0:

        month.loc[
            fraud_mask,
            "new_device"
        ] = 1

        month.loc[
            fraud_mask,
            "new_location"
        ] = 1

        month.loc[
            fraud_mask,
            "unusual_hour"
        ] = 1

        month.loc[
            fraud_mask,
            "failed_attempts_10min"
        ] = rng.integers(
            2,
            6,
            size=fraud_count
        )

        month.loc[
            fraud_mask,
            "amount_ratio"
        ] = rng.uniform(
            2.0,
            6.0,
            size=fraud_count
        )

        month.loc[
            fraud_mask,
            "distance_from_home"
        ] = rng.integers(
            50,
            500,
            size=fraud_count
        )

    return month


# ============================================================
# DISTRIBUTION DRIFT
# ============================================================


def calculate_distribution_drift(
    baseline,
    current,
):
    """
    Calculate a simple normalized mean-shift drift score.

    Formula:

        |current_mean - baseline_mean|
        --------------------------------
             baseline_std + epsilon

    The result is clipped to [0, 1].

    This is a lightweight monitoring metric suitable
    for the project prototype.
    """

    numeric_columns = [
        "amount",
        "amount_ratio",
        "transactions_last_10min",
        "international",
        "merchant_risk",
        "distance_from_home",
        "failed_attempts_10min",
        "new_device",
        "new_location",
        "unusual_hour",
    ]

    drift_values = []

    for column in numeric_columns:

        if column not in baseline.columns:
            continue

        baseline_mean = baseline[column].mean()
        current_mean = current[column].mean()

        baseline_std = baseline[column].std()

        denominator = baseline_std + 1e-6

        drift = abs(
            current_mean - baseline_mean
        ) / denominator

        drift_values.append(
            min(drift, 1.0)
        )

    if not drift_values:
        return 0.0

    return float(
        np.mean(drift_values)
    )


# ============================================================
# MODEL EVALUATION
# ============================================================


def evaluate_month(
    model,
    month,
):
    """
    Evaluate LightGBM on one simulated month.
    """

    data = create_ml_features(month)

    X = data[ML_FEATURES]
    y = data["is_fraud"]

    probabilities = model.predict_proba(X)[:, 1]

    predictions = (
        probabilities >= MODEL_THRESHOLD
    ).astype(int)

    precision = precision_score(
        y,
        predictions,
        zero_division=0,
    )

    recall = recall_score(
        y,
        predictions,
        zero_division=0,
    )

    f1 = f1_score(
        y,
        predictions,
        zero_division=0,
    )

    roc_auc = roc_auc_score(
        y,
        probabilities,
    )

    false_positives = (
        ((predictions == 1) & (y == 0))
        .sum()
    )

    true_negatives = (
        ((predictions == 0) & (y == 0))
        .sum()
    )

    if false_positives + true_negatives > 0:

        fpr = (
            false_positives /
            (false_positives + true_negatives)
        )

    else:
        fpr = 0.0

    return {
        "precision": float(precision),
        "recall": float(recall),
        "f1": float(f1),
        "roc_auc": float(roc_auc),
        "fpr": float(fpr),
        "fraud_rate": float(y.mean()),
    }


# ============================================================
# DRIFT INTERPRETATION
# ============================================================


def interpret_drift(
    drift_score,
):
    """
    Convert numerical drift score into
    an easy-to-understand status.
    """

    if drift_score >= DRIFT_THRESHOLD:

        return "DRIFT_DETECTED"

    return "STABLE"


# ============================================================
# RETRAINING DECISION
# ============================================================


def should_retrain(
    baseline_metrics,
    current_metrics,
    drift_score,
):
    """
    Determine whether model retraining should
    be recommended.

    Retraining is recommended if:

    1. Significant distribution drift exists, OR
    2. F1 decreases by more than 10%.
    """

    baseline_f1 = baseline_metrics["f1"]
    current_f1 = current_metrics["f1"]

    if baseline_f1 > 0:

        f1_drop = (
            baseline_f1 - current_f1
        ) / baseline_f1

    else:

        f1_drop = 0.0

    if (
        drift_score >= DRIFT_THRESHOLD
        or f1_drop >= 0.10
    ):

        return True, f1_drop

    return False, f1_drop


# ============================================================
# MAIN
# ============================================================


def main():

    print()
    print("=" * 70)
    print("STEP 7: CONCEPT DRIFT SIMULATION")
    print("=" * 70)
    print()

    warnings.filterwarnings(
        "ignore",
        category=UserWarning,
    )

    rng = np.random.default_rng(
        RANDOM_STATE
    )

    # --------------------------------------------------------
    # LOAD
    # --------------------------------------------------------

    model = load_model()

    df = load_dataset()

    print()

    print(
        f"Baseline fraud rate: "
        f"{df['is_fraud'].mean() * 100:.2f}%"
    )

    print(
        f"Transactions per month: "
        f"{MONTH_SIZE}"
    )

    print()

    # --------------------------------------------------------
    # CREATE MONTHS
    # --------------------------------------------------------

    print("Creating simulated fraud environments...")

    month_1 = create_month_1(
        df,
        rng,
    )

    month_2 = create_month_2(
        df,
        rng,
    )

    month_3 = create_month_3(
        df,
        rng,
    )

    month_4 = create_month_4(
        df,
        rng,
    )

    months = {
        "Month 1 - Baseline": month_1,
        "Month 2 - International Fraud": month_2,
        "Month 3 - Low-and-Slow Fraud": month_3,
        "Month 4 - Account Takeover": month_4,
    }

    # --------------------------------------------------------
    # BASELINE
    # --------------------------------------------------------

    print()
    print("Evaluating model performance...")
    print()

    baseline_metrics = evaluate_month(
        model,
        month_1,
    )

    results = []

    # --------------------------------------------------------
    # EVALUATE EACH MONTH
    # --------------------------------------------------------

    for month_name, month_data in months.items():

        metrics = evaluate_month(
            model,
            month_data,
        )

        drift_score = calculate_distribution_drift(
            month_1,
            month_data,
        )

        drift_status = interpret_drift(
            drift_score,
        )

        retraining_needed, f1_drop = should_retrain(
            baseline_metrics,
            metrics,
            drift_score,
        )

        results.append(
            {
                "month": month_name,
                "fraud_rate": metrics["fraud_rate"],
                "precision": metrics["precision"],
                "recall": metrics["recall"],
                "f1": metrics["f1"],
                "roc_auc": metrics["roc_auc"],
                "fpr": metrics["fpr"],
                "drift_score": drift_score,
                "drift_status": drift_status,
                "f1_drop_from_baseline": f1_drop,
                "retraining_recommended": retraining_needed,
            }
        )

    results_df = pd.DataFrame(
        results
    )

    # --------------------------------------------------------
    # DISPLAY RESULTS
    # --------------------------------------------------------

    print("=" * 70)
    print("CONCEPT DRIFT RESULTS")
    print("=" * 70)
    print()

    for result in results:

        print(result["month"])

        print(
            f"  Fraud Rate : "
            f"{result['fraud_rate'] * 100:.2f}%"
        )

        print(
            f"  Precision  : "
            f"{result['precision']:.4f}"
        )

        print(
            f"  Recall     : "
            f"{result['recall']:.4f}"
        )

        print(
            f"  F1 Score   : "
            f"{result['f1']:.4f}"
        )

        print(
            f"  ROC-AUC    : "
            f"{result['roc_auc']:.4f}"
        )

        print(
            f"  FPR        : "
            f"{result['fpr']:.4f}"
        )

        print(
            f"  Drift Score: "
            f"{result['drift_score']:.4f}"
        )

        print(
            f"  Drift      : "
            f"{result['drift_status']}"
        )

        print(
            f"  F1 Drop    : "
            f"{result['f1_drop_from_baseline'] * 100:.2f}%"
        )

        print(
            f"  Retraining : "
            f"{'YES' if result['retraining_recommended'] else 'NO'}"
        )

        print()

    # --------------------------------------------------------
    # SAVE RESULTS
    # --------------------------------------------------------

    os.makedirs(
        OUTPUT_DIR,
        exist_ok=True,
    )

    csv_path = os.path.join(
        OUTPUT_DIR,
        "concept_drift_results.csv",
    )

    json_path = os.path.join(
        OUTPUT_DIR,
        "concept_drift_results.json",
    )

    results_df.to_csv(
        csv_path,
        index=False,
    )

    with open(
        json_path,
        "w",
        encoding="utf-8",
    ) as file:

        json.dump(
            results,
            file,
            indent=4,
        )

    # --------------------------------------------------------
    # FINAL SUMMARY
    # --------------------------------------------------------

    drift_detected_count = sum(
        result["drift_status"] == "DRIFT_DETECTED"
        for result in results
    )

    retraining_count = sum(
        result["retraining_recommended"]
        for result in results
    )

    print("=" * 70)
    print("CONCEPT DRIFT SUMMARY")
    print("=" * 70)
    print()

    print(
        f"Months simulated       : {len(results)}"
    )

    print(
        f"Months with drift      : "
        f"{drift_detected_count}"
    )

    print(
        f"Retraining recommended : "
        f"{retraining_count} month(s)"
    )

    if retraining_count > 0:

        print()
        print(
            "MODEL MONITORING STATUS: "
            "RETRAINING RECOMMENDED"
        )

        print(
            "Reason: Fraud behavior has changed "
            "significantly or model performance "
            "has degraded."
        )

    else:

        print()
        print(
            "MODEL MONITORING STATUS: STABLE"
        )

        print(
            "No significant concept drift detected."
        )

    print()

    print(
        f"Results saved to: {csv_path}"
    )

    print(
        f"JSON results saved to: {json_path}"
    )

    print()

    print("=" * 70)
    print("STEP 7 CONCEPT DRIFT TEST COMPLETED")
    print("=" * 70)


# ============================================================
# ENTRY POINT
# ============================================================


if __name__ == "__main__":
    main()