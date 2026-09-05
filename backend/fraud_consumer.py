import json

from kafka import KafkaConsumer

from risk_engine import calculate_risk
from xai_explainer import generate_ai_explanation
from database import supabase


# ==================================================
# KAFKA CONSUMER
# ==================================================

consumer = KafkaConsumer(

    "transactions",

    bootstrap_servers="localhost:9092",

    value_deserializer=lambda x:
        json.loads(x.decode("utf-8")),

    auto_offset_reset="earliest",

    enable_auto_commit=True,

    group_id="fraud-detection-group"
)


print("======================================")
print("FRAUD DETECTION KAFKA CONSUMER")
print("======================================")

print("Waiting for transactions...")
print()


# ==================================================
# CONSUME TRANSACTIONS
# ==================================================

for message in consumer:

    transaction = message.value

    print("--------------------------------------")

    print(
        "Transaction:",
        transaction["transaction_id"]
    )

    print(
        "Amount: ₹",
        transaction["amount"]
    )

    print(
        "Kafka Partition:",
        message.partition
    )

    print(
        "Kafka Offset:",
        message.offset
    )


    # ==================================================
    # RUN FRAUD DETECTION
    # ==================================================

    try:

        result = calculate_risk(
            transaction
        )


        # ==================================================
        # DISPLAY RISK RESULT
        # ==================================================

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
            "Reasons:",
            result["reasons"]
        )


        # ==================================================
        # RUN SHAP + RAG + GROQ XAI
        # ==================================================

        print()
        print("Generating AI explanation...")

        xai_result = generate_ai_explanation(
            transaction,
            result
        )


        print()
        print("======================================")
        print("AI FRAUD EXPLANATION")
        print("======================================")

        print(
            xai_result["explanation"]
        )

        print(
            "======================================"
        )


        # ==================================================
        # SAVE TRANSACTION TO SUPABASE
        # ==================================================

        transaction_record = {

        # ==========================================
        # BASIC TRANSACTION INFORMATION
        # ==========================================

            "transaction_id":
            transaction["transaction_id"],

            "user_id":
            transaction["user_id"],

            "amount":
            transaction["amount"],

            "avg_user_amount":
            transaction["avg_user_amount"],

            "amount_ratio":
            transaction["amount_ratio"],


            # ==========================================
            # BEHAVIOURAL FEATURES
            # ==========================================

            "transactions_last_10min":
            transaction["transactions_last_10min"],

            "failed_attempts_10min":
            transaction["failed_attempts_10min"],


            # ==========================================
            # DEVICE / LOCATION
            # ==========================================

            "new_device":
            transaction["new_device"],

            "new_location":
            transaction["new_location"],

            "international":
            transaction["international"],

            "distance_from_home":
            transaction["distance_from_home"],


            # ==========================================
            # MERCHANT
            # ==========================================

            "merchant_risk":
            transaction["merchant_risk"],


            # ==========================================
            # ACCOUNT / DEVICE
            # ==========================================

            "account_age_days":
            transaction["account_age_days"],

            "device_age_days":
            transaction["device_age_days"],


            # ==========================================
            # TIME
            # ==========================================

            "hour":
            transaction["hour"],

            "day_of_week":
            transaction["day_of_week"],

            "is_weekend":
            transaction["is_weekend"],

            "unusual_hour":
            transaction["unusual_hour"],


            # ==========================================
            # FRAUD MODEL RESULTS
            # ==========================================

            "fraud_probability":
            result["fraud_probability"],

            "fraud_score":
            result["fraud_score"],

            "anomaly_score":
            result["anomaly_score"],

            "rule_score":
            result["rule_score"],

            "final_risk_score":
            result["final_risk_score"],

            "risk_level":
            result["risk_level"],

            "reasons":
            result["reasons"],


            # ==========================================
            # XAI DATA
            # ==========================================

            "ai_explanation":
            xai_result["explanation"],

            "shap_explanations":
            xai_result["positive_shap_contributors"],

            "rag_knowledge":
            xai_result["retrieved_knowledge"]
        }


        supabase.table(
            "transactions"
        ).upsert(
            transaction_record,
            on_conflict="transaction_id"
        ).execute()


        print(
            "✅ Transaction saved to Supabase"
        )


        # ==================================================
        # CREATE ALERT FOR HIGH / CRITICAL
        # ==================================================

        if result["risk_level"] in [
            "HIGH",
            "CRITICAL"
        ]:

            alert_id = (
                f"ALERT-{transaction['transaction_id']}"
            )


            alert_record = {

                "alert_id":
                    alert_id,

                "transaction_id":
                    transaction["transaction_id"],

                "risk_score":
                    result["final_risk_score"],

                "severity":
                    result["risk_level"],

                "status":
                    "OPEN",

                "reasons":
                    result["reasons"]
            }


            supabase.table(
                "alerts"
            ).upsert(
                alert_record,
                on_conflict="alert_id"
            ).execute()


            print(
                "🚨 ALERT CREATED:",
                alert_id
            )


    except Exception as e:

        print(
            "❌ Processing Error:",
            e
        )