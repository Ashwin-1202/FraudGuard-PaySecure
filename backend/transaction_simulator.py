import random
import time
import json

from kafka import KafkaProducer

producer = KafkaProducer(
    bootstrap_servers="localhost:9092",
    value_serializer=lambda v: json.dumps(v).encode("utf-8")
)


API_URL = "http://127.0.0.1:8000/transactions/analyze"


def generate_transaction(transaction_number):

    # -----------------------------------------
    # NORMAL TRANSACTION
    # -----------------------------------------

    amount = round(
        random.uniform(100, 5000),
        2
    )

    avg_user_amount = round(
        random.uniform(500, 3000),
        2
    )

    amount_ratio = round(
        amount / avg_user_amount,
        2
    )

    transactions_last_10min = random.randint(
        0,
        4
    )

    new_device = random.choice(
        [0, 0, 0, 0, 1]
    )

    new_location = random.choice(
        [0, 0, 0, 0, 1]
    )

    international = random.choice(
        [0, 0, 0, 0, 1]
    )

    merchant_risk = random.randint(
        0,
        6
    )

    account_age_days = random.randint(
        100,
        3000
    )

    device_age_days = random.randint(
        30,
        1000
    )

    distance_from_home = round(
        random.uniform(0, 100),
        2
    )

    failed_attempts_10min = random.randint(
        0,
        2
    )

    hour = random.randint(
        6,
        22
    )

    day_of_week = random.randint(
        0,
        6
    )

    is_weekend = int(
        day_of_week >= 5
    )

    unusual_hour = int(
        hour <= 5 or hour >= 23
    )


    # -----------------------------------------
    # OCCASIONALLY CREATE FRAUD
    # -----------------------------------------

    is_fraud_scenario = (
        random.random() < 0.20
    )


    if is_fraud_scenario:

        amount = round(
            random.uniform(
                10000,
                100000
            ),
            2
        )

        avg_user_amount = round(
            random.uniform(
                500,
                3000
            ),
            2
        )

        amount_ratio = round(
            amount / avg_user_amount,
            2
        )

        transactions_last_10min = random.randint(
            6,
            15
        )

        new_device = 1

        new_location = 1

        international = 1

        merchant_risk = random.randint(
            7,
            10
        )

        account_age_days = random.randint(
            10,
            200
        )

        device_age_days = random.randint(
            1,
            20
        )

        distance_from_home = round(
            random.uniform(
                500,
                3000
            ),
            2
        )

        failed_attempts_10min = random.randint(
            3,
            8
        )

        hour = random.choice(
            [
                0,
                1,
                2,
                3,
                4,
                23
            ]
        )

        unusual_hour = 1


    # -----------------------------------------
    # RETURN TRANSACTION
    # -----------------------------------------

    return {

        "transaction_id":
            f"TXN-STREAM-{transaction_number}",

        "user_id":
            random.randint(
                1000,
                9999
            ),

        "amount":
            amount,

        "avg_user_amount":
            avg_user_amount,

        "amount_ratio":
            amount_ratio,

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
            distance_from_home,

        "failed_attempts_10min":
            failed_attempts_10min,

        "hour":
            hour,

        "day_of_week":
            day_of_week,

        "is_weekend":
            is_weekend,

        "unusual_hour":
            unusual_hour
    }


# =============================================
# START STREAM
# =============================================

print("======================================")
print("REAL-TIME TRANSACTION STREAM STARTED")
print("======================================")

transaction_number = 1


print("======================================")
print("REAL-TIME KAFKA TRANSACTION STREAM")
print("======================================")

transaction_number = 1

while True:

    transaction = generate_transaction(
        transaction_number
    )

    try:

        producer.send(
            "transactions",
            value=transaction
        )

        producer.flush()

        print("\n======================================")
        print("TRANSACTION GENERATED")
        print("======================================")

        print("Transaction ID          :", transaction["transaction_id"])
        print("User ID                 :", transaction["user_id"])
        print("Amount                  : ₹", transaction["amount"])
        print("Average User Amount     : ₹", transaction["avg_user_amount"])
        print("Amount Ratio            :", transaction["amount_ratio"])

        print("\n--- Transaction Behaviour ---")

        print(
            "Transactions Last 10 Min:",
            transaction["transactions_last_10min"]
        )

        print(
            "Failed Attempts 10 Min  :",
            transaction["failed_attempts_10min"]
        )

        print("\n--- Device & Location ---")

        print(
            "New Device              :",
            transaction["new_device"]
        )

        print(
            "New Location            :",
            transaction["new_location"]
        )

        print(
            "International           :",
            transaction["international"]
        )

        print(
            "Distance From Home      :",
            transaction["distance_from_home"],
            "km"
        )

        print("\n--- Merchant ---")

        print(
            "Merchant Risk           :",
            transaction["merchant_risk"]
        )

        print("\n--- Account / Device ---")

        print(
            "Account Age             :",
            transaction["account_age_days"],
            "days"
        )

        print(
            "Device Age              :",
            transaction["device_age_days"],
            "days"
        )

        print("\n--- Time Information ---")

        print(
            "Hour                    :",
            transaction["hour"]
        )

        print(
            "Day Of Week             :",
            transaction["day_of_week"]
        )

        print(
            "Weekend                 :",
            transaction["is_weekend"]
        )

        print(
            "Unusual Hour            :",
            transaction["unusual_hour"]
        )

        print("\nSent to Kafka topic: transactions")
        print("======================================")

    except Exception as e:

        print(
            "Kafka Error:",
            e
        )

    transaction_number += 1

    time.sleep(2)