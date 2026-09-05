import { useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import TopBar from '../components/TopBar'
import Panel from '../components/Panel'
import RiskBadge from '../components/RiskBadge'
import RiskScoreHero from '../components/RiskScoreHero'
import ShapContributionChart from '../components/ShapContributionChart'
import RagKnowledgeSection from '../components/RagKnowledgeSection'
import MarkdownRenderer from '../components/MarkdownRenderer'
import InvestigationTimeline from '../components/InvestigationTimeline'
import { ErrorState } from '../components/EmptyState'
import { SkeletonCard } from '../components/SkeletonLoader'
import { useToast } from '../components/ToastContext'
import { usePolling } from '../hooks/usePolling'
import { getTransaction } from '../api/transactions'
import { createInvestigation, listInvestigations } from '../api/investigations'
import { getSystemStatus } from '../api/system'
import { formatCurrency, formatDateTime } from '../lib/format'
import type { Transaction } from '../types'

export default function TransactionDetail() {
  const { id = '' } = useParams()
  const navigate = useNavigate()
  const { showToast } = useToast()

  const [creatingInv, setCreatingInv] = useState(false)

  const status = usePolling(getSystemStatus, 20000)
  const tx = usePolling(() => getTransaction(id), 8000, [id])
  const investigations = usePolling(() => listInvestigations({ limit: 100 }), 10000)

  const transaction: Transaction | null = tx.data

  // Check if an investigation exists for this transaction
  const existingInv = (investigations.data || []).find(
    (inv) => inv.transaction_id === id || inv.transaction_id === transaction?.transaction_id
  )

  const handleCreateInvestigation = async () => {
    if (!transaction) return
    setCreatingInv(true)
    try {
      const newInv = await createInvestigation({
        transaction_id: transaction.transaction_id,
        alert_id: transaction.alert_id,
        investigator_notes: `Investigation initiated from Transaction Detail view. Risk Score: ${transaction.final_risk_score?.toFixed(1) ?? 'N/A'}`,
      })
      showToast(`Investigation ${newInv.investigation_id} created successfully!`, 'success')
      await investigations.refresh()
      navigate(`/investigations/${encodeURIComponent(newInv.investigation_id)}`)
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Failed to create investigation.', 'error')
    } finally {
      setCreatingInv(false)
    }
  }

  // Extract raw string for AI explanation markdown renderer
  const aiMarkdown = transaction?.ai_explanation
    ? typeof transaction.ai_explanation === 'string'
      ? transaction.ai_explanation
      : transaction.ai_explanation.raw ||
        [
          transaction.ai_explanation.risk_explanation && `### Risk Explanation\n${transaction.ai_explanation.risk_explanation}`,
          transaction.ai_explanation.top_contributing_factors?.length &&
            `### Top Contributing Factors\n${transaction.ai_explanation.top_contributing_factors.map((f) => `- ${f}`).join('\n')}`,
          transaction.ai_explanation.investigation_recommendation &&
            `### Investigation Recommendation\n${transaction.ai_explanation.investigation_recommendation}`,
        ]
          .filter(Boolean)
          .join('\n\n')
    : null

  return (
    <div className="flex-1 flex flex-col min-h-0">
      <TopBar
        title="Transaction Investigation Detail"
        subtitle={id}
        status={status.data}
        lastUpdated={tx.lastUpdated}
        onRefresh={() => {
          tx.refresh()
          investigations.refresh()
        }}
      />

      <div className="flex-1 overflow-y-auto scrollbar-thin p-3 sm:p-5 space-y-4 sm:space-y-5">
        {tx.error && !transaction && <ErrorState message={tx.error} onRetry={tx.refresh} />}

        {tx.loading && !transaction && (
          <div className="space-y-4">
            <SkeletonCard height={100} />
            <SkeletonCard height={200} />
            <SkeletonCard height={300} />
          </div>
        )}

        {transaction && (
          <>
            {/* HEADER WITH RISK BADGE & ACTIONS */}
            <div className="border border-[var(--color-line-100)] bg-[var(--color-surface-1)] rounded-[3px] p-4 sm:p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div>
                <div className="flex items-center gap-2 text-[10.5px] uppercase tracking-wider text-[var(--color-ink-400)] font-medium mb-1">
                  <span>Transaction Overview</span>
                  <span>•</span>
                  <span>{formatDateTime(transaction.timestamp)}</span>
                </div>
                <div className="flex items-center gap-3 flex-wrap">
                  <span className="font-mono text-[18px] sm:text-[20px] font-bold text-[var(--color-ink-900)]">
                    {transaction.transaction_id}
                  </span>
                  <RiskBadge level={transaction.risk_level} size="md" />
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-2.5 flex-wrap self-end sm:self-auto">
                <button
                  onClick={() => navigate('/transactions')}
                  className="px-3 py-1.5 rounded-[3px] border border-[var(--color-line-200)] text-[11.5px] font-medium text-[var(--color-ink-700)] hover:bg-[var(--color-surface-2)] transition-colors"
                >
                  ← Back to Monitor
                </button>

                {existingInv ? (
                  <button
                    onClick={() => navigate(`/investigations/${encodeURIComponent(existingInv.investigation_id)}`)}
                    className="px-3.5 py-1.5 rounded-[3px] bg-[var(--color-accent-600)] text-white text-[11.5px] font-semibold hover:bg-[var(--color-accent-500)] transition-colors flex items-center gap-1.5 shadow-xs"
                  >
                    <span>View Case ({existingInv.investigation_id})</span>
                    <span>→</span>
                  </button>
                ) : (
                  <button
                    onClick={handleCreateInvestigation}
                    disabled={creatingInv}
                    className="px-3.5 py-1.5 rounded-[3px] bg-[var(--color-ink-900)] text-white text-[11.5px] font-semibold hover:bg-[var(--color-ink-700)] transition-colors flex items-center gap-1.5 shadow-xs disabled:opacity-50"
                  >
                    {creatingInv ? 'Creating Case…' : '+ Create Investigation'}
                  </button>
                )}
              </div>
            </div>

            {/* SECTION A — TRANSACTION OVERVIEW */}
            <Panel title="Section A: Transaction Information Grid" subtitle="Observed payload attributes and behavioral context">
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 sm:gap-4 text-[12px]">
                <InfoCell label="Amount" value={formatCurrency(transaction.amount, transaction.currency)} isBold />
                <InfoCell label="User ID" value={transaction.user_id} isMono />
                <InfoCell label="Average User Amount" value={transaction.average_user_amount ? formatCurrency(transaction.average_user_amount, transaction.currency) : '—'} />
                <InfoCell
                  label="Amount vs Average Ratio"
                  value={
                    transaction.amount_ratio !== undefined
                      ? `${transaction.amount_ratio.toFixed(2)}x normal`
                      : transaction.average_user_amount
                      ? `${(transaction.amount / transaction.average_user_amount).toFixed(2)}x normal`
                      : '—'
                  }
                />
                <InfoCell label="Distance From Home" value={transaction.distance_from_home_km !== undefined ? `${transaction.distance_from_home_km} km` : '—'} />

                <InfoCell label="Merchant Risk Tier" value={transaction.merchant_risk !== undefined ? `${transaction.merchant_risk.toFixed(1)} / 10` : '—'} />
                <InfoCell label="Account Age" value={transaction.account_age_days !== undefined ? `${transaction.account_age_days} days` : '—'} />
                <InfoCell label="Device Age" value={transaction.device_age_days !== undefined ? `${transaction.device_age_days} days` : '—'} />
                <InfoCell
                  label="Velocity (Last 10m)"
                  value={transaction.transactions_last_10min !== undefined ? `${transaction.transactions_last_10min} txns` : '—'}
                  alert={Boolean(transaction.transactions_last_10min && transaction.transactions_last_10min > 3)}
                />
                <InfoCell
                  label="Failed Attempts (10m)"
                  value={transaction.failed_attempts_last_10min !== undefined ? `${transaction.failed_attempts_last_10min} attempts` : '—'}
                  alert={Boolean(transaction.failed_attempts_last_10min && transaction.failed_attempts_last_10min > 0)}
                />

                {/* Booleans with Yes/No visual badges */}
                <BooleanCell label="New Device" active={transaction.new_device} />
                <BooleanCell label="New Location" active={transaction.new_location} />
                <BooleanCell label="International" active={transaction.international} />
                <BooleanCell label="Unusual Hour" active={transaction.unusual_hour} />
                <BooleanCell label="Weekend Execution" active={transaction.is_weekend} />
              </div>
            </Panel>

            {/* SECTION B — RISK ANALYSIS */}
            <Panel title="Section B: Risk Analysis & Component Scores" subtitle="Composite risk scoring model breakdown">
              <RiskScoreHero tx={transaction} />
            </Panel>

            {/* SECTION C — WHY WAS THIS FLAGGED? */}
            <Panel
              title="Section C: Why Was This Flagged?"
              subtitle="Deterministic policy triggers and behavioral anomalies identified by risk rules"
            >
              {transaction.reasons && transaction.reasons.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  {transaction.reasons.map((r, i) => (
                    <div
                      key={i}
                      className="flex items-start gap-2.5 p-3 rounded-[3px] border border-[var(--color-risk-high-line)] bg-[var(--color-risk-high-bg)] text-[var(--color-risk-high)] text-[12px] font-medium"
                    >
                      <span className="text-[14px] leading-none shrink-0 mt-0.5">⚠</span>
                      <span className="leading-snug">{r}</span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-[12px] text-[var(--color-ink-400)] italic">
                  No explicit policy rule violations were triggered. Fraud risk is primarily governed by ML pattern recognition.
                </p>
              )}
            </Panel>

            {/* SECTION D — AI FRAUD EXPLANATION */}
            <Panel
              title="Section D: AI Investigation Analysis"
              subtitle="Autonomous synthesis of model evidence, heuristics, and domain knowledge"
              action={
                <span className="text-[10px] uppercase font-semibold tracking-wider text-[var(--color-ink-400)] bg-[var(--color-surface-2)] px-2 py-0.5 rounded-[2px]">
                  Groq LLM + SHAP Evidence
                </span>
              }
            >
              <div className="space-y-3">
                <div className="p-2 rounded-[2px] bg-[var(--color-surface-2)] text-[11px] text-[var(--color-ink-500)] flex items-center justify-between border border-[var(--color-line-100)]">
                  <span>
                    ℹ AI-generated explanation based on model signals and fraud intelligence. Model outputs assist investigator decision-making; final adjudication remains human-governed.
                  </span>
                </div>

                {aiMarkdown ? (
                  <div className="p-4 rounded-[3px] border border-[var(--color-line-100)] bg-[var(--color-surface-1)]">
                    <MarkdownRenderer content={aiMarkdown} />
                  </div>
                ) : (
                  <p className="text-[12px] text-[var(--color-ink-400)] italic py-4 text-center">
                    AI explanation not available for this transaction.
                  </p>
                )}
              </div>
            </Panel>

            {/* SECTION E — SHAP EXPLAINABILITY */}
            <Panel
              title="Section E: SHAP Model Contribution Analysis"
              subtitle="Additive feature attribution showing how each attribute influenced the fraud probability score"
            >
              <ShapContributionChart contributors={transaction.shap_explanations} />
            </Panel>

            {/* SECTION F — FRAUD INTELLIGENCE / RAG KNOWLEDGE */}
            <Panel
              title="Section F: Fraud Intelligence & Domain Knowledge (RAG)"
              subtitle="Semantically retrieved mitigation guidelines and attack vector definitions"
            >
              <RagKnowledgeSection items={transaction.rag_knowledge} />
            </Panel>

            {/* ALERT STATUS & INVESTIGATION TIMELINE */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-5">
              <Panel title="Alert Status & Case Connection">
                {transaction.alert_id ? (
                  <div className="space-y-2.5 text-[12px]">
                    <div className="flex justify-between border-b border-[var(--color-line-100)] pb-2">
                      <span className="text-[var(--color-ink-500)]">Linked Alert ID</span>
                      <span className="font-mono font-medium text-[var(--color-ink-900)]">
                        {transaction.alert_id}
                      </span>
                    </div>
                    <div className="flex justify-between border-b border-[var(--color-line-100)] pb-2">
                      <span className="text-[var(--color-ink-500)]">Alert Triage Status</span>
                      <span className="font-semibold text-[var(--color-risk-critical)]">
                        {transaction.alert_status || 'OPEN'}
                      </span>
                    </div>
                    <div className="flex justify-between items-center pt-1">
                      <span className="text-[var(--color-ink-500)]">Investigation Case</span>
                      {existingInv ? (
                        <button
                          onClick={() => navigate(`/investigations/${encodeURIComponent(existingInv.investigation_id)}`)}
                          className="text-[11.5px] font-semibold text-[var(--color-accent-600)] hover:underline"
                        >
                          {existingInv.investigation_id} ({existingInv.status}) →
                        </button>
                      ) : (
                        <button
                          onClick={handleCreateInvestigation}
                          disabled={creatingInv}
                          className="text-[11.5px] font-semibold text-[var(--color-accent-600)] hover:underline"
                        >
                          + Create Case
                        </button>
                      )}
                    </div>
                  </div>
                ) : (
                  <p className="text-[12px] text-[var(--color-ink-400)]">
                    No high-priority alert was raised for this transaction.
                  </p>
                )}
              </Panel>

              <Panel title="Investigation & Scoring Lifecycle">
                <InvestigationTimeline timeline={transaction.timeline} />
              </Panel>
            </div>
          </>
        )}
      </div>
    </div>
  )
}

function InfoCell({
  label,
  value,
  isBold,
  isMono,
  alert,
}: {
  label: string
  value: string
  isBold?: boolean
  isMono?: boolean
  alert?: boolean
}) {
  return (
    <div className={`p-2.5 rounded-[2px] border ${alert ? 'border-[var(--color-risk-high-line)] bg-[var(--color-risk-high-bg)]/30' : 'border-[var(--color-line-100)] bg-[var(--color-surface-1)]'}`}>
      <div className="text-[10px] uppercase tracking-wider text-[var(--color-ink-400)] truncate mb-0.5 font-medium">
        {label}
      </div>
      <div
        className={`truncate ${isMono ? 'font-mono' : ''} ${isBold ? 'font-bold text-[14px]' : 'font-medium'} ${
          alert ? 'text-[var(--color-risk-high)]' : 'text-[var(--color-ink-900)]'
        }`}
      >
        {value}
      </div>
    </div>
  )
}

function BooleanCell({ label, active }: { label: string; active?: boolean }) {
  const isYes = Boolean(active)
  return (
    <div
      className={`p-2.5 rounded-[2px] border flex items-center justify-between ${
        isYes
          ? 'border-[var(--color-risk-medium-line)] bg-[var(--color-risk-medium-bg)]/30'
          : 'border-[var(--color-line-100)] bg-[var(--color-surface-1)]'
      }`}
    >
      <span className="text-[11px] text-[var(--color-ink-700)] font-medium truncate pr-1">{label}</span>
      <span
        className={`px-1.5 py-0.2 rounded-[2px] text-[10px] font-bold uppercase tracking-wider ${
          isYes
            ? 'bg-[var(--color-risk-medium-bg)] text-[var(--color-risk-medium)] border border-[var(--color-risk-medium-line)]'
            : 'bg-[var(--color-surface-2)] text-[var(--color-ink-400)]'
        }`}
      >
        {isYes ? 'Yes' : 'No'}
      </span>
    </div>
  )
}
