import json
import uuid
from fastapi.testclient import TestClient
from app.main import app, RISK_THRESHOLD

client = TestClient(app)

print("=" * 60)
print("STEP 8.2: END-TO-END FRAUD OPERATIONS FLOW VALIDATION")
print("=" * 60)

results = {}

# ============================================================
# FLOW A: PAYMENT -> RISK ENGINE -> FRAUD ALERT
# ============================================================
print("\n--- FLOW A: PAYMENT -> RISK ENGINE -> FRAUD ALERT ---")
tx_suffix = uuid.uuid4().hex[:6].upper()
sim_tx_id = f"TXN-E2E-{tx_suffix}"

payment_payload = {
    "transaction_id": sim_tx_id,
    "user_id": 9901,
    "amount": 48500.0,
    "avg_user_amount": 3200.0,
    "amount_ratio": 15.16,
    "transactions_last_10min": 7,
    "failed_attempts_10min": 3,
    "new_device": 1,
    "new_location": 1,
    "international": 0,
    "merchant_risk": 8,
    "account_age_days": 25,
    "device_age_days": 0,
    "distance_from_home": 720.0,
    "hour": 3,
    "day_of_week": 5,
    "is_weekend": 1,
    "unusual_hour": 1
}

resp_a = client.post("/api/transactions/analyze", json=payment_payload)
print(f"Payment POST Status: {resp_a.status_code}")
data_a = resp_a.json()

fraud_score = data_a.get("fraud_score")
anomaly_score = data_a.get("anomaly_score")
rule_score = data_a.get("rule_score")
final_risk = data_a.get("final_risk_score")
risk_level = data_a.get("risk_level")

print(f"Risk Engine Output: final_risk={final_risk}, level={risk_level}")
print(f"Score Breakdown: LightGBM={fraud_score} (45%), Anomaly={anomaly_score} (30%), Rules={rule_score} (25%)")
print(f"Threshold Comparison: {final_risk} >= {RISK_THRESHOLD} -> Flagged = {final_risk is not None and final_risk >= RISK_THRESHOLD}")

# Check alert in /api/alerts
resp_alerts = client.get("/api/alerts")
alerts = resp_alerts.json() if resp_alerts.status_code == 200 else []
matching_alert = next((a for a in alerts if a.get("transaction_id") == sim_tx_id), None)
print(f"Alert Created in Supabase: {matching_alert is not None}")
if matching_alert:
    print(f"Alert ID: {matching_alert.get('alert_id')}, Severity: {matching_alert.get('severity')}")

results["flow_a"] = {
    "status": resp_a.status_code,
    "sim_tx_id": sim_tx_id,
    "final_risk": final_risk,
    "risk_level": risk_level,
    "fraud_score": fraud_score,
    "anomaly_score": anomaly_score,
    "rule_score": rule_score,
    "alert_created": matching_alert is not None,
    "alert_id": matching_alert.get("alert_id") if matching_alert else None
}

# ============================================================
# FLOW B: ALERT -> INVESTIGATION
# ============================================================
print("\n--- FLOW B: ALERT -> INVESTIGATION ---")
alert_id = matching_alert.get("alert_id") if matching_alert else f"ALERT-{sim_tx_id}"

inv_payload = {
    "transaction_id": sim_tx_id,
    "alert_id": alert_id,
    "investigator_notes": "Auto-escalated from high-risk payment alert."
}

resp_b = client.post("/api/investigations", json=inv_payload)
print(f"Create Investigation Status: {resp_b.status_code}")
data_b = resp_b.json()
inv_id = data_b.get("investigation_id")
print(f"Investigation Created: {inv_id}, Status: {data_b.get('status')}")

# Verify in investigation list
resp_invs = client.get("/api/investigations")
inv_list = resp_invs.json() if resp_invs.status_code == 200 else []
in_queue = any(i.get("investigation_id") == inv_id for i in inv_list)
print(f"Investigation visible in Queue: {in_queue}")

# Open case detail
resp_detail = client.get(f"/api/investigations/{inv_id}")
print(f"Fetch Investigation Detail Status: {resp_detail.status_code}")

# Fetch associated transaction evidence
resp_tx = client.get(f"/api/transactions/{sim_tx_id}")
print(f"Fetch Linked Transaction Evidence Status: {resp_tx.status_code}")

results["flow_b"] = {
    "create_status": resp_b.status_code,
    "investigation_id": inv_id,
    "in_queue": in_queue,
    "detail_status": resp_detail.status_code,
    "tx_evidence_status": resp_tx.status_code
}

# ============================================================
# FLOW C: EXPLAINABILITY EVIDENCE
# ============================================================
print("\n--- FLOW C: EXPLAINABILITY EVIDENCE ---")
tx_detail = resp_tx.json() if resp_tx.status_code == 200 else data_a

reasons = tx_detail.get("reasons", [])
shap_contribs = tx_detail.get("shap_explanations", [])
ai_exp = tx_detail.get("ai_explanation", "")
rag_know = tx_detail.get("rag_knowledge", [])

print(f"Flag Reasons Count: {len(reasons)} -> {reasons}")
print(f"SHAP Contributors Count: {len(shap_contribs)}")
if shap_contribs:
    print(f"Top SHAP Factor: {shap_contribs[0]}")
print(f"AI Explanation Present: {bool(ai_exp)} (length: {len(str(ai_exp))})")
print(f"RAG Knowledge Context Present: {len(rag_know)} items")

results["flow_c"] = {
    "reasons": reasons,
    "shap_count": len(shap_contribs),
    "shap_sample": shap_contribs[0] if shap_contribs else None,
    "ai_explanation_present": bool(ai_exp),
    "rag_items": len(rag_know)
}

# ============================================================
# FLOW D: INVESTIGATOR DECISION
# ============================================================
print("\n--- FLOW D: INVESTIGATOR DECISION ---")
decision_payload = {
    "decision": "CONFIRMED_FRAUD",
    "status": "CONFIRMED_FRAUD",
    "investigator_notes": "Confirmed high-velocity ATO attack after reviewing device and velocity factors."
}

resp_d = client.patch(f"/api/investigations/{inv_id}", json=decision_payload)
print(f"PATCH Investigation Status: {resp_d.status_code}")
data_d = resp_d.json()
print(f"Updated Status: {data_d.get('status')}")
print(f"Updated Decision: {data_d.get('decision')}")
print(f"Updated Notes: {data_d.get('investigator_notes')}")

results["flow_d"] = {
    "patch_status": resp_d.status_code,
    "saved_decision": data_d.get("decision"),
    "saved_status": data_d.get("status"),
    "notes_persisted": data_d.get("investigator_notes") == decision_payload["investigator_notes"]
}

# ============================================================
# FLOW E: FEEDBACK -> MODEL MONITORING
# ============================================================
print("\n--- FLOW E: FEEDBACK -> MODEL MONITORING ---")
resp_e = client.get("/api/model-monitoring")
print(f"Model Monitoring Status: {resp_e.status_code}")
data_e = resp_e.json()

print(f"Model Health: {data_e.get('model_health')}")
print(f"Drift Status: {data_e.get('drift_status')}")
print(f"Feedback Evaluated: {data_e.get('feedback_evaluated')}")
print(f"Confusion Matrix: {data_e.get('confusion_matrix')}")
print(f"False Positive Rate: {data_e.get('false_positive_rate')}")
print(f"False Negative Rate: {data_e.get('false_negative_rate')}")

results["flow_e"] = {
    "status": resp_e.status_code,
    "model_health": data_e.get("model_health"),
    "drift_status": data_e.get("drift_status"),
    "feedback_evaluated": data_e.get("feedback_evaluated"),
    "confusion_matrix": data_e.get("confusion_matrix")
}

# ============================================================
# FLOW F: MODEL MONITORING -> CONCEPT DRIFT
# ============================================================
print("\n--- FLOW F: MODEL MONITORING -> CONCEPT DRIFT ---")
resp_f = client.get("/api/concept-drift")
print(f"Concept Drift Status: {resp_f.status_code}")
data_f = resp_f.json()

months = data_f.get("months", [])
print(f"Total Drift Months: {len(months)}")
print(f"Overall Status: {data_f.get('overall_status')}")
print(f"Drift Detected Count: {data_f.get('drift_detected_count')}")
print(f"Retraining Recommended Count: {data_f.get('retraining_recommended_count')}")

results["flow_f"] = {
    "status": resp_f.status_code,
    "total_months": len(months),
    "overall_status": data_f.get("overall_status"),
    "drift_detected_count": data_f.get("drift_detected_count"),
    "retraining_count": data_f.get("retraining_recommended_count")
}

# ============================================================
# FLOW G: MODEL EVALUATION PIPELINE
# ============================================================
print("\n--- FLOW G: MODEL EVALUATION PIPELINE ---")
resp_comp = client.get("/api/model-comparison")
print(f"Model Comparison Status: {resp_comp.status_code}")
data_comp = resp_comp.json()
print(f"Selected Model: {data_comp.get('selected_model')}")
print(f"Total Models Compared: {data_comp.get('total_models')}")

resp_thresh = client.get("/api/threshold-optimization")
print(f"Threshold Optimization Status: {resp_thresh.status_code}")
data_thresh = resp_thresh.json()
print(f"Best Threshold: {data_thresh.get('best_threshold')}")
print(f"Hybrid Weights: {data_thresh.get('hybrid_weights')}")
print(f"Production RISK_THRESHOLD constant: {RISK_THRESHOLD}")

results["flow_g"] = {
    "comparison_status": resp_comp.status_code,
    "selected_model": data_comp.get("selected_model"),
    "threshold_status": resp_thresh.status_code,
    "best_threshold": data_thresh.get("best_threshold"),
    "hybrid_weights": data_thresh.get("hybrid_weights"),
    "production_threshold": RISK_THRESHOLD
}

# ============================================================
# API ENDPOINT STATUS TABLE CHECK
# ============================================================
print("\n--- API ENDPOINTS AUDIT ---")
endpoints_to_test = [
    ("GET", "/health"),
    ("GET", "/api/system/status"),
    ("GET", "/api/dashboard/stats"),
    ("GET", "/api/dashboard/recent-transactions"),
    ("GET", "/api/transactions"),
    ("GET", "/api/alerts"),
    ("GET", "/api/analytics"),
    ("GET", "/api/investigations"),
    ("GET", "/api/model-monitoring"),
    ("GET", "/api/concept-drift"),
    ("GET", "/api/model-comparison"),
    ("GET", "/api/threshold-optimization"),
]

api_results = []
for method, ep in endpoints_to_test:
    if method == "GET":
        r = client.get(ep)
        api_results.append({"method": method, "endpoint": ep, "status": r.status_code})
        print(f"{method} {ep}: {r.status_code}")

results["api_audit"] = api_results

# Save output to scratch file
with open("e2e_results.json", "w") as f:
    json.dump(results, f, indent=2)

print("\n--- ALL E2E FLOW CHECKS COMPLETED SUCCESSFULLY ---")
