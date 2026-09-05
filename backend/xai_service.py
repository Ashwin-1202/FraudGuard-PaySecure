"""
Step 6: Explainable AI Service

Provides investigator-friendly explanations using SHAP.

The service:
1. Loads the trained LightGBM fraud model.
2. Calculates SHAP values.
3. Maps engineered features back to meaningful concepts.
4. Produces human-readable reasons.
5. Produces a concise investigator summary.
"""

import os
import joblib
import numpy as np
import pandas as pd
import shap


# ============================================================
# CONFIGURATION
# ============================================================

MODEL_PATH = "models/fraud_model.joblib"


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
# FEATURE DISPLAY NAMES
# ============================================================

FEATURE_DISPLAY_NAMES = {

    "amount":
        "Transaction amount",

    "avg_user_amount":
        "User's average transaction amount",

    "amount_ratio":
        "Amount compared with user's normal spending",

    "transactions_last_10min":
        "Transaction velocity",

    "new_device":
        "New device",

    "new_location":
        "New location",

    "international":
        "International transaction",

    "merchant_risk":
        "Merchant risk",

    "account_age_days":
        "Account age",

    "device_age_days":
        "Device age",

    "distance_from_home":
        "Distance from usual location",

    "failed_attempts_10min":
        "Recent failed attempts",

    "hour":
        "Transaction hour",

    "day_of_week":
        "Day of week",

    "is_weekend":
        "Weekend activity",

    "unusual_hour":
        "Unusual transaction hour",

    "amount_velocity":
        "Amount + transaction velocity",

    "amount_merchant_risk":
        "Amount + merchant risk",

    "velocity_merchant_risk":
        "Transaction velocity + merchant risk",

    "combined_risk_signal":
        "Combined behavioral risk",

    "amount_failed_attempts":
        "Amount + failed attempts",

    "velocity_failed_attempts":
        "Transaction velocity + failed attempts",

    "amount_distance":
        "Amount + location distance",

    "merchant_distance":
        "Merchant risk + location distance",
}


# ============================================================
# ENGINEERED FEATURE EXPLANATIONS
# ============================================================

ENGINEERED_EXPLANATIONS = {

    "amount_velocity":
        "The transaction amount is unusually high relative to the recent transaction velocity.",

    "amount_merchant_risk":
        "The transaction combines a high amount with elevated merchant risk.",

    "velocity_merchant_risk":
        "High transaction velocity is combined with elevated merchant risk.",

    "combined_risk_signal":
        "Multiple behavioral risk signals occur together: amount, transaction velocity, and merchant risk.",

    "amount_failed_attempts":
        "A relatively high transaction amount is associated with recent failed attempts.",

    "velocity_failed_attempts":
        "High transaction velocity is associated with recent failed attempts.",

    "amount_distance":
        "A relatively high transaction amount is combined with unusual geographic distance.",

    "merchant_distance":
        "Elevated merchant risk is combined with unusual geographic distance.",
}


# ============================================================
# BASE FEATURE EXPLANATIONS
# ============================================================

BASE_EXPLANATIONS = {

    "amount":
        "The transaction amount contributes to the fraud prediction.",

    "avg_user_amount":
        "The transaction differs from the user's normal transaction amount.",

    "amount_ratio":
        "The transaction amount is significantly different from the user's usual spending pattern.",

    "transactions_last_10min":
        "An unusually high number of transactions occurred recently.",

    "new_device":
        "The transaction originated from a device not previously associated with the user.",

    "new_location":
        "The transaction originated from a location not previously associated with the user.",

    "international":
        "The transaction is international, increasing contextual risk.",

    "merchant_risk":
        "The merchant has an elevated risk score.",

    "account_age_days":
        "The account age contributes to the model's assessment.",

    "device_age_days":
        "The device age contributes to the model's assessment.",

    "distance_from_home":
        "The transaction occurred unusually far from the user's normal location.",

    "failed_attempts_10min":
        "Multiple recent failed attempts increase the suspiciousness of the transaction.",

    "hour":
        "The transaction time contributes to the fraud prediction.",

    "day_of_week":
        "The transaction day contributes to the fraud prediction.",

    "is_weekend":
        "Weekend activity contributes to the fraud prediction.",

    "unusual_hour":
        "The transaction occurred during an unusual hour for the user.",
}


# ============================================================
# LOAD MODEL
# ============================================================

def load_model():

    if not os.path.exists(MODEL_PATH):
        raise FileNotFoundError(
            f"Fraud model not found: {MODEL_PATH}"
        )

    model = joblib.load(
        MODEL_PATH
    )

    return model


# ============================================================
# CREATE ENGINEERED FEATURES
# ============================================================

def create_engineered_features(
    transaction
):

    transaction = transaction.copy()

    amount_ratio = float(
        transaction["amount_ratio"]
    )

    velocity = float(
        transaction["transactions_last_10min"]
    )

    merchant_risk = float(
        transaction["merchant_risk"]
    )

    failed_attempts = float(
        transaction["failed_attempts_10min"]
    )

    distance = float(
        transaction["distance_from_home"]
    )

    transaction["amount_velocity"] = (
        amount_ratio * velocity
    )

    transaction["amount_merchant_risk"] = (
        amount_ratio * merchant_risk
    )

    transaction["velocity_merchant_risk"] = (
        velocity * merchant_risk
    )

    transaction["combined_risk_signal"] = (
        amount_ratio
        * velocity
        * merchant_risk
    )

    transaction["amount_failed_attempts"] = (
        amount_ratio * failed_attempts
    )

    transaction["velocity_failed_attempts"] = (
        velocity * failed_attempts
    )

    transaction["amount_distance"] = (
        amount_ratio * distance
    )

    transaction["merchant_distance"] = (
        merchant_risk * distance
    )

    return transaction


# ============================================================
# CREATE MODEL INPUT
# ============================================================

def create_model_dataframe(
    transaction
):

    transaction = create_engineered_features(
        transaction
    )

    values = {}

    for feature in ML_FEATURES:

        values[feature] = [
            float(transaction[feature])
        ]

    return pd.DataFrame(
        values,
        columns=ML_FEATURES
    )


# ============================================================
# SHAP EXPLANATION
# ============================================================

def calculate_shap_values(
    transaction,
    model=None
):

    if model is None:
        model = load_model()

    model_input = create_model_dataframe(
        transaction
    )

    explainer = shap.TreeExplainer(
        model
    )

    shap_values = explainer.shap_values(
        model_input
    )

    # SHAP versions differ slightly.
    # Handle both common formats.

    if isinstance(
        shap_values,
        list
    ):

        values = np.asarray(
            shap_values[-1]
        )[0]

    else:

        values = np.asarray(
            shap_values
        )

        if values.ndim == 3:
            values = values[0, :, -1]

        elif values.ndim == 2:
            values = values[0]

        elif values.ndim == 1:
            values = values

        else:
            raise ValueError(
                f"Unexpected SHAP shape: "
                f"{values.shape}"
            )

    result = []

    for feature, value in zip(
        ML_FEATURES,
        values
    ):

        result.append(
            {
                "feature": feature,
                "display_name":
                    FEATURE_DISPLAY_NAMES.get(
                        feature,
                        feature
                    ),
                "shap_value": float(value),
                "impact":
                    "increases risk"
                    if value > 0
                    else "decreases risk",
                "abs_impact":
                    float(abs(value)),
            }
        )

    result.sort(
        key=lambda x: x["abs_impact"],
        reverse=True
    )

    return result


# ============================================================
# HUMAN-READABLE EXPLANATION
# ============================================================

def explain_feature(
    feature,
    shap_value,
    transaction
):

    if feature in ENGINEERED_EXPLANATIONS:

        explanation = ENGINEERED_EXPLANATIONS[
            feature
        ]

    else:

        explanation = BASE_EXPLANATIONS.get(
            feature,
            f"{feature} contributes to the fraud prediction."
        )

    # --------------------------------------------------------
    # Add actual values for important features
    # --------------------------------------------------------

    if feature == "amount":

        explanation = (
            f"Transaction amount is "
            f"{transaction['amount']:.2f}."
        )

    elif feature == "amount_ratio":

        explanation = (
            f"Transaction amount is "
            f"{transaction['amount_ratio']:.2f}x "
            f"the user's average transaction amount."
        )

    elif feature == "transactions_last_10min":

        explanation = (
            f"{int(transaction['transactions_last_10min'])} "
            f"transactions occurred in the last 10 minutes."
        )

    elif feature == "merchant_risk":

        explanation = (
            f"Merchant risk score is "
            f"{transaction['merchant_risk']:.1f}/10."
        )

    elif feature == "distance_from_home":

        explanation = (
            f"Transaction occurred "
            f"{transaction['distance_from_home']:.1f} km "
            f"from the user's usual location."
        )

    elif feature == "failed_attempts_10min":

        explanation = (
            f"{int(transaction['failed_attempts_10min'])} "
            f"failed attempts occurred recently."
        )

    elif feature == "new_device":

        explanation = (
            "Transaction originated from a new device."
            if transaction["new_device"] == 1
            else "Transaction originated from a known device."
        )

    elif feature == "new_location":

        explanation = (
            "Transaction originated from a new location."
            if transaction["new_location"] == 1
            else "Transaction originated from a known location."
        )

    elif feature == "international":

        explanation = (
            "Transaction is international."
            if transaction["international"] == 1
            else "Transaction is domestic."
        )

    elif feature == "unusual_hour":

        explanation = (
            "Transaction occurred during an unusual hour."
            if transaction["unusual_hour"] == 1
            else "Transaction occurred during a normal hour."
        )

    return explanation


# ============================================================
# INVESTIGATOR-FRIENDLY EXPLANATIONS
# ============================================================

def get_top_explanations(
    transaction,
    top_k=5,
    model=None
):

    shap_results = calculate_shap_values(
        transaction,
        model
    )

    explanations = []

    for item in shap_results[:top_k]:

        feature = item["feature"]

        shap_value = item["shap_value"]

        explanation = explain_feature(
            feature,
            shap_value,
            transaction
        )

        explanations.append(
            {
                "feature": feature,

                "display_name":
                    item["display_name"],

                "shap_value":
                    round(shap_value, 4),

                "impact":
                    item["impact"],

                "explanation":
                    explanation,
            }
        )

    return explanations


# ============================================================
# GENERATE INVESTIGATOR SUMMARY
# ============================================================

def generate_investigator_summary(
    transaction,
    explanations,
    fraud_probability=None
):

    positive_reasons = [
        item
        for item in explanations
        if item["shap_value"] > 0
    ]

    if not positive_reasons:

        summary = (
            "The model did not identify strong "
            "fraud-driving behavioral signals."
        )

        return summary

    reasons = [
        item["explanation"]
        for item in positive_reasons[:3]
    ]

    if fraud_probability is not None:

        probability_text = (
            f"The model estimates a "
            f"{fraud_probability * 100:.1f}% "
            f"fraud probability. "
        )

    else:

        probability_text = ""

    clean_reasons = []

    for reason in reasons:
        reason = reason.strip().rstrip(".")
        clean_reasons.append(
            reason
        )

    summary = (
        probability_text
        + "The main risk factors are: "
        + "; ".join(clean_reasons)
        + "."
    )

    return summary


# ============================================================
# COMPLETE XAI RESPONSE
# ============================================================

def explain_transaction(
    transaction,
    fraud_probability=None,
    top_k=5,
    model=None
):

    explanations = get_top_explanations(
        transaction,
        top_k=top_k,
        model=model
    )

    summary = generate_investigator_summary(
        transaction,
        explanations,
        fraud_probability
    )

    return {
        "top_features": explanations,
        "summary": summary,
    }


# ============================================================
# TEST
# ============================================================

if __name__ == "__main__":

    print("=" * 70)
    print("STEP 6: XAI SERVICE TEST")
    print("=" * 70)

    transaction = {
        "amount": 7500,
        "avg_user_amount": 2000,
        "amount_ratio": 3.75,
        "transactions_last_10min": 12,
        "new_device": 0,
        "new_location": 0,
        "international": 0,
        "merchant_risk": 8,
        "account_age_days": 800,
        "device_age_days": 300,
        "distance_from_home": 80,
        "failed_attempts_10min": 0,
        "hour": 17,
        "day_of_week": 2,
        "is_weekend": 0,
        "unusual_hour": 0,
    }

    model = load_model()

    model_input = create_model_dataframe(
        transaction
    )

    probability = model.predict_proba(
        model_input
    )[0, 1]

    result = explain_transaction(
        transaction,
        fraud_probability=probability,
        top_k=5,
        model=model
    )

    print()
    print("Fraud Probability:")
    print(
        f"{probability * 100:.2f}%"
    )

    print()
    print("=" * 70)
    print("TOP SHAP FEATURES")
    print("=" * 70)

    for i, item in enumerate(
        result["top_features"],
        start=1
    ):

        print()
        print(
            f"{i}. {item['display_name']}"
        )

        print(
            f"   SHAP: "
            f"{item['shap_value']:.4f}"
        )

        print(
            f"   Impact: "
            f"{item['impact']}"
        )

        print(
            f"   Explanation: "
            f"{item['explanation']}"
        )

    print()
    print("=" * 70)
    print("INVESTIGATOR SUMMARY")
    print("=" * 70)

    print(
        result["summary"]
    )

    print()
    print("=" * 70)
    print("STEP 6 XAI TEST COMPLETED")
    print("=" * 70)