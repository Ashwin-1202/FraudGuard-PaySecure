import numpy as np
import pandas as pd

# ============================================================
# CONFIGURATION
# ============================================================

np.random.seed(42)

# Total number of transactions
N = 50000

# Desired fraud percentage
FRAUD_RATE = 0.15

# Output file
OUTPUT_PATH = "data/fraud_transactions.csv"

# ============================================================
# CALCULATE EXACT CLASS COUNTS
# ============================================================

FRAUD_COUNT = int(N * FRAUD_RATE)
NORMAL_COUNT = N - FRAUD_COUNT

print("\n========================================")
print("Synthetic Fraud Dataset Generator")
print("========================================")

print(f"Total transactions : {N}")
print(f"Desired fraud rate : {FRAUD_RATE * 100:.2f}%")
print(f"Fraud transactions : {FRAUD_COUNT}")
print(f"Normal transactions: {NORMAL_COUNT}")


# ============================================================
# BASIC TRANSACTION INFORMATION
# ============================================================

transaction_id = [
    f"TXN{100000 + i}"
    for i in range(N)
]

user_id = np.random.randint(
    1000,
    11000,
    N
)


# ============================================================
# TRANSACTION AMOUNT
# ============================================================

amount = np.round(
    np.random.lognormal(
        mean=6.0,
        sigma=1.0,
        size=N
    ),
    2
)

amount = np.clip(
    amount,
    50,
    250000
)


# ============================================================
# USER NORMAL TRANSACTION AMOUNT
# ============================================================

avg_user_amount = np.round(
    np.random.lognormal(
        mean=5.5,
        sigma=0.6,
        size=N
    ),
    2
)

avg_user_amount = np.clip(
    avg_user_amount,
    100,
    50000
)


# ============================================================
# AMOUNT RATIO
# ============================================================

amount_ratio = (
    amount /
    np.maximum(avg_user_amount, 1)
)


# ============================================================
# TRANSACTION VELOCITY
# ============================================================

transactions_last_10min = np.random.poisson(
    lam=2,
    size=N
)

transactions_last_10min = np.clip(
    transactions_last_10min,
    0,
    20
)


# ============================================================
# DEVICE / LOCATION / INTERNATIONAL
# ============================================================

new_device = np.random.binomial(
    1,
    0.08,
    N
)

new_location = np.random.binomial(
    1,
    0.07,
    N
)

international = np.random.binomial(
    1,
    0.12,
    N
)


# ============================================================
# MERCHANT RISK
# ============================================================

merchant_risk = np.random.randint(
    0,
    11,
    N
)


# ============================================================
# ACCOUNT INFORMATION
# ============================================================

account_age_days = np.random.randint(
    10,
    3000,
    N
)

device_age_days = np.random.randint(
    1,
    1500,
    N
)


# ============================================================
# DISTANCE FROM HOME
# ============================================================

distance_from_home = np.random.exponential(
    scale=20,
    size=N
)

distance_from_home = np.clip(
    distance_from_home,
    0,
    5000
)


# ============================================================
# FAILED TRANSACTIONS
# ============================================================

failed_attempts_10min = np.random.poisson(
    lam=0.5,
    size=N
)

failed_attempts_10min = np.clip(
    failed_attempts_10min,
    0,
    10
)


# ============================================================
# TIME INFORMATION
# ============================================================

hour = np.random.randint(
    0,
    24,
    N
)

day_of_week = np.random.randint(
    0,
    7,
    N
)

is_weekend = (
    day_of_week >= 5
).astype(int)

unusual_hour = (
    (hour <= 5) |
    (hour >= 23)
).astype(int)


# ============================================================
# CREATE BEHAVIORAL RISK SCORE
# ============================================================

risk = np.zeros(N)


# ------------------------------------------------------------
# Large transaction compared with user's normal behavior
# ------------------------------------------------------------

risk += np.where(
    amount_ratio > 3,
    1.0,
    0
)

risk += np.where(
    amount_ratio > 5,
    2.5,
    0
)

risk += np.where(
    amount_ratio > 10,
    2.0,
    0
)


# ------------------------------------------------------------
# Transaction velocity
# ------------------------------------------------------------

risk += np.where(
    transactions_last_10min >= 5,
    2.0,
    0
)

risk += np.where(
    transactions_last_10min >= 10,
    2.0,
    0
)


# ------------------------------------------------------------
# Device / location
# ------------------------------------------------------------

risk += new_device * 1.8

risk += new_location * 1.8

risk += international * 1.2


# ------------------------------------------------------------
# Merchant risk
# ------------------------------------------------------------

risk += merchant_risk * 0.25


# ------------------------------------------------------------
# Distance
# ------------------------------------------------------------

risk += np.where(
    distance_from_home > 100,
    0.5,
    0
)

risk += np.where(
    distance_from_home > 500,
    1.5,
    0
)


# ------------------------------------------------------------
# Failed attempts
# ------------------------------------------------------------

risk += failed_attempts_10min * 0.7


# ------------------------------------------------------------
# Unusual hour
# ------------------------------------------------------------

risk += unusual_hour * 0.8


# ------------------------------------------------------------
# New account + suspicious transaction
# ------------------------------------------------------------

risk += np.where(
    (account_age_days < 60) &
    (amount_ratio > 5),
    2.0,
    0
)


# ============================================================
# BEHAVIORAL FRAUD PATTERNS
# ============================================================

# High-value + high velocity
risk += np.where(
    (amount_ratio > 3) &
    (transactions_last_10min >= 5),
    3.0,
    0
)


# New device + new location
risk += np.where(
    (new_device == 1) &
    (new_location == 1),
    2.5,
    0
)


# International + new device
risk += np.where(
    (international == 1) &
    (new_device == 1),
    2.0,
    0
)


# High merchant risk + high velocity
risk += np.where(
    (merchant_risk >= 7) &
    (transactions_last_10min >= 5),
    2.5,
    0
)


# Multiple failed attempts + new device
risk += np.where(
    (failed_attempts_10min >= 3) &
    (new_device == 1),
    2.5,
    0
)


# Very suspicious combination
risk += np.where(
    (amount_ratio > 5) &
    (transactions_last_10min >= 5) &
    (merchant_risk >= 7),
    4.0,
    0
)


# ============================================================
# ADD RANDOMNESS
# ============================================================

risk += np.random.normal(
    0,
    1.5,
    N
)


# ============================================================
# GENERATE FRAUD LABELS
# ============================================================
#
# IMPORTANT:
#
# Instead of randomly sampling fraud labels from probability,
# we rank transactions by their behavioral risk.
#
# The highest-risk transactions become fraud.
#
# This guarantees the requested FRAUD_RATE exactly.
# ============================================================

fraud_count = int(
    N * FRAUD_RATE
)

# Sort transactions from highest risk to lowest risk
risk_order = np.argsort(
    risk
)[::-1]

# Start everything as legitimate
is_fraud = np.zeros(
    N,
    dtype=int
)

# Assign fraud to highest-risk transactions
fraud_indices = risk_order[
    :fraud_count
]

is_fraud[fraud_indices] = 1


# ============================================================
# CREATE DATAFRAME
# ============================================================

df = pd.DataFrame({

    "transaction_id": transaction_id,

    "user_id": user_id,

    "amount": np.round(
        amount,
        2
    ),

    "avg_user_amount": np.round(
        avg_user_amount,
        2
    ),

    "amount_ratio": np.round(
        amount_ratio,
        4
    ),

    "transactions_last_10min":
        transactions_last_10min,

    "new_device":
        new_device,

    "new_location":
        new_location,

    "international":
        international,

    "merchant_risk":
        merchant_risk,

    "account_age_days":
        account_age_days,

    "device_age_days":
        device_age_days,

    "distance_from_home":
        np.round(
            distance_from_home,
            2
        ),

    "failed_attempts_10min":
        failed_attempts_10min,

    "hour":
        hour,

    "day_of_week":
        day_of_week,

    "is_weekend":
        is_weekend,

    "unusual_hour":
        unusual_hour,

    "is_fraud":
        is_fraud
})


# ============================================================
# SHUFFLE DATASET
# ============================================================
#
# We don't want all high-risk fraud transactions grouped
# together in the CSV.
# ============================================================

df = df.sample(
    frac=1,
    random_state=42
).reset_index(
    drop=True
)


# ============================================================
# SAVE DATASET
# ============================================================

df.to_csv(
    OUTPUT_PATH,
    index=False
)


# ============================================================
# DATASET STATISTICS
# ============================================================

actual_fraud = int(
    df["is_fraud"].sum()
)

actual_normal = int(
    (df["is_fraud"] == 0).sum()
)

actual_fraud_percentage = (
    actual_fraud /
    len(df)
) * 100


# ============================================================
# FINAL OUTPUT
# ============================================================

print("\n========================================")
print("Dataset Generated Successfully!")
print("========================================")

print(
    f"\nTotal transactions : {len(df)}"
)

print(
    f"Fraud transactions : {actual_fraud}"
)

print(
    f"Normal transactions: {actual_normal}"
)

print(
    f"Fraud percentage   : "
    f"{actual_fraud_percentage:.2f}%"
)

print(
    f"Normal percentage  : "
    f"{100 - actual_fraud_percentage:.2f}%"
)

print(
    f"\nExpected fraud     : {fraud_count}"
)

print(
    f"Actual fraud       : {actual_fraud}"
)

print("\nFraud distribution:")
print(
    df["is_fraud"].value_counts()
)

print("\nDataset shape:")
print(
    df.shape
)

print("\nDataset columns:")
print(
    df.columns.tolist()
)

print("\nFirst 5 transactions:")
print(
    df.head()
)

print(
    f"\nDataset saved to: {OUTPUT_PATH}"
)

print("\n========================================")
print("Generation Complete")
print("========================================")