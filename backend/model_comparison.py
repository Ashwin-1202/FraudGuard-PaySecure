import os
import time
import json

import pandas as pd

from sklearn.model_selection import train_test_split

from sklearn.preprocessing import StandardScaler

from sklearn.pipeline import Pipeline

from sklearn.linear_model import LogisticRegression

from sklearn.ensemble import RandomForestClassifier

from sklearn.metrics import (
    precision_score,
    recall_score,
    f1_score,
    roc_auc_score
)

from xgboost import XGBClassifier

from lightgbm import LGBMClassifier


# ==================================================
# CONFIGURATION
# ==================================================

DATA_PATH = "data/fraud_transactions.csv"

EXPERIMENT_DIR = "experiments"

RESULT_PATH = os.path.join(
    EXPERIMENT_DIR,
    "model_comparison_results.csv"
)

JSON_RESULT_PATH = os.path.join(
    EXPERIMENT_DIR,
    "model_comparison_results.json"
)


os.makedirs(
    EXPERIMENT_DIR,
    exist_ok=True
)


# ==================================================
# LOAD DATA
# ==================================================

print()
print("=" * 60)
print("FRAUD DETECTION MODEL COMPARISON")
print("=" * 60)


print("\nLoading dataset...")

df = pd.read_csv(
    DATA_PATH
)


print("Dataset loaded successfully!")

print("Dataset shape:", df.shape)


# ==================================================
# DATASET ANALYSIS
# ==================================================

print()
print("=" * 60)
print("DATASET ANALYSIS")
print("=" * 60)


print("\nColumns:")

print(
    df.columns.tolist()
)


print("\nMissing values:")

print(
    df.isnull().sum()
)


print("\nFraud distribution:")

fraud_distribution = (
    df["is_fraud"]
    .value_counts()
)

print(
    fraud_distribution
)


fraud_percentage = (
    df["is_fraud"].mean()
    * 100
)

print(
    f"\nFraud percentage: {fraud_percentage:.2f}%"
)


print(
    f"Legitimate percentage: "
    f"{100 - fraud_percentage:.2f}%"
)


# ==================================================
# PREPARE FEATURES
# ==================================================

print()
print("=" * 60)
print("FEATURE PREPARATION")
print("=" * 60)


DROP_COLUMNS = [

    "transaction_id",

    "user_id",

    "is_fraud"

]


X = df.drop(
    columns=DROP_COLUMNS
)


y = df[
    "is_fraud"
]


# ==================================================
# CREATE ENGINEERED FEATURES
# ==================================================

print(
    "\nCreating behavioral features..."
)


X = X.copy()


X["amount_velocity"] = (

    X["amount_ratio"]

    *

    X["transactions_last_10min"]

)


X["amount_merchant_risk"] = (

    X["amount_ratio"]

    *

    X["merchant_risk"]

)


X["velocity_merchant_risk"] = (

    X["transactions_last_10min"]

    *

    X["merchant_risk"]

)


X["combined_risk_signal"] = (

    X["amount_ratio"]

    *

    X["transactions_last_10min"]

    *

    X["merchant_risk"]

)


X["amount_failed_attempts"] = (

    X["amount_ratio"]

    *

    X["failed_attempts_10min"]

)


X["velocity_failed_attempts"] = (

    X["transactions_last_10min"]

    *

    X["failed_attempts_10min"]

)


X["amount_distance"] = (

    X["amount_ratio"]

    *

    X["distance_from_home"]

)


X["merchant_distance"] = (

    X["merchant_risk"]

    *

    X["distance_from_home"]

)


print(
    "Behavioral features created successfully!"
)


print(
    "\nTotal ML features:",
    X.shape[1]
)


# ==================================================
# TRAIN TEST SPLIT
# ==================================================

print()
print("=" * 60)
print("TRAIN TEST SPLIT")
print("=" * 60)


X_train, X_test, y_train, y_test = train_test_split(

    X,

    y,

    test_size=0.20,

    random_state=42,

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


# ==================================================
# CLASS IMBALANCE CALCULATION
# ==================================================

fraud_count = (
    y_train == 1
).sum()


legitimate_count = (
    y_train == 0
).sum()


scale_pos_weight = (

    legitimate_count

    /

    fraud_count

)


print(
    f"\nCalculated scale_pos_weight: "
    f"{scale_pos_weight:.2f}"
)


# ==================================================
# DEFINE MODELS
# ==================================================

print()
print("=" * 60)
print("INITIALIZING MODELS")
print("=" * 60)


models = {


    "Logistic Regression":

        Pipeline([

            (

                "scaler",

                StandardScaler()

            ),

            (

                "model",

                LogisticRegression(

                    max_iter=1000,

                    class_weight="balanced",

                    random_state=42

                )

            )

        ]),


    "Random Forest":

        RandomForestClassifier(

            n_estimators=300,

            max_depth=12,

            min_samples_split=5,

            class_weight="balanced",

            random_state=42,

            n_jobs=-1

        ),


    "XGBoost":

        XGBClassifier(

            n_estimators=400,

            max_depth=6,

            learning_rate=0.05,

            subsample=0.8,

            colsample_bytree=0.8,

            objective="binary:logistic",

            eval_metric="logloss",

            scale_pos_weight=scale_pos_weight,

            random_state=42,

            n_jobs=-1

        ),


    "LightGBM":

        LGBMClassifier(

            n_estimators=400,

            learning_rate=0.05,

            num_leaves=31,

            max_depth=-1,

            subsample=0.8,

            colsample_bytree=0.8,

            class_weight="balanced",

            random_state=42,

            n_jobs=-1,

            verbosity=-1

        )

}


# ==================================================
# TRAIN AND EVALUATE
# ==================================================

results = []


print()
print("=" * 60)
print("MODEL TRAINING AND EVALUATION")
print("=" * 60)


for model_name, model in models.items():


    print()

    print(
        "-" * 60
    )


    print(
        f"Training: {model_name}"
    )


    print(
        "-" * 60
    )


    # ----------------------------------------------
    # TRAINING TIME
    # ----------------------------------------------

    training_start = time.time()


    model.fit(

        X_train,

        y_train

    )


    training_time = (

        time.time()

        -

        training_start

    )


    # ----------------------------------------------
    # INFERENCE TIME
    # ----------------------------------------------

    inference_start = time.time()


    probabilities = (

        model
        .predict_proba(
            X_test
        )[:, 1]

    )


    inference_time = (

        time.time()

        -

        inference_start

    )


    # ----------------------------------------------
    # PREDICTION
    # ----------------------------------------------

    predictions = (

        probabilities >= 0.5

    ).astype(int)


    # ----------------------------------------------
    # METRICS
    # ----------------------------------------------

    precision = precision_score(

        y_test,

        predictions,

        zero_division=0

    )


    recall = recall_score(

        y_test,

        predictions,

        zero_division=0

    )


    f1 = f1_score(

        y_test,

        predictions,

        zero_division=0

    )


    roc_auc = roc_auc_score(

        y_test,

        probabilities

    )


    # ----------------------------------------------
    # PRINT RESULTS
    # ----------------------------------------------

    print()


    print(
        f"Precision: {precision:.4f}"
    )


    print(
        f"Recall: {recall:.4f}"
    )


    print(
        f"F1 Score: {f1:.4f}"
    )


    print(
        f"ROC-AUC: {roc_auc:.4f}"
    )


    print(
        f"Training Time: "
        f"{training_time:.4f} seconds"
    )


    print(
        f"Inference Time: "
        f"{inference_time:.4f} seconds"
    )


    # ----------------------------------------------
    # STORE RESULTS
    # ----------------------------------------------

    results.append({

        "model": model_name,

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

            6

        )

    })


# ==================================================
# RESULTS DATAFRAME
# ==================================================

results_df = pd.DataFrame(

    results

)


results_df = results_df.sort_values(

    by=[

        "f1_score",

        "roc_auc"

    ],

    ascending=False

)


# ==================================================
# PRINT FINAL COMPARISON
# ==================================================

print()

print("=" * 80)

print("FINAL MODEL COMPARISON")

print("=" * 80)


print()


print(

    results_df.to_string(

        index=False

    )

)


# ==================================================
# SELECT BEST MODEL
# ==================================================

best_model = (

    results_df.iloc[0]

)


print()

print("=" * 60)

print("MODEL SELECTION")

print("=" * 60)


print(

    f"\nSelected Model: "

    f"{best_model['model']}"

)


print(

    f"F1 Score: "

    f"{best_model['f1_score']}"

)


print(

    f"ROC-AUC: "

    f"{best_model['roc_auc']}"

)


print(

    f"Inference Time: "

    f"{best_model['inference_time_seconds']} seconds"

)


# ==================================================
# SAVE CSV
# ==================================================

results_df.to_csv(

    RESULT_PATH,

    index=False

)


# ==================================================
# SAVE JSON
# ==================================================

results_json = {


    "experiment": "fraud_model_comparison",


    "dataset": {

        "total_transactions": int(

            len(df)

        ),

        "fraud_percentage": round(

            float(fraud_percentage),

            2

        ),

        "feature_count": int(

            X.shape[1]

        )

    },


    "selected_model": (

        best_model["model"]

    ),


    "selection_reason": (

        "Selected based on the best "

        "F1-score and ROC-AUC performance "

        "while considering inference time."

    ),


    "results": results


}


with open(

    JSON_RESULT_PATH,

    "w"

) as file:


    json.dump(

        results_json,

        file,

        indent=4

    )


# ==================================================
# COMPLETION
# ==================================================

print()

print("=" * 60)

print("EXPERIMENT COMPLETED SUCCESSFULLY")

print("=" * 60)


print(

    "\nCSV Results saved to:",

    RESULT_PATH

)


print(

    "JSON Results saved to:",

    JSON_RESULT_PATH

)


print()

print(

    "You can now use these results "

    "for your project presentation and judges."

)