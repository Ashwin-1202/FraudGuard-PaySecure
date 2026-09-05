# PaySecure Bank — FraudGuard Banking Demo

Separate, original banking UI that sends payments into the existing FraudGuard FastAPI pipeline.

## Existing implementation
- `backend/app/main.py`: FastAPI transaction analysis + persistence + alerts
- `backend/app/schemas.py`: existing `TransactionRequest`
- `backend/risk_engine.py`: fraud model + anomaly model + business rules + final risk
- `backend/xai_explainer.py`: SHAP/RAG/Groq explanation path
- Existing Supabase `transactions` and `alerts`
- Existing `fraud-ops` operations dashboard

## New components
- `banking-app/`: React/Vite sender/receiver UI
- `/api/banking/analyze`: thin adapter; it calls the existing `analyze_transaction()` path
- `/api/banking/transactions/{user_id}`: reads the SAME `transactions` table
- `supabase_banking_demo.sql`: adds only sender/receiver metadata columns to the existing table

No second transaction table is created.

## Demo limitation
Authentication, balances and beneficiaries are fictional **Hackathon Demo Mode** data. This is not production banking authentication or a real banking ledger. Fraud decisions are not hard-coded in the UI.

## Setup

### Database
Run `supabase_banking_demo.sql` in the existing Supabase project.

### Backend
Use the repository's existing Python environment and dependencies. Start from `backend/`, for example:

```powershell
uvicorn app.main:app --reload --host 127.0.0.1 --port 8000
```

The existing backend still needs its existing environment values, especially `SUPABASE_URL` and `SUPABASE_KEY`.

### Banking app
From `banking-app/`:

```powershell
npm install
copy .env.example .env
npm run dev
```

Default port: `5174`.

`.env`:
```env
VITE_API_BASE_URL=http://127.0.0.1:8000
```

### FraudGuard operations app
From `fraud-ops/`:

```powershell
npm install
copy .env.example .env
npm run dev
```

## Demo accounts
All use demo PIN `1234`:
- `ashwin` — sender — `XXXX XXXX 1001`
- `rahul` — receiver — `XXXX XXXX 4821`
- `priya` — receiver — `XXXX XXXX 7316`

## Demo flow
1. Login as Ashwin.
2. Send money → Rahul → Normal payment → ₹500.
3. Confirm & pay.
4. Banking app calls `/api/banking/analyze`.
5. Adapter maps fields to the existing `TransactionRequest`.
6. Existing FraudGuard risk engine, SHAP/XAI, Supabase persistence and alert logic run.
7. Search the `TXN-BANK-...` ID in FraudGuard Operations → Transactions.
8. Login as Rahul and open Transactions to see the same stored transaction.

For the suspicious demo, choose **Suspicious payment** and use ₹8,500+. The frontend supplies demo/simulated values for supported risk features (new device/location, international, velocity, merchant risk, distance, failed attempts and unusual hour). The existing model/rules determine the actual result.

## Security
No Supabase service key, Groq key, database credential or model file is placed in the React app. The browser talks to FastAPI only.

## Production recommendations
Use real identity/authentication, server-side authorization, an auditable transactional ledger, idempotency keys, secure balance updates, trusted device/location telemetry, rate limiting, TLS, secrets management and regulated payment/UPI integration. These are recommendations, not current functionality.
