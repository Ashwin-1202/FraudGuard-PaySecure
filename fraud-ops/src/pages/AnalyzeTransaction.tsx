import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import TopBar from '../components/TopBar'
import Panel from '../components/Panel'
import TransactionForm from '../components/TransactionForm'
import TransactionHeader from '../components/TransactionHeader'
import RiskBreakdown from '../components/RiskBreakdown'
import ReasonsList from '../components/ReasonsList'
import ShapContributors from '../components/ShapContributors'
import InvestigatorSummary from '../components/InvestigatorSummary'
import { usePolling } from '../hooks/usePolling'
import { getSystemStatus } from '../api/system'
import { analyzeTransaction } from '../api/transactions'
import type { AnalyzeTransactionInput, Transaction } from '../types'

const EMPTY_FORM: AnalyzeTransactionInput = {
  transaction_id: '',
  user_id: '',
  amount: 0,
  average_user_amount: 0,
  transactions_last_10min: 0,
  failed_attempts_last_10min: 0,
  new_device: false,
  new_location: false,
  international: false,
  merchant_risk: 0,
  account_age_days: 0,
  device_age_days: 0,
  distance_from_home_km: 0,
  hour: new Date().getHours(),
  day_of_week: (new Date().getDay() + 6) % 7,
  is_weekend: [0, 6].includes(new Date().getDay()),
  unusual_hour: false,
}

function testTransaction(): AnalyzeTransactionInput {
  const suffix = Math.floor(1000 + Math.random() * 9000)
  return {
    transaction_id: `TXN-TEST-${suffix}`,
    user_id: `USR-${Math.floor(10000 + Math.random() * 89999)}`,
    amount: 45200,
    average_user_amount: 3800,
    transactions_last_10min: 6,
    failed_attempts_last_10min: 2,
    new_device: true,
    new_location: true,
    international: false,
    merchant_risk: 0.72,
    account_age_days: 41,
    device_age_days: 0,
    distance_from_home_km: 640,
    hour: 3,
    day_of_week: 5,
    is_weekend: true,
    unusual_hour: true,
  }
}

export default function AnalyzeTransaction() {
  const navigate = useNavigate()
  const status = usePolling(getSystemStatus, 20000)
  const [form, setForm] = useState<AnalyzeTransactionInput>(EMPTY_FORM)
  const [submitting, setSubmitting] = useState(false)
  const [result, setResult] = useState<Transaction | null>(null)
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit() {
    setSubmitting(true)
    setError(null)
    try {
      const tx = await analyzeTransaction(form)
      setResult(tx)
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : 'Unable to analyze transaction. Check that the backend is running on port 8000.'
      )
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="flex-1 flex flex-col min-h-0">
      <TopBar title="Analyze Transaction" subtitle="Manual transaction risk analysis" status={status.data} lastUpdated={null} isLive={false} />

      <div className="flex-1 overflow-y-auto scrollbar-thin p-3 sm:p-5">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-5 items-start">
          <Panel title="Transaction Input">
            <TransactionForm
              value={form}
              onChange={setForm}
              onSubmit={handleSubmit}
              onLoadTest={() => setForm(testTransaction())}
              onClear={() => {
                setForm(EMPTY_FORM)
                setResult(null)
                setError(null)
              }}
              submitting={submitting}
            />
          </Panel>

          <div className="space-y-5">
            {error && (
              <Panel>
                <p className="text-[12.5px] font-medium text-[var(--color-risk-critical)] mb-1">Unable to analyze transaction.</p>
                <p className="text-[12px] text-[var(--color-ink-500)]">{error}</p>
              </Panel>
            )}

            {submitting && !result && (
              <Panel>
                <p className="text-[12.5px] text-[var(--color-ink-500)]">Analyzing transaction…</p>
              </Panel>
            )}

            {!submitting && !error && !result && (
              <Panel>
                <p className="text-[12.5px] text-[var(--color-ink-400)]">
                  Submit a transaction to see the investigation result here.
                </p>
              </Panel>
            )}

            {result && (
              <>
                <TransactionHeader tx={result} />

                <Panel title="Detection Signals">
                  <RiskBreakdown tx={result} />
                </Panel>

                <Panel title="Why This Transaction Was Flagged">
                  <ReasonsList reasons={result.reasons} />
                </Panel>

                <Panel title="Model Explanation">
                  <ShapContributors contributors={result.shap_explanations ?? []} />
                </Panel>

                <Panel title="Investigator Summary">
                  <InvestigatorSummary explanation={result.ai_explanation} />
                </Panel>

                <div className="flex justify-end">
                  <button
                    onClick={() => navigate(`/transactions/${encodeURIComponent(result.transaction_id)}`)}
                    className="text-[11.5px] font-medium px-3 py-1.5 rounded-[3px] border border-[var(--color-accent-500)] text-[var(--color-accent-600)] hover:bg-[var(--color-accent-100)]"
                  >
                    Open full investigation record →
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
