"""
Step 6.1: Production Risk Engine

Combines:

1. LightGBM fraud classification
2. Isolation Forest anomaly detection
3. Business rule engine
4. SHAP explainability
5. Investigator-friendly explanations

Hybrid Risk Score:

    45% LightGBM Fraud Score
    30% Anomaly Score
    25% Rule Score

Optimized alert threshold:

    52

This threshold was selected during Step 5 using
validation data and evaluated on a separate holdout set.
"""


import joblib
import numpy as np
import pandas as pd
import shap


# ============================================================
# CONFIGURATION
# ============================================================

FRAUD_MODEL_PATH = "models/fraud_model.joblib"

ANOMALY_MODEL_PATH = "models/anomaly_model.joblib"


# ============================================================
# HYBRID MODEL WEIGHTS
# ============================================================

ML_WEIGHT = 0.45

ANOMALY_WEIGHT = 0.30

RULE_WEIGHT = 0.25


# ============================================================
# OPTIMIZED ALERT THRESHOLD
# ============================================================

# Step 5 optimized threshold

RISK_THRESHOLD = 52


# ============================================================
# LOAD MODELS
# ============================================================

fraud_model = joblib.load(
    FRAUD_MODEL_PATH
)


anomaly_model = joblib.load(
    ANOMALY_MODEL_PATH
)


# ============================================================
# SHAP EXPLAINER
# ============================================================

shap_explainer = shap.TreeExplainer(
    fraud_model
)


print("Fraud model loaded!")

print("Anomaly model loaded!")

print(
    f"Optimized risk threshold: {RISK_THRESHOLD}"
)


# ============================================================
# BASE FEATURES
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

    "unusual_hour"

]


# ============================================================
# ENGINEERED FEATURES
# ============================================================

ENGINEERED_FEATURES = [

    "amount_velocity",

    "amount_merchant_risk",

    "velocity_merchant_risk",

    "combined_risk_signal",

    "amount_failed_attempts",

    "velocity_failed_attempts",

    "amount_distance",

    "merchant_distance"

]


# ============================================================
# COMPLETE ML FEATURE LIST
# ============================================================

ML_FEATURES = (
    BASE_FEATURES
    +
    ENGINEERED_FEATURES
)


# ============================================================
# HUMAN-READABLE FEATURE NAMES
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
        "Merchant risk + location distance"

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
        "Elevated merchant risk is combined with unusual geographic distance."

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
        "The transaction amount differs significantly from the user's usual spending pattern.",

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
        "The transaction occurred during an unusual hour for the user."

}


# ============================================================
# CREATE ML FEATURES
# ============================================================

def create_ml_features(transaction):

    data = transaction.copy()


    # --------------------------------------------------------
    # Amount + velocity
    # --------------------------------------------------------

    data["amount_velocity"] = (

        data["amount_ratio"]

        *

        data["transactions_last_10min"]

    )


    # --------------------------------------------------------
    # Amount + merchant risk
    # --------------------------------------------------------

    data["amount_merchant_risk"] = (

        data["amount_ratio"]

        *

        data["merchant_risk"]

    )


    # --------------------------------------------------------
    # Velocity + merchant risk
    # --------------------------------------------------------

    data["velocity_merchant_risk"] = (

        data["transactions_last_10min"]

        *

        data["merchant_risk"]

    )


    # --------------------------------------------------------
    # Combined behavioral signal
    # --------------------------------------------------------

    data["combined_risk_signal"] = (

        data["amount_ratio"]

        *

        data["transactions_last_10min"]

        *

        data["merchant_risk"]

    )


    # --------------------------------------------------------
    # Amount + failed attempts
    # --------------------------------------------------------

    data["amount_failed_attempts"] = (

        data["amount_ratio"]

        *

        data["failed_attempts_10min"]

    )


    # --------------------------------------------------------
    # Velocity + failed attempts
    # --------------------------------------------------------

    data["velocity_failed_attempts"] = (

        data["transactions_last_10min"]

        *

        data["failed_attempts_10min"]

    )


    # --------------------------------------------------------
    # Amount + distance
    # --------------------------------------------------------

    data["amount_distance"] = (

        data["amount_ratio"]

        *

        data["distance_from_home"]

    )


    # --------------------------------------------------------
    # Merchant + distance
    # --------------------------------------------------------

    data["merchant_distance"] = (

        data["merchant_risk"]

        *

        data["distance_from_home"]

    )


    return data


# ============================================================
# CREATE ML DATAFRAME
# ============================================================

def create_ml_dataframe(transaction):

    data = create_ml_features(
        transaction
    )


    X = pd.DataFrame(

        [

            [

                data[feature]

                for feature in ML_FEATURES

            ]

        ],

        columns=ML_FEATURES

    )


    return X


# ============================================================
# CREATE ANOMALY DATAFRAME
# ============================================================

def create_anomaly_dataframe(transaction):

    X = pd.DataFrame(

        [

            [

                transaction[feature]

                for feature in BASE_FEATURES

            ]

        ],

        columns=BASE_FEATURES

    )


    return X


# ============================================================
# SHAP VALUE EXTRACTION
# ============================================================

def extract_shap_values(
    shap_values
):

    """
    Handles different SHAP output formats.

    Older SHAP versions may return:

        [array_class_0, array_class_1]

    Newer versions may return:

        array

    or:

        3D array
    """


    if isinstance(
        shap_values,
        list
    ):

        values = np.asarray(
            shap_values[-1]
        )


        if values.ndim == 2:

            return values[0]


        return values


    values = np.asarray(
        shap_values
    )


    if values.ndim == 3:

        return values[0, :, -1]


    if values.ndim == 2:

        return values[0]


    if values.ndim == 1:

        return values


    raise ValueError(

        "Unexpected SHAP output shape: "

        f"{values.shape}"

    )


# ============================================================
# SHAP EXPLANATION
# ============================================================

def calculate_shap_explanation(
    transaction
):

    X = create_ml_dataframe(
        transaction
    )


    shap_values = shap_explainer.shap_values(
        X
    )


    values = extract_shap_values(
        shap_values
    )


    contributions = []


    for feature, value in zip(
        ML_FEATURES,
        values
    ):

        value = float(
            value
        )


        contributions.append(

            {

                "feature":
                    feature,

                "display_name":
                    FEATURE_DISPLAY_NAMES.get(
                        feature,
                        feature
                    ),

                "shap_value":
                    round(
                        value,
                        4
                    ),

                "impact":
                    (
                        "increases risk"
                        if value > 0
                        else
                        "decreases risk"
                    ),

                "abs_impact":
                    round(
                        abs(value),
                        4
                    )

            }

        )


    # --------------------------------------------------------
    # Sort by strongest SHAP impact
    # --------------------------------------------------------

    contributions.sort(

        key=lambda item:
            item["abs_impact"],

        reverse=True

    )


    # --------------------------------------------------------
    # Top 5
    # --------------------------------------------------------

    top_contributors = (

        contributions[:5]

    )


    return top_contributors


# ============================================================
# HUMAN-READABLE SHAP EXPLANATION
# ============================================================

def explain_shap_feature(
    feature,
    transaction
):

    # --------------------------------------------------------
    # Engineered features
    # --------------------------------------------------------

    if feature in ENGINEERED_EXPLANATIONS:

        return ENGINEERED_EXPLANATIONS[
            feature
        ]


    # --------------------------------------------------------
    # Amount
    # --------------------------------------------------------

    if feature == "amount":

        return (

            f"Transaction amount is "

            f"{float(transaction['amount']):.2f}."

        )


    # --------------------------------------------------------
    # Amount ratio
    # --------------------------------------------------------

    if feature == "amount_ratio":

        return (

            f"Transaction amount is "

            f"{float(transaction['amount_ratio']):.2f}x "

            f"the user's average transaction amount."

        )


    # --------------------------------------------------------
    # Velocity
    # --------------------------------------------------------

    if feature == "transactions_last_10min":

        return (

            f"{int(transaction['transactions_last_10min'])} "

            f"transactions occurred in the last 10 minutes."

        )


    # --------------------------------------------------------
    # Merchant
    # --------------------------------------------------------

    if feature == "merchant_risk":

        return (

            f"Merchant risk score is "

            f"{float(transaction['merchant_risk']):.1f}/10."

        )


    # --------------------------------------------------------
    # Distance
    # --------------------------------------------------------

    if feature == "distance_from_home":

        return (

            f"Transaction occurred "

            f"{float(transaction['distance_from_home']):.1f} km "

            f"from the user's usual location."

        )


    # --------------------------------------------------------
    # Failed attempts
    # --------------------------------------------------------

    if feature == "failed_attempts_10min":

        return (

            f"{int(transaction['failed_attempts_10min'])} "

            f"failed attempts occurred recently."

        )


    # --------------------------------------------------------
    # New device
    # --------------------------------------------------------

    if feature == "new_device":

        if transaction["new_device"] == 1:

            return (
                "Transaction originated from a new device."
            )

        return (
            "Transaction originated from a known device."
        )


    # --------------------------------------------------------
    # New location
    # --------------------------------------------------------

    if feature == "new_location":

        if transaction["new_location"] == 1:

            return (
                "Transaction originated from a new location."
            )

        return (
            "Transaction originated from a known location."
        )


    # --------------------------------------------------------
    # International
    # --------------------------------------------------------

    if feature == "international":

        if transaction["international"] == 1:

            return (
                "Transaction is international."
            )

        return (
            "Transaction is domestic."
        )


    # --------------------------------------------------------
    # Unusual hour
    # --------------------------------------------------------

    if feature == "unusual_hour":

        if transaction["unusual_hour"] == 1:

            return (
                "Transaction occurred during an unusual hour."
            )

        return (
            "Transaction occurred during a normal hour."
        )


    # --------------------------------------------------------
    # Default
    # --------------------------------------------------------

    return BASE_EXPLANATIONS.get(

        feature,

        f"{feature} contributes to the fraud prediction."

    )


# ============================================================
# INVESTIGATOR-FRIENDLY SHAP EXPLANATIONS
# ============================================================

def create_investigator_explanations(
    transaction,
    shap_explanations
):

    explanations = []


    for item in shap_explanations:

        feature = item["feature"]


        explanation = explain_shap_feature(

            feature,

            transaction

        )


        explanations.append(

            {

                "feature":
                    feature,

                "display_name":
                    item["display_name"],

                "shap_value":
                    item["shap_value"],

                "impact":
                    item["impact"],

                "explanation":
                    explanation

            }

        )


    return explanations


# ============================================================
# INVESTIGATOR SUMMARY
# ============================================================

def generate_investigator_summary(

    transaction,

    fraud_probability,

    explanations

):

    positive_reasons = [

        item

        for item in explanations

        if item["shap_value"] > 0

    ]


    # --------------------------------------------------------
    # No strong positive signals
    # --------------------------------------------------------

    if not positive_reasons:

        return (

            f"The model estimates a "

            f"{fraud_probability * 100:.1f}% "

            f"fraud probability, but no strong "

            f"fraud-driving SHAP signals were identified."

        )


    # --------------------------------------------------------
    # Top three reasons
    # --------------------------------------------------------

    top_reasons = [

        item["explanation"]

        for item in positive_reasons[:3]

    ]


    probability_text = (

        f"The model estimates a "

        f"{fraud_probability * 100:.1f}% "

        f"fraud probability."

    )


    reason_text = (

        "The main risk factors are: "

        + "; ".join(
            top_reasons
        )

        + "."

    )


    return (

        probability_text

        + " "

        + reason_text

    )


# ============================================================
# BUSINESS RULE ENGINE
# ============================================================

def calculate_rule_score(
    transaction
):

    score = 0

    reasons = []


    # ========================================================
    # NEW DEVICE
    # ========================================================

    if transaction["new_device"] == 1:

        score += 3

        reasons.append(
            "Transaction from a new device"
        )


    # ========================================================
    # NEW LOCATION
    # ========================================================

    if transaction["new_location"] == 1:

        score += 3

        reasons.append(
            "Transaction from a new location"
        )


    # ========================================================
    # INTERNATIONAL
    # ========================================================

    if transaction["international"] == 1:

        score += 3

        reasons.append(
            "International transaction"
        )


    # ========================================================
    # VELOCITY
    # ========================================================

    if transaction[
        "transactions_last_10min"
    ] >= 5:

        score += 3

        reasons.append(
            "High transaction velocity"
        )


    if transaction[
        "transactions_last_10min"
    ] >= 10:

        score += 5

        reasons.append(
            "Extremely high transaction velocity"
        )


    if transaction[
        "transactions_last_10min"
    ] >= 15:

        score += 4

        reasons.append(
            "Very high transaction velocity"
        )


    # ========================================================
    # FAILED ATTEMPTS
    # ========================================================

    if transaction[
        "failed_attempts_10min"
    ] >= 3:

        score += 3

        reasons.append(
            "Multiple failed attempts"
        )


    # ========================================================
    # AMOUNT
    # ========================================================

    if transaction[
        "amount_ratio"
    ] > 2:

        score += 3

        reasons.append(

            "Transaction amount is more than twice "
            "the user's normal amount"

        )


    if transaction[
        "amount_ratio"
    ] > 5:

        score += 4

        reasons.append(

            "Transaction amount significantly exceeds "
            "user's normal amount"

        )


    if transaction[
        "amount_ratio"
    ] > 10:

        score += 5

        reasons.append(

            "Transaction amount is extremely high "
            "compared with user's history"

        )


    # ========================================================
    # MERCHANT
    # ========================================================

    if transaction[
        "merchant_risk"
    ] >= 7:

        score += 3

        reasons.append(
            "High-risk merchant"
        )


    if transaction[
        "merchant_risk"
    ] >= 9:

        score += 2

        reasons.append(
            "Extremely high-risk merchant"
        )


    # ========================================================
    # DISTANCE
    # ========================================================

    if transaction[
        "distance_from_home"
    ] >= 50:

        score += 2

        reasons.append(

            "Transaction occurred far from "
            "user's normal location"

        )


    if transaction[
        "distance_from_home"
    ] >= 200:

        score += 3

        reasons.append(

            "Transaction occurred extremely far "
            "from user's normal location"

        )


    # ========================================================
    # UNUSUAL TIME
    # ========================================================

    if transaction[
        "unusual_hour"
    ] == 1:

        score += 2

        reasons.append(
            "Transaction occurred during unusual hours"
        )


    # ========================================================
    # BEHAVIORAL VARIABLES
    # ========================================================

    amount_ratio = transaction[
        "amount_ratio"
    ]

    velocity = transaction[
        "transactions_last_10min"
    ]

    merchant_risk = transaction[
        "merchant_risk"
    ]


    # ========================================================
    # PATTERN 1
    # Amount + velocity
    # ========================================================

    if (

        amount_ratio > 2

        and

        velocity >= 5

    ):

        score += 5

        reasons.append(

            "Unusually high amount combined "
            "with high transaction velocity"

        )


    # ========================================================
    # PATTERN 2
    # Merchant + velocity
    # ========================================================

    if (

        merchant_risk >= 7

        and

        velocity >= 5

    ):

        score += 3

        reasons.append(

            "High-risk merchant combined "
            "with high transaction velocity"

        )


    # ========================================================
    # PATTERN 3
    # Amount + merchant
    # ========================================================

    if (

        amount_ratio > 2

        and

        merchant_risk >= 7

    ):

        score += 3

        reasons.append(

            "High transaction amount combined "
            "with a high-risk merchant"

        )


    # ========================================================
    # PATTERN 4
    # Three suspicious signals
    # ========================================================

    if (

        amount_ratio > 2

        and

        velocity >= 5

        and

        merchant_risk >= 7

    ):

        score += 5

        reasons.append(

            "Multiple suspicious signals occurring together"

        )


    # ========================================================
    # LOW-AND-SLOW PATTERN
    # ========================================================

    if (

        amount_ratio >= 2

        and

        amount_ratio <= 5

        and

        velocity >= 5

        and

        merchant_risk >= 7

        and

        transaction["new_device"] == 0

        and

        transaction["new_location"] == 0

    ):

        reasons.append(

            "Potential low-and-slow fraud pattern: "
            "moderately unusual amount with repeated "
            "transactions and a high-risk merchant"

        )


    return score, reasons


# ============================================================
# ANOMALY SCORE
# ============================================================

def calculate_anomaly_score(
    transaction
):

    X = create_anomaly_dataframe(
        transaction
    )


    raw_score = float(

        anomaly_model
        .decision_function(X)[0]

    )


    # --------------------------------------------------------
    # Convert Isolation Forest output to 0-100
    # --------------------------------------------------------

    anomaly_score = (

        50

        -

        (

            raw_score

            *

            250

        )

    )


    anomaly_score = float(

        max(

            0,

            min(

                100,

                anomaly_score

            )

        )

    )


    return anomaly_score


# ============================================================
# RISK LEVEL
# ============================================================

def get_risk_level(
    final_score
):

    if final_score >= 81:

        return "CRITICAL"


    elif final_score >= 61:

        return "HIGH"


    elif final_score >= 31:

        return "MEDIUM"


    return "LOW"


# ============================================================
# ALERT DECISION
# ============================================================

def get_alert_decision(
    final_score
):

    if final_score >= RISK_THRESHOLD:

        return "FRAUD_ALERT"


    return "NORMAL"


# ============================================================
# MAIN RISK ENGINE
# ============================================================

def calculate_risk(
    transaction
):

    # ========================================================
    # LIGHTGBM
    # ========================================================

    X = create_ml_dataframe(
        transaction
    )


    fraud_probability = float(

        fraud_model
        .predict_proba(X)[0][1]

    )


    fraud_score = (

        fraud_probability

        *

        100

    )


    # ========================================================
    # ANOMALY
    # ========================================================

    anomaly_score = calculate_anomaly_score(
        transaction
    )


    # ========================================================
    # RULE ENGINE
    # ========================================================

    rule_score, reasons = calculate_rule_score(
        transaction
    )


    # ========================================================
    # NORMALIZE RULE SCORE
    #
    # IMPORTANT:
    #
    # Step 5 threshold optimization used:
    #
    #     rule_score / 40 * 100
    #
    # Therefore we MUST use the same normalization here.
    # ========================================================

    rule_score_normalized = min(

        rule_score

        /

        40

        *

        100,

        100

    )


    # ========================================================
    # SHAP
    # ========================================================

    shap_explanations_raw = calculate_shap_explanation(
        transaction
    )


    # ========================================================
    # INVESTIGATOR-FRIENDLY SHAP
    # ========================================================

    shap_explanations = create_investigator_explanations(

        transaction,

        shap_explanations_raw

    )


    # ========================================================
    # INVESTIGATOR SUMMARY
    # ========================================================

    investigator_summary = generate_investigator_summary(

        transaction,

        fraud_probability,

        shap_explanations

    )


    # ========================================================
    # HYBRID RISK SCORE
    # ========================================================

    final_score = (

        fraud_score

        *

        ML_WEIGHT

        +

        anomaly_score

        *

        ANOMALY_WEIGHT

        +

        rule_score_normalized

        *

        RULE_WEIGHT

    )


    final_score = round(

        min(

            max(

                final_score,

                0

            ),

            100

        ),

        2

    )


    # ========================================================
    # BEHAVIORAL ESCALATION
    # ========================================================

    if (

        anomaly_score >= 70

        and

        rule_score_normalized >= 40

        and

        final_score < 31

    ):

        final_score = 31


    # ========================================================
    # RISK LEVEL
    # ========================================================

    risk_level = get_risk_level(
        final_score
    )


    # ========================================================
    # ALERT DECISION
    # ========================================================

    alert_decision = get_alert_decision(
        final_score
    )


    # ========================================================
    # RETURN RESULT
    # ========================================================

    return {

        "fraud_probability":
            float(

                round(

                    fraud_probability,

                    4

                )

            ),

        "fraud_score":
            float(

                round(

                    fraud_score,

                    2

                )

            ),

        "anomaly_score":
            float(

                round(

                    anomaly_score,

                    2

                )

            ),

        "rule_score":
            float(

                round(

                    rule_score_normalized,

                    2

                )

            ),

        "final_risk_score":
            float(

                round(

                    final_score,

                    2

                )

            ),

        "risk_level":
            risk_level,

        "alert_decision":
            alert_decision,

        "risk_threshold":
            RISK_THRESHOLD,

        "reasons":
            reasons,

        "shap_explanations":
            shap_explanations,

        "investigator_summary":
            investigator_summary

    }


# ============================================================
# DIRECT TEST
# ============================================================

if __name__ == "__main__":

    test_transaction = {

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

        "unusual_hour": 0

    }


    result = calculate_risk(
        test_transaction
    )


    print()

    print(
        "======================================"
    )

    print(
        "RISK ENGINE TEST"
    )

    print(
        "======================================"
    )


    print()

    print(
        "Fraud Probability:",
        result["fraud_probability"]
    )


    print(
        "Fraud Score:",
        result["fraud_score"]
    )


    print(
        "Anomaly Score:",
        result["anomaly_score"]
    )


    print(
        "Rule Score:",
        result["rule_score"]
    )


    print(
        "Final Risk Score:",
        result["final_risk_score"]
    )


    print(
        "Risk Level:",
        result["risk_level"]
    )


    print(
        "Alert Decision:",
        result["alert_decision"]
    )


    print(
        "Risk Threshold:",
        result["risk_threshold"]
    )


    print()

    print(
        "Business Rule Reasons:"
    )


    for reason in result["reasons"]:

        print(
            "-",
            reason
        )


    print()

    print(
        "SHAP Explanations:"
    )


    for item in result[
        "shap_explanations"
    ]:

        print()

        print(
            item["display_name"]
        )

        print(
            "SHAP:",
            item["shap_value"]
        )

        print(
            "Impact:",
            item["impact"]
        )

        print(
            "Explanation:",
            item["explanation"]
        )


    print()

    print(
        "======================================"
    )

    print(
        "INVESTIGATOR SUMMARY"
    )

    print(
        "======================================"
    )


    print()

    print(
        result[
            "investigator_summary"
        ]
    )


    print()

    print(
        "======================================"
    )

    print(
        "RISK ENGINE TEST COMPLETED"
    )

    print(
        "======================================"
    )