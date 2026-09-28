# FraudGuard AI × PaySecure Bank

**Real-time payments fraud detection, with a realistic banking app and a fraud-operations console built on top of it.**

FraudGuard AI scores every payment in real time using a LightGBM fraud classifier, an Isolation Forest anomaly model, and a business-rule engine, then explains each decision with SHAP, retrieval-augmented context, and an LLM-written investigation summary. Two React front ends sit on the same FastAPI backend and the same Supabase transaction store:

| App | Audience | Purpose |
|---|---|---|
| **PaySecure Bank** (`banking-app/`) | Customers | A banking UI: send money, view transactions, see each payment's fraud assessment |
| **Transaction Risk Console** (`fraud-ops/`) | Fraud analysts | Alert queue, investigation views, analytics, model monitoring, system status |

> **Design principle:** the backend is the single source of truth. Neither front end computes or fakes a risk score, fraud probability, reason, or AI explanation. Everything displayed comes from the API response.

---

## Table of contents

- [Architecture](#architecture)
- [Tech stack](#tech-stack)
- [Features](#features)
- [Fraud detection pipeline](#fraud-detection-pipeline)
- [Repository structure](#repository-structure)
- [Getting started](#getting-started)
- [Demo accounts and walkthrough](#demo-accounts-and-walkthrough)
- [API overview](#api-overview)
- [Model details](#model-details)
- [Security notes](#security-notes)
- [Limitations](#limitations)
- [Team](#team)

---

## Architecture

```
 ┌───────────────────┐        ┌────────────────────┐
 │  PaySecure Bank   │        │ Transaction Risk   │
 │  (banking-app)    │        │ Console (fraud-ops)│
 │  React + Vite     │        │ React + TS + Vite  │
 └─────────┬─────────┘        └──────────┬─────────┘
           │        HTTP / Axios         │
           └──────────────┬──────────────┘
                          ▼
                 ┌─────────────────┐
                 │  FastAPI backend │
                 │  (backend/app)   │
                 └───┬─────────┬───┘
                     │         │
        ┌────────────▼──┐   ┌──▼─────────────────────────┐
        │ Risk engine   │   │ Supabase (PostgreSQL)      │
        │ LightGBM      │   │ transactions, alerts,      │
        │ Isolation For.│   │ investigations             │
        │ Rules + SHAP  │   └────────────────────────────┘
        │ RAG + Groq LLM│
        └───────────────┘

 Kafka topic "transactions" ──► fraud_consumer.py (group: fraud-detection-group)
 transaction_simulator.py publishes synthetic transactions to the same topic
```

## Tech stack

**Frontend**
- PaySecure Bank: React 19, Vite, React Router, Axios, CSS
- Fraud Ops console: React 19, TypeScript, Vite, React Router, Axios, Recharts, Tailwind CSS, date-fns

**Backend**
- Python, FastAPI, Pydantic
- Supabase Python client (PostgreSQL)
- LightGBM, scikit-learn (Isolation Forest), XGBoost (comparison experiments), SHAP
- sentence-transformers (semantic RAG over a fraud knowledge base)
- Groq API for LLM investigation summaries

**Streaming**
- Apache Kafka: topic `transactions`, consumer group `fraud-detection-group`

## Features

### PaySecure Bank
- Login with demo customer accounts, role-aware navigation (sender vs. receiver)
- Send-money flow: recipient, amount, note, and a transaction scenario
- Real-time analysis screen, then a result screen showing the backend's risk level, fraud probability, and final risk score
- Transaction history with money sent / received, risk pills, and status
- Every payment is stored in the shared Supabase `transactions` table, so the same record appears in the Fraud Ops console

### Transaction Risk Console (Fraud Ops)
- **Overview:** live summary strip, recent activity, risk distribution, risk-score trend
- **Transactions:** searchable, filterable, paginated table with a case-file detail view (risk breakdown, SHAP, rule reasons, AI summary, alert status, timeline)
- **Alerts:** queue with Acknowledge / Resolve actions
- **Analytics:** fraud rate, distributions, top fraud indicators, top SHAP features
- **Analyze Transaction:** manual analyzer that posts to the same scoring endpoint
- **System Status:** live Kafka / risk engine / AI-XAI / Supabase connectivity

## Fraud detection pipeline

For every transaction, the backend:

1. **Validates** the payload (`TransactionRequest`, Pydantic).
2. **Scores** it with the LightGBM fraud model, which yields a fraud probability from 24 features, including engineered behavioral interactions such as amount × velocity and merchant risk × distance.
3. **Detects anomalies** with an Isolation Forest.
4. **Applies business rules** (amount ratio, velocity, new device/location, international, merchant risk, distance from home, failed attempts, unusual hour, and combined patterns), each contributing to a rule score and a list of human-readable reasons.
5. **Combines** the model, anomaly, and rule signals into a `final_risk_score` (0-100) and a `risk_level`: `LOW`, `MEDIUM`, `HIGH`, or `CRITICAL`.
6. **Explains** the decision with SHAP feature contributions, retrieved fraud-knowledge passages, and an LLM-generated investigation summary. If the LLM call fails, the explanation falls back gracefully.
7. **Persists** the transaction to Supabase and raises an alert when the risk threshold is met.

## Repository structure

```
.
├── backend/
│   ├── app/
│   │   ├── main.py                # FastAPI routes
│   │   └── schemas.py             # Pydantic request models
│   ├── risk_engine.py             # Model + anomaly + rules + final risk
│   ├── xai_explainer.py           # SHAP + RAG + Groq explanation
│   ├── rag_retriever.py / rag_semantic.py
│   ├── database.py                # Supabase client
│   ├── fraud_consumer.py          # Kafka consumer
│   ├── transaction_simulator.py   # Kafka producer of synthetic transactions
│   ├── train_*.py                 # Model training scripts
│   ├── ablation_study.py, model_comparison.py,
│   │   threshold_optimization.py, concept_drift.py   # Experiments
│   ├── models/                    # Trained .joblib models + metadata
│   ├── data/                      # Dataset and fraud knowledge base
│   └── experiments/               # Experiment result files
├── banking-app/                   # PaySecure Bank (React + Vite)
│   └── supabase_banking_demo.sql  # Adds banking metadata columns
└── fraud-ops/                     # Transaction Risk Console (React + TS)
```

## Getting started

### Prerequisites
- Python 3.10+
- Node.js 18+
- A Supabase project with `transactions` and `alerts` tables
- A Groq API key (for AI explanations)
- Apache Kafka running on `localhost:9092` (only needed for the streaming simulator/consumer, not for the two web apps)

### 1. Backend

```bash
cd backend
python -m venv venv
source venv/bin/activate          # Windows: venv\Scripts\activate

pip install fastapi uvicorn pydantic python-dotenv supabase \
            lightgbm xgboost scikit-learn shap joblib numpy pandas \
            sentence-transformers groq kafka-python
```

Create `backend/.env`:

```env
SUPABASE_URL=your-supabase-project-url
SUPABASE_KEY=your-supabase-key
GROQ_API_KEY=your-groq-api-key
```

Start the API:

```bash
uvicorn app.main:app --reload --host 127.0.0.1 --port 8000
```

Interactive docs are available at `http://127.0.0.1:8000/docs`.

### 2. Database

Run `banking-app/supabase_banking_demo.sql` in the Supabase SQL editor. It adds the sender/receiver metadata columns to the **existing** `transactions` table. No second transaction table is created.

### 3. PaySecure Bank

```bash
cd banking-app
npm install
cp .env.example .env              # Windows: copy .env.example .env
npm run dev                       # http://localhost:5174
```

### 4. Fraud Ops console

```bash
cd fraud-ops
npm install
cp .env.example .env
npm run dev                       # http://localhost:5173
```

Both `.env` files use:

```env
VITE_API_BASE_URL=http://127.0.0.1:8000
```

### 5. Optional: Kafka streaming

```bash
cd backend
python fraud_consumer.py          # consumes topic "transactions"
python transaction_simulator.py   # publishes synthetic transactions
```

## Demo accounts and walkthrough

All demo accounts use PIN **`1234`**.

| User | Login | Role | Account |
|---|---|---|---|
| Ashwin | `ashwin` | Sender | `XXXX XXXX 1001` |
| Rahul | `rahul` | Receiver | `XXXX XXXX 4821` |
| Priya | `priya` | Receiver | `XXXX XXXX 7316` |

**Normal payment**
1. Log in as `ashwin` and open **Send Money**.
2. Choose Rahul, pick the normal scenario, enter a small amount (for example ₹500), and confirm.
3. The backend returns a low-risk result, and the result screen shows the real probability and score.

**Suspicious payment**
1. Repeat with a suspicious/high-risk scenario and a large amount.
2. The scenario only changes the *input signals* sent to the backend (new device/location, velocity, merchant risk, and so on). The risk engine decides the outcome.

**Cross-app check**
1. Copy the `TXN-BANK-...` transaction ID from the result screen.
2. Search for it in the Fraud Ops console under **Transactions** to see the full investigation view.
3. Log in as `rahul` in the banking app to see the same transaction from the receiver's side.

## API overview

Base URL: `http://127.0.0.1:8000`

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/health` | Health check |
| `GET` | `/api/system/status` | Kafka, risk engine, AI/XAI, Supabase status |
| `POST` | `/api/transactions/analyze` | Score, explain, and persist a transaction |
| `GET` | `/api/transactions` | List transactions (search and risk-level filters) |
| `GET` | `/api/transactions/{id}` | Full transaction detail with alert info |
| `GET` / `PATCH` | `/api/alerts…` | Alert queue and Acknowledge / Resolve actions |
| `GET` | `/api/dashboard/…` | Overview stats and recent transactions |
| `GET` | `/api/analytics` | Portfolio-level analytics |
| `GET` | `/api/model-monitoring` | Model monitoring |
| `GET` | `/api/model-comparison` | Model comparison results |
| `GET` | `/api/threshold-optimization` | Threshold optimization results |
| `GET` | `/api/concept-drift` | Concept drift results |
| `POST` / `GET` / `PATCH` | `/api/investigations…` | Investigation workflow |

**Example response fields** from `POST /api/transactions/analyze`:
`transaction_id`, `fraud_probability`, `fraud_score`, `anomaly_score`, `rule_score`, `final_risk_score`, `risk_level`, `reasons`, `ai_explanation`, `shap_explanations`, `rag_knowledge`.

## Model details

Primary fraud model: **LightGBM** (`LGBMClassifier`), trained on a synthetic dataset of 50,000 transactions (15% fraud) with 24 features.

| Metric | Value |
|---|---|
| Precision | 0.6194 |
| Recall | 0.8680 |
| F1 score | 0.7229 |
| ROC-AUC | 0.9542 |
| Decision threshold | 0.5 |

Recall is favored over precision on purpose, since missed fraud is costlier than an extra review. The `backend/experiments/` folder holds ablation, model-comparison, threshold-optimization, and concept-drift results.

## Security notes

- The React apps talk only to FastAPI. No Supabase key, Groq key, or model file is shipped to the browser.
- Secrets live in `backend/.env`, which is git-ignored.
- Never commit `.env` files or real API keys.

## Limitations

This is a hackathon demonstration, not production banking software.

- Authentication, balances, and beneficiaries in PaySecure Bank are fictional demo data (Hackathon Demo Mode), not real identity or a real ledger.
- The training data is synthetic.
- Device, location, and velocity signals in the banking demo are supplied by scenario presets rather than real telemetry.
- The live views refresh via periodic polling, not WebSockets.

A production system would need real identity and authorization, an auditable transactional ledger, idempotency keys, trusted device/location telemetry, rate limiting, TLS, secrets management, and regulated payment integration.

## Team

Built by **Team Maverick Minds**.

<!-- Add member names, GitHub links, and screenshots here -->
