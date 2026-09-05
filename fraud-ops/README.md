# Transaction Risk Console

A fraud operations dashboard for the Real-Time Payments Fraud Detection backend. Built to feel like an
internal bank operations tool — dense tables, restrained status colors, no decorative UI — not a generic
AI dashboard template.

## Requirements

- Node.js 18+
- Your FastAPI fraud detection backend running locally on `http://127.0.0.1:8000`

## Setup

```bash
npm install
npm run dev
```

The app opens at `http://localhost:5173` and talks to the backend at the URL configured in `.env`
(`VITE_API_BASE_URL`, defaults to `http://127.0.0.1:8000`). Change that value if your backend runs
elsewhere, then restart `npm run dev`.

Make sure your FastAPI backend has CORS enabled for `http://localhost:5173`, e.g.:

```python
from fastapi.middleware.cors import CORSMiddleware

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_methods=["*"],
    allow_headers=["*"],
)
```

## What's inside

- **Overview** — live summary strip (transactions today, high risk, critical, open alerts), live
  transaction activity table, risk distribution, recent risk-score trend. All values come directly from
  `GET /api/dashboard/stats` and `GET /api/dashboard/recent-transactions`.
- **Transactions** — full transaction table backed by `GET /api/transactions`, with server-side search
  (`?search=`) and risk-level filtering (`?risk_level=`), plus pagination. Click any row to open the
  investigation view.
- **Transaction detail** (`/transactions/:id`) — case-file layout: transaction details, risk breakdown
  (horizontal meters, not gauges), model explanation (SHAP, split into increased/reduced risk), business
  rule reasons, AI investigator summary, alert status, and investigation timeline — all from
  `GET /api/transactions/{id}`.
- **Alerts** — alert queue from `GET /api/alerts` with Acknowledge / Resolve actions wired to the
  corresponding `PATCH` endpoints; the row refreshes after each action.
- **Analytics** — portfolio-level reporting from `GET /api/analytics`: fraud rate, average risk score,
  distributions, volume, top fraud indicators, and top SHAP features.
- **Analyze Transaction** — the manual transaction analyzer. Fill in payment, behaviour, device/location,
  merchant, account, and time details (or click "Load Test Transaction" for realistic sample values), then
  submit to `POST /api/transactions/analyze`. The result renders as a full investigation view. Because the
  backend persists analyzed transactions, they also appear back in the Transactions list.
- **System Status** — raw connectivity for Kafka, Risk Engine, AI/XAI, and Supabase from
  `GET /api/system/status`. No state is ever faked — an unreachable backend shows explicit error states,
  not placeholder data.

## Project structure

```
src/
  api/          Backend API client + one module per resource (transactions, alerts, dashboard, analytics, system)
  components/   Reusable UI building blocks (tables, risk meter, SHAP view, form controls, layout shell)
  pages/        One file per screen, composed from components + api hooks
  lib/          Formatting, risk-level styling, backend response normalization
  hooks/        usePolling — periodic refresh against REST endpoints for the "live" feel
  types/        Shared TypeScript types matching the backend's risk engine output
```

## Notes on data integrity

Every risk score, probability, SHAP value, reason, and AI explanation shown in the UI comes directly from
backend responses. Nothing is computed or invented on the frontend. If the backend has no data for a
screen, the UI shows an explicit empty state (e.g. "No transactions recorded yet.", "No open fraud
alerts.") rather than fabricating placeholder rows.
