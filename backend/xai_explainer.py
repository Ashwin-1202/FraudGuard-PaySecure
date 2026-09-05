import os
import json

from dotenv import load_dotenv
from groq import Groq

from rag_semantic import retrieve_semantic_knowledge


# ==========================================
# LOAD ENVIRONMENT
# ==========================================

load_dotenv(override=True)

api_key = os.getenv("GROQ_API_KEY")

if not api_key:
    raise ValueError(
        "GROQ_API_KEY is missing"
    )


# ==========================================
# GROQ CLIENT
# ==========================================

client = Groq(
    api_key=api_key
)


# ==========================================
# RAG QUERY FOR EACH SHAP FEATURE
# ==========================================

FEATURE_QUERIES = {

    "amount_ratio":
        "Why can a transaction amount significantly higher than the user's normal amount indicate fraud?",

    "transactions_last_10min":
        "Why can many payment transactions within a short period indicate fraud?",

    "new_device":
        "Why can a transaction from a previously unseen device indicate fraud?",

    "new_location":
        "Why can a transaction from an unusual location indicate fraud?",

    "international":
        "Why can an unusual international transaction increase fraud risk?",

    "merchant_risk":
        "Why can a high-risk merchant increase payment fraud risk?",

    "failed_attempts_10min":
        "Why can multiple failed payment attempts within a short period indicate fraud?",

    "unusual_hour":
        "Why can a transaction during an unusual hour increase fraud risk?",

    "distance_from_home":
        "Why can an unusually large distance from the user's normal location indicate fraud?"
}


# ==========================================
# GENERATE AI EXPLANATION
# ==========================================

def generate_ai_explanation(
    transaction,
    risk_result
):

    # ======================================
    # GET POSITIVE SHAP CONTRIBUTORS
    # ======================================

    positive_shap = [

        item

        for item in risk_result["shap_explanations"]

        if item["shap_value"] > 0

    ]


    # ======================================
    # RETRIEVE RAG KNOWLEDGE
    # ======================================

    knowledge = []


    for item in positive_shap:

        feature = item["feature"]

        query = FEATURE_QUERIES.get(
            feature
        )

        if not query:
            continue


        retrieved = retrieve_semantic_knowledge(
            query,
            top_k=1
        )


        if retrieved:

            knowledge.extend(
                retrieved
            )


    # ======================================
    # FORMAT FRAUD PROBABILITY
    # ======================================

    fraud_probability_percent = round(
        risk_result["fraud_probability"] * 100,
        2
    )


    # ======================================
    # BUILD EVIDENCE
    # ======================================

    evidence = {

        "currency": "INR (₹)",

        "transaction": transaction,

        "fraud_probability":
            fraud_probability_percent,

        "final_risk_score":
            risk_result["final_risk_score"],

        "risk_level":
            risk_result["risk_level"],

        "business_rule_reasons":
            risk_result["reasons"],

        "shap_explanations":
            risk_result["shap_explanations"],

        "retrieved_knowledge":
            knowledge
    }


    # ======================================
    # GROQ PROMPT
    # ======================================

    prompt = f"""
You are an Explainable AI assistant for a
real-time payment fraud detection system.

The transaction currency is INR (₹).

Always display transaction amounts using ₹.
Never use the $ symbol.

Your job is ONLY to explain the fraud detection
decision using the evidence provided below.

IMPORTANT RULES:

1. Do NOT calculate a new risk score.

2. Do NOT modify the provided fraud probability.

3. Do NOT modify the provided final risk score.

4. Do NOT invent evidence.

5. Do NOT claim that a feature caused fraud.
   Explain that it contributed to the model's
   fraud prediction.

6. Use the SHAP contributions to explain which
   features influenced the XGBoost prediction.

7. Positive SHAP values indicate that the feature
   pushed the model toward the fraud prediction.

8. Negative SHAP values indicate that the feature
   pushed the model away from the fraud prediction.

9. Use the retrieved RAG knowledge only as
   supporting fraud-domain context.

10. Clearly distinguish model evidence from
    general fraud-domain knowledge.

Explain the result clearly for a fraud investigator.

Evidence:

{json.dumps(
    evidence,
    indent=2
)}

Return exactly these three sections:

1. Risk Explanation

Explain why the transaction received its
current risk level using the provided
risk score, fraud probability, SHAP
contributions, and business-rule signals.

2. Top Contributing Factors

List the most important positive SHAP
contributors and explain their meaning
using the retrieved RAG knowledge.

3. Investigation Recommendation

Provide practical investigation steps
based only on the available evidence.

Keep the response concise and professional.
"""


    # ======================================
    # CALL GROQ
    # ======================================

    response = client.chat.completions.create(

        model="openai/gpt-oss-20b",

        messages=[

            {
                "role": "system",

                "content": (
                    "You explain fraud detection "
                    "decisions using provided evidence. "
                    "You must not change or recalculate "
                    "the model's risk decision."
                )
            },

            {
                "role": "user",

                "content": prompt
            }

        ],

        temperature=0
    )


    # ======================================
    # RETURN RESULT
    # ======================================

    return {

        "explanation":
            response.choices[0].message.content,

        "retrieved_knowledge":
            knowledge,

        "positive_shap_contributors":
            positive_shap

    }