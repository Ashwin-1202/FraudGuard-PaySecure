import json
import os
from collections import Counter, defaultdict
from datetime import datetime
from pathlib import Path
from typing import Optional
import uuid

from fastapi import FastAPI, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware

from app.schemas import (
    TransactionRequest,
    InvestigationCreate,
    InvestigationUpdate,
)
from database import supabase
from risk_engine import calculate_risk
from xai_explainer import generate_ai_explanation


# ==================================================
# FASTAPI APPLICATION
# ==================================================

app = FastAPI(
    title="Real-Time Payments Fraud Detection API",
    description="AI-powered real-time payment fraud detection system",
    version="1.0.0"
)


# ==================================================
# CORS
# ==================================================

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ==================================================
# HEALTH & STATUS ENDPOINTS
# ==================================================

@app.get("/")
def home():

    return {
        "message": "Fraud Detection API is running"
    }


@app.get("/health")
def health():

    return {
        "status": "healthy"
    }


@app.get("/api/system/status")
def get_system_status():

    supabase_online = False

    try:

        supabase.table(
            "transactions"
        ).select(
            "id"
        ).limit(
            1
        ).execute()

        supabase_online = True

    except Exception:

        supabase_online = False


    ai_online = bool(
        os.getenv("GROQ_API_KEY")
    )


    return {

        "kafka": True,

        "risk_engine": True,

        "ai_xai": ai_online,

        "supabase": supabase_online
    }


# ==================================================
# REAL-TIME TRANSACTION ANALYSIS
# ==================================================

@app.post("/transactions/analyze")
def analyze_transaction(
    transaction: TransactionRequest
):

    # ==================================================
    # CONVERT PYDANTIC OBJECT TO DICTIONARY
    # ==================================================

    transaction_data = transaction.dict()


    # ==================================================
    # RUN FRAUD DETECTION
    # ==================================================

    result = calculate_risk(
        transaction_data
    )


    # ==================================================
    # RUN SHAP + RAG + GROQ XAI
    # ==================================================

    print()
    print("Generating AI explanation...")


    try:

        xai_result = generate_ai_explanation(
            transaction_data,
            result
        )

    except Exception as e:

        print(
            "XAI Error:",
            e
        )

        # Keep transaction processing alive
        xai_result = {

            "explanation":
                "AI explanation unavailable.",

            "positive_shap_contributors":
                result.get(
                    "shap_explanations",
                    []
                ),

            "retrieved_knowledge":
                []
        }


    # ==================================================
    # SAVE TRANSACTION TO SUPABASE
    # ==================================================

    transaction_record = {

        # ==========================================
        # BASIC TRANSACTION INFORMATION
        # ==========================================

        "transaction_id":
            transaction_data["transaction_id"],

        "user_id":
            transaction_data["user_id"],

        "amount":
            transaction_data["amount"],

        "avg_user_amount":
            transaction_data["avg_user_amount"],

        "amount_ratio":
            transaction_data["amount_ratio"],


        # ==========================================
        # BEHAVIOURAL FEATURES
        # ==========================================

        "transactions_last_10min":
            transaction_data[
                "transactions_last_10min"
            ],

        "failed_attempts_10min":
            transaction_data[
                "failed_attempts_10min"
            ],


        # ==========================================
        # DEVICE / LOCATION
        # ==========================================

        "new_device":
            transaction_data["new_device"],

        "new_location":
            transaction_data["new_location"],

        "international":
            transaction_data["international"],

        "distance_from_home":
            transaction_data[
                "distance_from_home"
            ],


        # ==========================================
        # MERCHANT
        # ==========================================

        "merchant_risk":
            transaction_data["merchant_risk"],


        # ==========================================
        # ACCOUNT / DEVICE
        # ==========================================

        "account_age_days":
            transaction_data[
                "account_age_days"
            ],

        "device_age_days":
            transaction_data[
                "device_age_days"
            ],


        # ==========================================
        # TIME
        # ==========================================

        "hour":
            transaction_data["hour"],

        "day_of_week":
            transaction_data["day_of_week"],

        "is_weekend":
            transaction_data["is_weekend"],

        "unusual_hour":
            transaction_data["unusual_hour"],


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
            xai_result[
                "positive_shap_contributors"
            ],

        "rag_knowledge":
            xai_result[
                "retrieved_knowledge"
            ]
    }


    # ==================================================
    # SAVE TO SUPABASE
    # ==================================================

    try:

        response = supabase.table(
            "transactions"
        ).upsert(
            transaction_record,
            on_conflict="transaction_id"
        ).execute()


        print()
        print(
            "======================================"
        )

        print(
            "TRANSACTION SAVED TO SUPABASE"
        )

        print(
            "Transaction ID:",
            transaction_data["transaction_id"]
        )

        print(
            "Average Amount:",
            transaction_data["avg_user_amount"]
        )

        print(
            "Amount Ratio:",
            transaction_data["amount_ratio"]
        )

        print(
            "New Device:",
            transaction_data["new_device"]
        )

        print(
            "New Location:",
            transaction_data["new_location"]
        )

        print(
            "Merchant Risk:",
            transaction_data["merchant_risk"]
        )

        print(
            "======================================"
        )


    except Exception as e:

        print(
            "Supabase transaction insert error:",
            e
        )


    # ==================================================
    # CREATE ALERT FOR HIGH / CRITICAL
    # ==================================================

    if result["risk_level"] in [
        "HIGH",
        "CRITICAL"
    ]:

        alert_id = (
            f"ALERT-"
            f"{transaction_data['transaction_id']}"
        )


        alert_record = {

            "alert_id":
                alert_id,

            "transaction_id":
                transaction_data[
                    "transaction_id"
                ],

            "risk_score":
                result[
                    "final_risk_score"
                ],

            "severity":
                result["risk_level"],

            "status":
                "OPEN",

            "reasons":
                result["reasons"]
        }


        try:

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
                "Supabase alert insert error:",
                e
            )


    # ==================================================
    # RETURN RESULT TO FRONTEND
    # ==================================================

    return {

        "transaction_id":
            transaction_data[
                "transaction_id"
            ],

        "user_id":
            transaction_data[
                "user_id"
            ],

        "amount":
            transaction_data[
                "amount"
            ],

        # Return original transaction data too
        "avg_user_amount":
            transaction_data[
                "avg_user_amount"
            ],

        "amount_ratio":
            transaction_data[
                "amount_ratio"
            ],

        "transactions_last_10min":
            transaction_data[
                "transactions_last_10min"
            ],

        "new_device":
            transaction_data[
                "new_device"
            ],

        "new_location":
            transaction_data[
                "new_location"
            ],

        "international":
            transaction_data[
                "international"
            ],

        "merchant_risk":
            transaction_data[
                "merchant_risk"
            ],

        "account_age_days":
            transaction_data[
                "account_age_days"
            ],

        "device_age_days":
            transaction_data[
                "device_age_days"
            ],

        "distance_from_home":
            transaction_data[
                "distance_from_home"
            ],

        "failed_attempts_10min":
            transaction_data[
                "failed_attempts_10min"
            ],

        "hour":
            transaction_data[
                "hour"
            ],

        "day_of_week":
            transaction_data[
                "day_of_week"
            ],

        "is_weekend":
            transaction_data[
                "is_weekend"
            ],

        "unusual_hour":
            transaction_data[
                "unusual_hour"
            ],

        **result,

        "ai_explanation":
            xai_result[
                "explanation"
            ],

        "shap_explanations":
            xai_result[
                "positive_shap_contributors"
            ],

        "rag_knowledge":
            xai_result[
                "retrieved_knowledge"
            ]
    }


# ==================================================
# ALTERNATIVE API ENDPOINT
# ==================================================

@app.post(
    "/api/transactions/analyze"
)
def api_analyze_transaction(
    transaction: TransactionRequest
):

    return analyze_transaction(
        transaction
    )


# ==================================================
# DASHBOARD API
# ==================================================

@app.get(
    "/api/dashboard/stats"
)
def get_dashboard_stats():

    try:

        # ==========================================
        # COUNTS
        # ==========================================

        total = (
            supabase.table(
                "transactions"
            )
            .select(
                "id",
                count="exact"
            )
            .limit(1)
            .execute()
            .count
            or 0
        )


        low = (
            supabase.table(
                "transactions"
            )
            .select(
                "id",
                count="exact"
            )
            .eq(
                "risk_level",
                "LOW"
            )
            .limit(1)
            .execute()
            .count
            or 0
        )


        med = (
            supabase.table(
                "transactions"
            )
            .select(
                "id",
                count="exact"
            )
            .eq(
                "risk_level",
                "MEDIUM"
            )
            .limit(1)
            .execute()
            .count
            or 0
        )


        high = (
            supabase.table(
                "transactions"
            )
            .select(
                "id",
                count="exact"
            )
            .eq(
                "risk_level",
                "HIGH"
            )
            .limit(1)
            .execute()
            .count
            or 0
        )


        crit = (
            supabase.table(
                "transactions"
            )
            .select(
                "id",
                count="exact"
            )
            .eq(
                "risk_level",
                "CRITICAL"
            )
            .limit(1)
            .execute()
            .count
            or 0
        )


        open_alerts = (
            supabase.table(
                "alerts"
            )
            .select(
                "id",
                count="exact"
            )
            .eq(
                "status",
                "OPEN"
            )
            .limit(1)
            .execute()
            .count
            or 0
        )


        # ==========================================
        # RISK TREND
        # ==========================================

        trend_res = (
            supabase.table(
                "transactions"
            )
            .select(
                "created_at, final_risk_score"
            )
            .order(
                "created_at",
                desc=True
            )
            .limit(20)
            .execute()
        )


        trend_rows = list(
            reversed(
                trend_res.data or []
            )
        )


        risk_trend = []


        for r in trend_rows:

            created = r.get(
                "created_at"
            )

            time_label = ""


            if created:

                try:

                    dt = datetime.fromisoformat(
                        created.replace(
                            "Z",
                            "+00:00"
                        )
                    )

                    time_label = dt.strftime(
                        "%H:%M:%S"
                    )

                except Exception:

                    time_label = str(
                        created
                    )[11:19]


            score = float(
                r.get(
                    "final_risk_score"
                )
                or 0.0
            )


            risk_trend.append({

                "time":
                    time_label,

                "risk_score":
                    score,

                "score":
                    score
            })


        return {

            "total_transactions":
                total,

            "low_risk":
                low,

            "medium_risk":
                med,

            "high_risk":
                high,

            "critical_risk":
                crit,

            "open_alerts":
                open_alerts,

            "risk_distribution": [

                {
                    "name":
                        "Low",
                    "value":
                        low
                },

                {
                    "name":
                        "Medium",
                    "value":
                        med
                },

                {
                    "name":
                        "High",
                    "value":
                        high
                },

                {
                    "name":
                        "Critical",
                    "value":
                        crit
                }
            ],

            "risk_trend":
                risk_trend
        }


    except Exception as e:

        print(
            f"Error fetching dashboard stats: {e}"
        )

        raise HTTPException(
            status_code=500,
            detail=str(e)
        )


# ==================================================
# ATTACH ALERTS TO TRANSACTIONS
# ==================================================

def attach_alerts_to_transactions(
    txns
):

    if not txns:

        return txns


    txn_ids = [

        t.get(
            "transaction_id"
        )

        for t in txns

        if t.get(
            "transaction_id"
        )
    ]


    alert_map = {}


    if txn_ids:

        try:

            alert_res = (
                supabase.table(
                    "alerts"
                )
                .select("*")
                .in_(
                    "transaction_id",
                    txn_ids
                )
                .execute()
            )


            for a in (
                alert_res.data or []
            ):

                if a.get(
                    "transaction_id"
                ):

                    alert_map[
                        a["transaction_id"]
                    ] = a


        except Exception as e:

            print(
                f"Error fetching alerts mapping: {e}"
            )


    for t in txns:

        tid = t.get(
            "transaction_id"
        )


        if tid and tid in alert_map:

            a = alert_map[tid]


            t["alert_id"] = (
                a.get(
                    "alert_id"
                )
                or (
                    f"ALERT-{a.get('id')}"
                    if a.get("id")
                    else None
                )
            )


            t["alert_status"] = a.get(
                "status",
                "OPEN"
            )


        elif t.get(
            "risk_level"
        ) in [
            "HIGH",
            "CRITICAL"
        ]:

            t["alert_id"] = (
                f"ALERT-{tid}"
            )

            t["alert_status"] = "OPEN"


        else:

            t["alert_id"] = None

            t["alert_status"] = None


    return txns


# ==================================================
# RECENT TRANSACTIONS
# ==================================================

@app.get(
    "/api/dashboard/recent-transactions"
)
def get_recent_transactions(
    limit: int = Query(
        8,
        ge=1,
        le=100
    )
):

    try:

        res = (
            supabase.table(
                "transactions"
            )
            .select("*")
            .order(
                "created_at",
                desc=True
            )
            .limit(
                limit
            )
            .execute()
        )


        txns = res.data or []


        return attach_alerts_to_transactions(
            txns
        )


    except Exception as e:

        print(
            f"Error fetching recent transactions: {e}"
        )

        raise HTTPException(
            status_code=500,
            detail=str(e)
        )


# ==================================================
# TRANSACTIONS API
# ==================================================

@app.get(
    "/api/transactions"
)
def get_transactions(

    limit: int = Query(
        100,
        ge=1,
        le=1000
    ),

    offset: int = Query(
        0,
        ge=0
    ),

    risk_level: Optional[str] = None,

    search: Optional[str] = None
):

    try:

        query = (
            supabase.table(
                "transactions"
            )
            .select("*")
            .order(
                "created_at",
                desc=True
            )
        )


        if (
            risk_level
            and risk_level.upper() != "ALL"
        ):

            query = query.eq(
                "risk_level",
                risk_level.upper()
            )


        if search:

            query = query.ilike(
                "transaction_id",
                f"%{search}%"
            )


        query = query.range(
            offset,
            offset + limit - 1
        )


        res = query.execute()


        txns = res.data or []


        return attach_alerts_to_transactions(
            txns
        )


    except Exception as e:

        print(
            f"Error fetching transactions: {e}"
        )

        raise HTTPException(
            status_code=500,
            detail=str(e)
        )


# ==================================================
# SINGLE TRANSACTION
# ==================================================

@app.get(
    "/api/transactions/{transaction_id}"
)
def get_transaction_by_id(
    transaction_id: str
):

    try:

        res = (
            supabase.table(
                "transactions"
            )
            .select("*")
            .eq(
                "transaction_id",
                transaction_id
            )
            .limit(1)
            .execute()
        )


        if (
            not res.data
            and transaction_id.isdigit()
        ):

            res = (
                supabase.table(
                    "transactions"
                )
                .select("*")
                .eq(
                    "id",
                    int(transaction_id)
                )
                .limit(1)
                .execute()
            )


        if not res.data:

            raise HTTPException(
                status_code=404,
                detail="Transaction not found"
            )


        txn = res.data[0]


        # ==========================================
        # ALERT
        # ==========================================

        alert_res = (
            supabase.table(
                "alerts"
            )
            .select("*")
            .eq(
                "transaction_id",
                txn.get(
                    "transaction_id"
                )
            )
            .limit(1)
            .execute()
        )


        alert = (
            alert_res.data[0]
            if alert_res.data
            else None
        )


        if alert:

            txn["alert_id"] = (
                alert.get(
                    "alert_id"
                )
                or (
                    f"ALERT-{alert.get('id')}"
                    if alert.get("id")
                    else None
                )
            )


            txn["alert_status"] = (
                alert.get(
                    "status",
                    "OPEN"
                )
            )


        elif txn.get(
            "risk_level"
        ) in [
            "HIGH",
            "CRITICAL"
        ]:

            txn["alert_id"] = (
                f"ALERT-"
                f"{txn.get('transaction_id')}"
            )

            txn["alert_status"] = "OPEN"


        # ==========================================
        # INVESTIGATION TIMELINE
        # ==========================================

        created_at = txn.get(
            "created_at"
        )


        timeline = {

            "received_at":
                created_at,

            "fraud_model_at":
                created_at,

            "anomaly_at":
                created_at,

            "rules_at":
                created_at,

            "shap_at":
                (
                    created_at
                    if txn.get(
                        "shap_explanations"
                    )
                    else None
                ),

            "rag_at":
                (
                    created_at
                    if txn.get(
                        "rag_knowledge"
                    )
                    else None
                ),

            "ai_explanation_at":
                (
                    created_at
                    if txn.get(
                        "ai_explanation"
                    )
                    else None
                ),

            "alert_at":
                (
                    alert.get(
                        "created_at"
                    )
                    if alert
                    else (
                        created_at
                        if txn.get(
                            "alert_id"
                        )
                        else None
                    )
                )
        }


        txn["alert"] = alert

        txn["timeline"] = timeline


        return txn


    except HTTPException:

        raise


    except Exception as e:

        print(
            f"Error fetching transaction "
            f"{transaction_id}: {e}"
        )

        raise HTTPException(
            status_code=500,
            detail=str(e)
        )


# ==================================================
# ALERTS API
# ==================================================

@app.get(
    "/api/alerts"
)
def get_alerts(

    limit: int = Query(
        100,
        ge=1,
        le=1000
    ),

    status: Optional[str] = None,

    severity: Optional[str] = None
):

    try:

        query = (
            supabase.table(
                "alerts"
            )
            .select("*")
            .order(
                "created_at",
                desc=True
            )
        )


        if (
            status
            and status.upper() != "ALL"
        ):

            query = query.eq(
                "status",
                status.upper()
            )


        if (
            severity
            and severity.upper() != "ALL"
        ):

            query = query.eq(
                "severity",
                severity.upper()
            )


        query = query.limit(
            limit
        )


        res = query.execute()


        return res.data or []


    except Exception as e:

        print(
            f"Error fetching alerts: {e}"
        )

        raise HTTPException(
            status_code=500,
            detail=str(e)
        )


# ==================================================
# SINGLE ALERT
# ==================================================

@app.get(
    "/api/alerts/{alert_id}"
)
def get_alert_by_id(
    alert_id: str
):

    try:

        res = (
            supabase.table(
                "alerts"
            )
            .select("*")
            .eq(
                "alert_id",
                alert_id
            )
            .limit(1)
            .execute()
        )


        if (
            not res.data
            and alert_id.isdigit()
        ):

            res = (
                supabase.table(
                    "alerts"
                )
                .select("*")
                .eq(
                    "id",
                    int(alert_id)
                )
                .limit(1)
                .execute()
            )


        if not res.data:

            raise HTTPException(
                status_code=404,
                detail="Alert not found"
            )


        return res.data[0]


    except HTTPException:

        raise


    except Exception as e:

        print(
            f"Error fetching alert "
            f"{alert_id}: {e}"
        )

        raise HTTPException(
            status_code=500,
            detail=str(e)
        )


# ==================================================
# ACKNOWLEDGE ALERT
# ==================================================

@app.patch(
    "/api/alerts/{alert_id}/acknowledge"
)
def acknowledge_alert(
    alert_id: str
):

    try:

        res = (
            supabase.table(
                "alerts"
            )
            .update({
                "status":
                    "ACKNOWLEDGED"
            })
            .eq(
                "alert_id",
                alert_id
            )
            .execute()
        )


        if (
            not res.data
            and alert_id.isdigit()
        ):

            res = (
                supabase.table(
                    "alerts"
                )
                .update({
                    "status":
                        "ACKNOWLEDGED"
                })
                .eq(
                    "id",
                    int(alert_id)
                )
                .execute()
            )


        if not res.data:

            raise HTTPException(
                status_code=404,
                detail="Alert not found"
            )


        return res.data[0]


    except HTTPException:

        raise


    except Exception as e:

        print(
            f"Error acknowledging alert: {e}"
        )

        raise HTTPException(
            status_code=500,
            detail=str(e)
        )


# ==================================================
# RESOLVE ALERT
# ==================================================

@app.patch(
    "/api/alerts/{alert_id}/resolve"
)
def resolve_alert(
    alert_id: str
):

    try:

        res = (
            supabase.table(
                "alerts"
            )
            .update({
                "status":
                    "RESOLVED"
            })
            .eq(
                "alert_id",
                alert_id
            )
            .execute()
        )


        if (
            not res.data
            and alert_id.isdigit()
        ):

            res = (
                supabase.table(
                    "alerts"
                )
                .update({
                    "status":
                        "RESOLVED"
                })
                .eq(
                    "id",
                    int(alert_id)
                )
                .execute()
            )


        if not res.data:

            raise HTTPException(
                status_code=404,
                detail="Alert not found"
            )


        return res.data[0]


    except HTTPException:

        raise


    except Exception as e:

        print(
            f"Error resolving alert: {e}"
        )

        raise HTTPException(
            status_code=500,
            detail=str(e)
        )


# ==================================================
# ANALYTICS API
# ==================================================

@app.get(
    "/api/analytics"
)
def get_analytics():

    try:

        res = (
            supabase.table(
                "transactions"
            )
            .select(
                """
                amount,
                fraud_probability,
                final_risk_score,
                risk_level,
                reasons,
                shap_explanations,
                created_at
                """
            )
            .order(
                "created_at",
                desc=True
            )
            .limit(
                500
            )
            .execute()
        )


        rows = res.data or []


        total_cnt = len(
            rows
        )


        if total_cnt == 0:

            return {

                "total_transactions":
                    0,

                "fraud_rate":
                    0.0,

                "critical_count":
                    0,

                "avg_risk_score":
                    0.0,

                "avg_amount":
                    0.0,

                "risk_distribution": [

                    {
                        "name":
                            "Low",
                        "value":
                            0
                    },

                    {
                        "name":
                            "Medium",
                        "value":
                            0
                    },

                    {
                        "name":
                            "High",
                        "value":
                            0
                    },

                    {
                        "name":
                            "Critical",
                        "value":
                            0
                    }
                ],

                "fraud_probability_distribution": [

                    {
                        "bucket":
                            "0-20%",
                        "count":
                            0
                    },

                    {
                        "bucket":
                            "20-40%",
                        "count":
                            0
                    },

                    {
                        "bucket":
                            "40-60%",
                        "count":
                            0
                    },

                    {
                        "bucket":
                            "60-80%",
                        "count":
                            0
                    },

                    {
                        "bucket":
                            "80-100%",
                        "count":
                            0
                    }
                ],

                "transaction_volume":
                    [],

                "risk_score_over_time":
                    [],

                "top_fraud_indicators":
                    [],

                "top_shap_features":
                    []
            }


        # ==========================================
        # BASIC STATISTICS
        # ==========================================

        avg_score = round(

            sum(
                float(
                    r.get(
                        "final_risk_score"
                    )
                    or 0
                )

                for r in rows
            )
            / total_cnt,

            2
        )


        avg_amt = round(

            sum(
                float(
                    r.get(
                        "amount"
                    )
                    or 0
                )

                for r in rows
            )
            / total_cnt,

            2
        )


        high_crit_cnt = sum(

            1

            for r in rows

            if r.get(
                "risk_level"
            ) in [
                "HIGH",
                "CRITICAL"
            ]
        )


        fraud_rate = round(

            high_crit_cnt
            / total_cnt,

            4
        )


        crit_cnt = sum(

            1

            for r in rows

            if r.get(
                "risk_level"
            ) == "CRITICAL"
        )


        # ==========================================
        # RISK DISTRIBUTION
        # ==========================================

        counts = Counter(

            r.get(
                "risk_level"
            )

            for r in rows
        )


        risk_dist = [

            {
                "name":
                    "Low",

                "value":
                    counts.get(
                        "LOW",
                        0
                    )
            },

            {
                "name":
                    "Medium",

                "value":
                    counts.get(
                        "MEDIUM",
                        0
                    )
            },

            {
                "name":
                    "High",

                "value":
                    counts.get(
                        "HIGH",
                        0
                    )
            },

            {
                "name":
                    "Critical",

                "value":
                    counts.get(
                        "CRITICAL",
                        0
                    )
            }
        ]


        # ==========================================
        # FRAUD PROBABILITY DISTRIBUTION
        # ==========================================

        buckets = {

            "0-20%":
                0,

            "20-40%":
                0,

            "40-60%":
                0,

            "60-80%":
                0,

            "80-100%":
                0
        }


        for r in rows:

            p = (

                float(
                    r.get(
                        "fraud_probability"
                    )
                    or 0
                )
                * 100
            )


            if p < 20:

                buckets[
                    "0-20%"
                ] += 1


            elif p < 40:

                buckets[
                    "20-40%"
                ] += 1


            elif p < 60:

                buckets[
                    "40-60%"
                ] += 1


            elif p < 80:

                buckets[
                    "60-80%"
                ] += 1


            else:

                buckets[
                    "80-100%"
                ] += 1


        prob_dist = [

            {
                "bucket":
                    k,

                "count":
                    v
            }

            for k, v
            in buckets.items()
        ]


        # ==========================================
        # VOLUME AND RISK TREND
        # ==========================================

        sample_rows = list(
            reversed(
                rows[:20]
            )
        )


        vol_map = defaultdict(
            int
        )

        risk_trend = []


        for r in sample_rows:

            created = r.get(
                "created_at"
            )


            time_label = ""


            if created:

                try:

                    dt = datetime.fromisoformat(
                        created.replace(
                            "Z",
                            "+00:00"
                        )
                    )


                    time_label = dt.strftime(
                        "%H:%M"
                    )


                except Exception:

                    time_label = str(
                        created
                    )[11:16]


            vol_map[
                time_label
            ] += 1


            risk_trend.append({

                "time":
                    time_label,

                "risk_score":
                    float(
                        r.get(
                            "final_risk_score"
                        )
                        or 0
                    )
            })


        txn_volume = [

            {
                "time":
                    k,

                "count":
                    v
            }

            for k, v
            in vol_map.items()
        ]


        # ==========================================
        # TOP FRAUD REASONS
        # ==========================================

        reason_counter = Counter()


        for r in rows:

            for reason in (
                r.get(
                    "reasons"
                )
                or []
            ):

                reason_counter[
                    reason
                ] += 1


        top_indicators = [

            {
                "reason":
                    k,

                "count":
                    v
            }

            for k, v
            in reason_counter.most_common(
                6
            )
        ]


        # ==========================================
        # TOP SHAP FEATURES
        # ==========================================

        shap_sums = defaultdict(
            float
        )

        shap_counts = defaultdict(
            int
        )


        for r in rows:

            for s in (
                r.get(
                    "shap_explanations"
                )
                or []
            ):

                f = s.get(
                    "feature"
                )


                val = abs(
                    float(
                        s.get(
                            "shap_value"
                        )
                        or 0
                    )
                )


                if f:

                    shap_sums[
                        f
                    ] += val

                    shap_counts[
                        f
                    ] += 1


        top_shap = [

            {
                "feature":
                    f,

                "avg_abs_shap":
                    round(
                        shap_sums[f]
                        /
                        shap_counts[f],

                        4
                    )
            }

            for f in shap_sums

            if shap_counts[f] > 0
        ]


        top_shap.sort(

            key=lambda x:
                x["avg_abs_shap"],

            reverse=True
        )


        top_shap = top_shap[
            :6
        ]


        # ==========================================
        # EXACT TOTAL
        # ==========================================

        exact_total = (

            supabase.table(
                "transactions"
            )
            .select(
                "id",
                count="exact"
            )
            .limit(1)
            .execute()
            .count

            or total_cnt
        )


        # ==========================================
        # RETURN ANALYTICS
        # ==========================================

        return {

            "total_transactions":
                exact_total,

            "fraud_rate":
                fraud_rate,

            "critical_count":
                crit_cnt,

            "avg_risk_score":
                avg_score,

            "avg_amount":
                avg_amt,

            "risk_distribution":
                risk_dist,

            "fraud_probability_distribution":
                prob_dist,

            "transaction_volume":
                txn_volume,

            "risk_score_over_time":
                risk_trend,

            "top_fraud_indicators":
                top_indicators,

            "top_shap_features":
                top_shap
        }


    except Exception as e:

        print(
            f"Error fetching analytics: {e}"
        )

        raise HTTPException(
            status_code=500,
            detail=str(e)
        )


# ============================================================
# MODEL MONITORING API
# ============================================================

MODEL_VERSION = "1.0"
MODEL_TYPE = "LightGBMClassifier"
MONITORING_WINDOW = 250
RISK_THRESHOLD = 52.0


def _safe_float(value, default=0.0):
    try:
        return float(value)
    except (TypeError, ValueError):
        return default


def _psi(expected_counts, actual_counts):
    """Population Stability Index for two equally-bucketed distributions."""
    total_expected = sum(expected_counts) or 1
    total_actual = sum(actual_counts) or 1

    epsilon = 1e-6
    score = 0.0

    for expected, actual in zip(expected_counts, actual_counts):
        expected_pct = max(expected / total_expected, epsilon)
        actual_pct = max(actual / total_actual, epsilon)
        score += (actual_pct - expected_pct) * __import__("math").log(
            actual_pct / expected_pct
        )

    return round(float(score), 4)


def _probability_bucket(value):
    value = max(0.0, min(1.0, _safe_float(value)))

    if value < 0.20:
        return 0
    if value < 0.40:
        return 1
    if value < 0.60:
        return 2
    if value < 0.80:
        return 3
    return 4


@app.get("/api/model-monitoring")
def get_model_monitoring():
    """
    Return operational model-health metrics.

    Drift is calculated by comparing the latest transaction window
    against the immediately preceding window using fraud-probability
    distribution PSI. FPR/FNR are calculated only from investigator
    feedback, where the human decision provides the ground truth.
    """

    try:
        transaction_response = (
            supabase
            .table("transactions")
            .select(
                "transaction_id, fraud_probability, final_risk_score, risk_level, created_at"
            )
            .order("created_at", desc=True)
            .limit(MONITORING_WINDOW * 2)
            .execute()
        )

        transactions = transaction_response.data or []
        current_window = transactions[:MONITORING_WINDOW]
        previous_window = transactions[MONITORING_WINDOW:MONITORING_WINDOW * 2]

        risk_levels = ["Low", "Medium", "High", "Critical"]
        risk_counts = {level: 0 for level in risk_levels}

        for row in current_window:
            level = str(row.get("risk_level") or "").strip().title()
            if level in risk_counts:
                risk_counts[level] += 1

        prediction_distribution = [
            {
                "name": level,
                "count": risk_counts[level],
                "percentage": round(
                    (risk_counts[level] / len(current_window) * 100), 2
                ) if current_window else 0.0,
            }
            for level in risk_levels
        ]

        probability_buckets = [
            "0-20%",
            "20-40%",
            "40-60%",
            "60-80%",
            "80-100%",
        ]

        probability_counts = [0] * 5
        for row in current_window:
            probability_counts[
                _probability_bucket(row.get("fraud_probability"))
            ] += 1

        fraud_probability_distribution = [
            {
                "bucket": bucket,
                "count": probability_counts[index],
                "percentage": round(
                    probability_counts[index] / len(current_window) * 100, 2
                ) if current_window else 0.0,
            }
            for index, bucket in enumerate(probability_buckets)
        ]

        risk_scores = [
            _safe_float(row.get("final_risk_score"))
            for row in current_window
        ]
        average_risk_score = round(
            sum(risk_scores) / len(risk_scores), 2
        ) if risk_scores else 0.0

        # --------------------------------------------------------
        # DRIFT
        # --------------------------------------------------------
        current_probability_counts = [0] * 5
        previous_probability_counts = [0] * 5

        for row in current_window:
            current_probability_counts[
                _probability_bucket(row.get("fraud_probability"))
            ] += 1

        for row in previous_window:
            previous_probability_counts[
                _probability_bucket(row.get("fraud_probability"))
            ] += 1

        if previous_window:
            drift_score = _psi(
                previous_probability_counts,
                current_probability_counts,
            )
        else:
            drift_score = 0.0

        if not previous_window:
            drift_status = "INSUFFICIENT_BASELINE"
        elif drift_score >= 0.25:
            drift_status = "DRIFT_DETECTED"
        elif drift_score >= 0.10:
            drift_status = "WARNING"
        else:
            drift_status = "STABLE"

        # --------------------------------------------------------
        # HUMAN FEEDBACK METRICS
        # --------------------------------------------------------
        feedback_rows = []
        try:
            feedback_response = (
                supabase
                .table("investigation_feedback")
                .select("transaction_id, investigator_decision, reviewed_at")
                .order("reviewed_at", desc=True)
                .limit(MONITORING_WINDOW)
                .execute()
            )
            feedback_rows = feedback_response.data or []
        except Exception as err:
            err_str = str(err)
            # Graceful fallback if investigation_feedback table is not yet in Supabase (PGRST205)
            if "PGRST205" in err_str or "investigation_feedback" in err_str:
                print(
                    "Notice: 'investigation_feedback' table not found. "
                    "Falling back to 'investigations' table for human feedback."
                )
                inv_response = (
                    supabase
                    .table("investigations")
                    .select("transaction_id, decision, resolved_at, updated_at")
                    .not_.is_("decision", "null")
                    .order("updated_at", desc=True)
                    .limit(MONITORING_WINDOW)
                    .execute()
                )
                inv_rows = inv_response.data or []
                feedback_rows = [
                    {
                        "transaction_id": row.get("transaction_id"),
                        "investigator_decision": row.get("decision"),
                        "reviewed_at": row.get("resolved_at") or row.get("updated_at"),
                    }
                    for row in inv_rows
                    if row.get("decision") in ("CONFIRMED_FRAUD", "FALSE_POSITIVE")
                ]
            else:
                # Re-raise unrelated database or network errors
                raise
        feedback_by_transaction = {
            str(row.get("transaction_id")): row
            for row in feedback_rows
            if row.get("transaction_id") is not None
        }

        evaluated = []
        for row in transactions:
            transaction_id = str(row.get("transaction_id") or "")
            feedback = feedback_by_transaction.get(transaction_id)

            if not feedback:
                continue

            human_decision = feedback.get("investigator_decision")
            actual_fraud = human_decision == "CONFIRMED_FRAUD"
            predicted_fraud = (
                _safe_float(row.get("final_risk_score")) >= RISK_THRESHOLD
            )

            evaluated.append((actual_fraud, predicted_fraud))

        true_positive = sum(actual and predicted for actual, predicted in evaluated)
        false_positive = sum((not actual) and predicted for actual, predicted in evaluated)
        false_negative = sum(actual and (not predicted) for actual, predicted in evaluated)
        true_negative = sum((not actual) and (not predicted) for actual, predicted in evaluated)

        fpr = (
            false_positive / (false_positive + true_negative)
            if (false_positive + true_negative) else None
        )
        fnr = (
            false_negative / (false_negative + true_positive)
            if (false_negative + true_positive) else None
        )

        # --------------------------------------------------------
        # OVERALL HEALTH
        # --------------------------------------------------------
        if drift_score >= 0.25 or (fnr is not None and fnr >= 0.20):
            model_health = "CRITICAL"
        elif drift_score >= 0.10 or (fpr is not None and fpr >= 0.20):
            model_health = "WARNING"
        else:
            model_health = "HEALTHY"

        return {
            "model_version": MODEL_VERSION,
            "model_type": MODEL_TYPE,
            "risk_threshold": RISK_THRESHOLD,
            "monitoring_window": len(current_window),
            "total_transactions": len(transactions),
            "prediction_distribution": prediction_distribution,
            "fraud_probability_distribution": fraud_probability_distribution,
            "average_risk_score": average_risk_score,
            "drift_score": drift_score,
            "drift_status": drift_status,
            "false_positive_rate": round(fpr, 4) if fpr is not None else None,
            "false_negative_rate": round(fnr, 4) if fnr is not None else None,
            "feedback_evaluated": len(evaluated),
            "confusion_matrix": {
                "true_positive": true_positive,
                "false_positive": false_positive,
                "false_negative": false_negative,
                "true_negative": true_negative,
            },
            "model_health": model_health,
            "last_updated": datetime.utcnow().isoformat() + "Z",
        }

    except Exception as e:
        print(f"Error fetching model monitoring metrics: {e}")
        raise HTTPException(
            status_code=500,
            detail=str(e),
        )


# ============================================================
# MODEL COMPARISON EXPERIMENT API
# ============================================================

@app.get("/api/model-comparison")
def get_model_comparison():
    """
    Return the saved model-comparison experiment results.

    The experiment compares Logistic Regression, Random Forest,
    XGBoost, and LightGBM using precision, recall, F1, ROC-AUC,
    training time, and inference time.
    """

    try:
        results_path = (
            Path(__file__).resolve().parent.parent
            / "experiments"
            / "model_comparison_results.json"
        )

        if not results_path.exists():
            raise HTTPException(
                status_code=404,
                detail="Model comparison results file not found",
            )

        with results_path.open("r", encoding="utf-8") as file:
            payload = json.load(file)

        if not isinstance(payload, dict):
            raise HTTPException(
                status_code=500,
                detail="Invalid model comparison results format",
            )

        raw_results = payload.get("results", [])
        if not isinstance(raw_results, list):
            raise HTTPException(
                status_code=500,
                detail="Invalid model comparison results list",
            )

        results = []

        for item in raw_results:
            results.append({
                "model": item.get("model", "Unknown"),
                "precision": float(item.get("precision", 0) or 0),
                "recall": float(item.get("recall", 0) or 0),
                "f1_score": float(item.get("f1_score", 0) or 0),
                "roc_auc": float(item.get("roc_auc", 0) or 0),
                "training_time_seconds": float(
                    item.get("training_time_seconds", 0) or 0
                ),
                "inference_time_seconds": float(
                    item.get("inference_time_seconds", 0) or 0
                ),
            })

        # The experiment itself selects the first/best model after
        # sorting by F1 and ROC-AUC, while considering inference time.
        selected_model = payload.get("selected_model")

        if not selected_model and results:
            selected_model = max(
                results,
                key=lambda item: (
                    item["f1_score"],
                    item["roc_auc"],
                    -item["inference_time_seconds"],
                ),
            )["model"]

        best_result = next(
            (
                item
                for item in results
                if item["model"] == selected_model
            ),
            None,
        )

        return {
            "experiment": payload.get(
                "experiment",
                "fraud_model_comparison",
            ),
            "dataset": payload.get("dataset", {}),
            "selected_model": selected_model,
            "selection_reason": payload.get(
                "selection_reason",
                (
                    "Selected based on the best F1-score and ROC-AUC "
                    "performance while considering inference time."
                ),
            ),
            "best_result": best_result,
            "results": results,
            "total_models": len(results),
        }

    except HTTPException:
        raise

    except Exception as e:
        print(f"Error fetching model comparison results: {e}")
        raise HTTPException(
            status_code=500,
            detail=str(e),
        )


# ============================================================
# THRESHOLD OPTIMIZATION EXPERIMENT API
# ============================================================

@app.get("/api/threshold-optimization")
def get_threshold_optimization():
    """
    Return the saved hybrid-risk threshold optimization results.

    The experiment searches thresholds from 20 through 80 on the
    validation split, selects the threshold with the best F1 score,
    and evaluates that selected threshold on the final holdout set.
    """

    try:
        results_path = (
            Path(__file__).resolve().parent.parent
            / "experiments"
            / "threshold_optimization_results.json"
        )

        if not results_path.exists():
            raise HTTPException(
                status_code=404,
                detail="Threshold optimization results file not found",
            )

        with results_path.open("r", encoding="utf-8") as file:
            payload = json.load(file)

        if not isinstance(payload, dict):
            raise HTTPException(
                status_code=500,
                detail="Invalid threshold optimization results format",
            )

        threshold_results = payload.get("threshold_results", [])
        if not isinstance(threshold_results, list):
            raise HTTPException(
                status_code=500,
                detail="Invalid threshold results list",
            )

        normalized_results = []
        for item in threshold_results:
            if not isinstance(item, dict):
                continue

            normalized_results.append({
                "threshold": float(item.get("threshold", 0) or 0),
                "precision": float(item.get("precision", 0) or 0),
                "recall": float(item.get("recall", 0) or 0),
                "f1": float(item.get("f1", 0) or 0),
                "fpr": float(item.get("fpr", 0) or 0),
                "fnr": float(item.get("fnr", 0) or 0),
            })

        best_threshold = payload.get("best_threshold")
        best_threshold = (
            float(best_threshold)
            if best_threshold is not None
            else None
        )

        validation_metrics = payload.get("validation_metrics", {}) or {}
        final_test_metrics = payload.get("final_test_metrics", {}) or {}

        def normalize_metrics(metrics):
            if not isinstance(metrics, dict):
                return {}

            normalized = {}
            for key, value in metrics.items():
                try:
                    normalized[key] = float(value)
                except (TypeError, ValueError):
                    normalized[key] = value
            return normalized

        validation_metrics = normalize_metrics(validation_metrics)
        final_test_metrics = normalize_metrics(final_test_metrics)

        best_result = next(
            (
                item
                for item in normalized_results
                if best_threshold is not None
                and item["threshold"] == best_threshold
            ),
            None,
        )

        # The experiment uses these fixed hybrid weights.
        hybrid_weights = payload.get(
            "hybrid_weights",
            {
                "lightgbm": 0.45,
                "anomaly": 0.30,
                "rules": 0.25,
            },
        )

        return {
            "experiment": "hybrid_threshold_optimization",
            "best_threshold": best_threshold,
            "best_result": best_result,
            "validation_metrics": validation_metrics,
            "final_test_metrics": final_test_metrics,
            "threshold_results": normalized_results,
            "hybrid_weights": hybrid_weights,
            "dataset": payload.get("dataset", {}),
            "split": payload.get("split", {}),
            "runtime_seconds": float(
                payload.get("runtime_seconds", 0) or 0
            ),
            "total_thresholds": len(normalized_results),
        }

    except HTTPException:
        raise

    except Exception as e:
        print(f"Error fetching threshold optimization results: {e}")
        raise HTTPException(
            status_code=500,
            detail=str(e),
        )


# ============================================================
# CONCEPT DRIFT EXPERIMENT API
# ============================================================

@app.get("/api/concept-drift")
def get_concept_drift():
    """
    Return the saved concept-drift experiment results for the frontend.

    The experiment evaluates the same fraud model against four simulated
    monthly fraud patterns and records model metrics, drift status,
    performance degradation, and retraining recommendations.
    """

    try:
        results_path = (
            Path(__file__).resolve().parent.parent
            / "experiments"
            / "concept_drift_results.json"
        )

        if not results_path.exists():
            raise HTTPException(
                status_code=404,
                detail="Concept drift results file not found",
            )

        with results_path.open("r", encoding="utf-8") as file:
            results = json.load(file)

        if not isinstance(results, list):
            raise HTTPException(
                status_code=500,
                detail="Invalid concept drift results format",
            )

        # Keep the API contract stable and numeric values frontend-friendly.
        normalized_results = []
        for item in results:
            normalized_results.append({
                "month": item.get("month", "Unknown"),
                "fraud_rate": float(item.get("fraud_rate", 0) or 0),
                "precision": float(item.get("precision", 0) or 0),
                "recall": float(item.get("recall", 0) or 0),
                "f1": float(item.get("f1", 0) or 0),
                "roc_auc": float(item.get("roc_auc", 0) or 0),
                "fpr": float(item.get("fpr", 0) or 0),
                "drift_score": float(item.get("drift_score", 0) or 0),
                "drift_status": item.get("drift_status", "UNKNOWN"),
                "f1_drop_from_baseline": float(
                    item.get("f1_drop_from_baseline", 0) or 0
                ),
                "retraining_recommended": bool(
                    item.get("retraining_recommended", False)
                ),
            })

        baseline = normalized_results[0] if normalized_results else None
        latest = normalized_results[-1] if normalized_results else None

        drift_detected_count = sum(
            item["drift_status"] == "DRIFT_DETECTED"
            for item in normalized_results
        )
        warning_count = sum(
            item["drift_status"] == "WARNING"
            for item in normalized_results
        )
        retraining_count = sum(
            item["retraining_recommended"]
            for item in normalized_results
        )

        return {
            "months": normalized_results,
            "baseline": baseline,
            "latest": latest,
            "total_months": len(normalized_results),
            "drift_detected_count": drift_detected_count,
            "warning_count": warning_count,
            "retraining_recommended_count": retraining_count,
            "overall_status": (
                "DRIFT_DETECTED"
                if drift_detected_count > 0
                else "WARNING"
                if warning_count > 0
                else "STABLE"
                if normalized_results
                else "NO_DATA"
            ),
            "last_updated": datetime.utcnow().isoformat() + "Z",
        }
    except HTTPException:
        raise
    except Exception as e:
        print(f"Error fetching concept drift results: {e}")
        raise HTTPException(
            status_code=500,
            detail=str(e),
        )


# ============================================================
# INVESTIGATION WORKFLOW API
# ============================================================


# ============================================================
# VALID VALUES
# ============================================================

INVESTIGATION_STATUSES = {
    "OPEN",
    "ASSIGNED",
    "INVESTIGATING",
    "CONFIRMED_FRAUD",
    "FALSE_POSITIVE",
    "RESOLVED",
}

INVESTIGATION_DECISIONS = {
    "CONFIRMED_FRAUD",
    "FALSE_POSITIVE",
}


# ============================================================
# CREATE INVESTIGATION
# ============================================================

@app.post("/api/investigations")
def create_investigation(
    investigation: InvestigationCreate
):

    try:

        # ----------------------------------------------------
        # CHECK WHETHER TRANSACTION EXISTS
        # ----------------------------------------------------

        transaction_res = (
            supabase
            .table("transactions")
            .select("transaction_id")
            .eq(
                "transaction_id",
                investigation.transaction_id
            )
            .limit(1)
            .execute()
        )

        if not transaction_res.data:

            raise HTTPException(
                status_code=404,
                detail="Transaction not found"
            )


        # ----------------------------------------------------
        # CHECK WHETHER INVESTIGATION ALREADY EXISTS
        # ----------------------------------------------------

        existing_res = (
            supabase
            .table("investigations")
            .select("*")
            .eq(
                "transaction_id",
                investigation.transaction_id
            )
            .limit(1)
            .execute()
        )

        if existing_res.data:

            return existing_res.data[0]


        # ----------------------------------------------------
        # GENERATE INVESTIGATION ID
        # ----------------------------------------------------

        investigation_id = (
            f"INV-{uuid.uuid4().hex[:8].upper()}"
        )


        # ----------------------------------------------------
        # CREATE RECORD
        # ----------------------------------------------------

        record = {

            "investigation_id":
                investigation_id,

            "transaction_id":
                investigation.transaction_id,

            "alert_id":
                investigation.alert_id,

            "status":
                "OPEN",

            "assigned_to":
                investigation.assigned_to,

            "investigator_notes":
                investigation.investigator_notes,

            "decision":
                None
        }


        # ----------------------------------------------------
        # SAVE TO SUPABASE
        # ----------------------------------------------------

        response = (
            supabase
            .table("investigations")
            .insert(record)
            .execute()
        )


        if not response.data:

            raise HTTPException(
                status_code=500,
                detail="Failed to create investigation"
            )


        return response.data[0]


    except HTTPException:

        raise


    except Exception as e:

        print(
            f"Error creating investigation: {e}"
        )

        raise HTTPException(
            status_code=500,
            detail=str(e)
        )


# ============================================================
# GET ALL INVESTIGATIONS
# ============================================================

@app.get("/api/investigations")
def get_investigations(

    limit: int = Query(
        100,
        ge=1,
        le=1000
    ),

    status: Optional[str] = None,

    assigned_to: Optional[str] = None
):

    try:

        query = (
            supabase
            .table("investigations")
            .select("*")
            .order(
                "created_at",
                desc=True
            )
        )


        # ----------------------------------------------------
        # STATUS FILTER
        # ----------------------------------------------------

        if (
            status
            and status.upper() != "ALL"
        ):

            status_value = status.upper()

            if status_value not in INVESTIGATION_STATUSES:

                raise HTTPException(
                    status_code=400,
                    detail=(
                        "Invalid investigation status. "
                        f"Allowed values: "
                        f"{', '.join(sorted(INVESTIGATION_STATUSES))}"
                    )
                )

            query = query.eq(
                "status",
                status_value
            )


        # ----------------------------------------------------
        # INVESTIGATOR FILTER
        # ----------------------------------------------------

        if assigned_to:

            query = query.eq(
                "assigned_to",
                assigned_to
            )


        # ----------------------------------------------------
        # LIMIT
        # ----------------------------------------------------

        query = query.limit(
            limit
        )


        response = query.execute()


        return response.data or []


    except HTTPException:

        raise


    except Exception as e:

        print(
            f"Error fetching investigations: {e}"
        )

        raise HTTPException(
            status_code=500,
            detail=str(e)
        )


# ============================================================
# GET SINGLE INVESTIGATION
# ============================================================

@app.get(
    "/api/investigations/{investigation_id}"
)
def get_investigation(
    investigation_id: str
):

    try:

        # ----------------------------------------------------
        # SEARCH BY INVESTIGATION ID
        # ----------------------------------------------------

        response = (
            supabase
            .table("investigations")
            .select("*")
            .eq(
                "investigation_id",
                investigation_id
            )
            .limit(1)
            .execute()
        )


        # ----------------------------------------------------
        # ALSO SUPPORT NUMERIC DATABASE ID
        # ----------------------------------------------------

        if (
            not response.data
            and investigation_id.isdigit()
        ):

            response = (
                supabase
                .table("investigations")
                .select("*")
                .eq(
                    "id",
                    int(investigation_id)
                )
                .limit(1)
                .execute()
            )


        if not response.data:

            raise HTTPException(
                status_code=404,
                detail="Investigation not found"
            )


        return response.data[0]


    except HTTPException:

        raise


    except Exception as e:

        print(
            f"Error fetching investigation "
            f"{investigation_id}: {e}"
        )

        raise HTTPException(
            status_code=500,
            detail=str(e)
        )


# ============================================================
# UPDATE INVESTIGATION
# ============================================================

@app.patch("/api/investigations/{investigation_id}")
def update_investigation(
    investigation_id: str,
    request: InvestigationUpdate,
):

    # ========================================================
    # FIND INVESTIGATION
    # ========================================================

    response = (
        supabase
        .table("investigations")
        .select("*")
        .eq("investigation_id", investigation_id)
        .limit(1)
        .execute()
    )

    rows = response.data or []

    # Numeric ID fallback
    if not rows and investigation_id.isdigit():

        response = (
            supabase
            .table("investigations")
            .select("*")
            .eq("id", int(investigation_id))
            .limit(1)
            .execute()
        )

        rows = response.data or []

    if not rows:
        raise HTTPException(
            status_code=404,
            detail="Investigation not found",
        )

    investigation = rows[0]


    # ========================================================
    # VALIDATE STATUS
    # ========================================================

    if request.status is not None:

        if request.status not in INVESTIGATION_STATUSES:

            raise HTTPException(
                status_code=400,
                detail=(
                    f"Invalid investigation status: "
                    f"{request.status}. "
                    f"Allowed values: "
                    f"{sorted(INVESTIGATION_STATUSES)}"
                ),
            )


    # ========================================================
    # VALIDATE DECISION
    # ========================================================

    if request.decision is not None:

        if request.decision not in INVESTIGATION_DECISIONS:

            raise HTTPException(
                status_code=400,
                detail=(
                    f"Invalid investigation decision: "
                    f"{request.decision}. "
                    f"Allowed values: "
                    f"{sorted(INVESTIGATION_DECISIONS)}"
                ),
            )


    # ========================================================
    # BUILD UPDATE
    # ========================================================

    update_data = {}

    if request.assigned_to is not None:
        update_data["assigned_to"] = request.assigned_to

    if request.investigator_notes is not None:
        update_data["investigator_notes"] = request.investigator_notes

    if request.decision is not None:
        update_data["decision"] = request.decision


    # ========================================================
    # STATUS HANDLING
    # ========================================================

    # IMPORTANT:
    # Explicit status always takes priority.

    if request.status is not None:

        update_data["status"] = request.status

    # If decision is supplied and no explicit status was supplied,
    # automatically update status based on decision.

    elif request.decision == "CONFIRMED_FRAUD":

        update_data["status"] = "CONFIRMED_FRAUD"

    elif request.decision == "FALSE_POSITIVE":

        update_data["status"] = "FALSE_POSITIVE"


    # ========================================================
    # RESOLVED TIMESTAMP
    # ========================================================

    final_status = update_data.get(
        "status",
        investigation.get("status"),
    )

    if final_status == "RESOLVED":

        if not investigation.get("resolved_at"):

            update_data["resolved_at"] = (
                datetime.utcnow().isoformat()
            )

    # If investigation is moved away from RESOLVED,
    # clear resolved_at.

    elif final_status != "RESOLVED":

        update_data["resolved_at"] = None


    # ========================================================
    # UPDATED TIMESTAMP
    # ========================================================

    update_data["updated_at"] = datetime.utcnow().isoformat()


    # ========================================================
    # UPDATE DATABASE
    # ========================================================

    updated_response = (
        supabase
        .table("investigations")
        .update(update_data)
        .eq("id", investigation["id"])
        .execute()
    )

    updated_rows = updated_response.data or []

    if not updated_rows:
        raise HTTPException(
            status_code=500,
            detail="Failed to update investigation",
        )


    # ========================================================
    # HUMAN-IN-THE-LOOP FEEDBACK
    # ========================================================
    #
    # Store every investigator decision separately so these
    # human labels can later be used for model evaluation,
    # monitoring, and future retraining.
    #
    if request.decision is not None:

        feedback_record = {
            "transaction_id": investigation["transaction_id"],
            "investigation_id": investigation["investigation_id"],
            "investigator_decision": request.decision,
            "notes": (
                request.investigator_notes
                if request.investigator_notes is not None
                else investigation.get("investigator_notes")
            ),
        }

        try:

            feedback_response = (
                supabase
                .table("investigation_feedback")
                .insert(feedback_record)
                .execute()
            )

            if feedback_response.data:
                print(
                    "Investigation feedback recorded:",
                    investigation["investigation_id"],
                    request.decision,
                )

        except Exception as e:
            err_str = str(e)
            if "PGRST205" in err_str or "investigation_feedback" in err_str:
                print(
                    f"Notice: 'investigation_feedback' table not yet present in Supabase. "
                    f"Decision '{request.decision}' preserved on investigation {investigation['investigation_id']}."
                )
            else:
                print(
                    f"Warning: Failed to insert secondary feedback record: {e}"
                )


    # ========================================================
    # RETURN UPDATED INVESTIGATION
    # ========================================================

    return updated_rows[0]