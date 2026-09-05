import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import TopBar from '../components/TopBar'
import Panel from '../components/Panel'
import RiskBadge from '../components/RiskBadge'
import RiskScoreHero from '../components/RiskScoreHero'
import ShapContributionChart from '../components/ShapContributionChart'
import MarkdownRenderer from '../components/MarkdownRenderer'
import InvestigationTimeline from '../components/InvestigationTimeline'
import { ErrorState } from '../components/EmptyState'
import { SkeletonCard } from '../components/SkeletonLoader'
import { useToast } from '../components/ToastContext'
import { usePolling } from '../hooks/usePolling'
import { getInvestigation, updateInvestigation } from '../api/investigations'
import { getTransaction } from '../api/transactions'
import { getSystemStatus } from '../api/system'
import { formatCurrency, formatDateTime, formatTime } from '../lib/format'
import type { Investigation, InvestigationStatus, Transaction } from '../types'

const STATUS_OPTIONS: InvestigationStatus[] = [
  'OPEN',
  'ASSIGNED',
  'INVESTIGATING',
  'CONFIRMED_FRAUD',
  'FALSE_POSITIVE',
  'RESOLVED',
]

export default function InvestigationDetail() {
  const { id = '' } = useParams()
  const navigate = useNavigate()
  const { showToast } = useToast()

  // Polling data
  const status = usePolling(getSystemStatus, 20000)
  const invData = usePolling(() => getInvestigation(id), 6000, [id])
  const inv: Investigation | null = invData.data

  // Fetch linked transaction data
  const [transaction, setTransaction] = useState<Transaction | null>(null)
  const [loadingTx, setLoadingTx] = useState(false)

  // Local form state
  const [selectedStatus, setSelectedStatus] = useState<string>('OPEN')
  const [assignedTo, setAssignedTo] = useState<string>('')
  const [notes, setNotes] = useState<string>('')
  const [decision, setDecision] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)

  // Synchronize form state when investigation data loads
  useEffect(() => {
    if (inv) {
      setSelectedStatus(inv.status || 'OPEN')
      setAssignedTo(inv.assigned_to || '')
      setNotes(inv.investigator_notes || '')
      setDecision(inv.decision || null)

      // Fetch transaction if we have a transaction_id
      if (inv.transaction_id) {
        setLoadingTx(true)
        getTransaction(inv.transaction_id)
          .then((t) => setTransaction(t))
          .catch((err) => console.warn('Failed to load transaction for case:', err))
          .finally(() => setLoadingTx(false))
      }
    }
  }, [inv])

  const handleStatusChange = async (newStatus: string) => {
    setSelectedStatus(newStatus)
    setSaving(true)
    try {
      await updateInvestigation(id, { status: newStatus })
      showToast(`Case status updated to ${newStatus}`, 'info')
      await invData.refresh()
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Failed to update status', 'error')
    } finally {
      setSaving(false)
    }
  }

  const handleSaveNotes = async () => {
    setSaving(true)
    try {
      await updateInvestigation(id, {
        investigator_notes: notes,
        assigned_to: assignedTo.trim() || undefined,
      })
      showToast('Investigator notes saved successfully', 'success')
      await invData.refresh()
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Failed to save notes', 'error')
    } finally {
      setSaving(false)
    }
  }

  const handleDecision = async (selectedDecision: 'CONFIRMED_FRAUD' | 'FALSE_POSITIVE' | 'RESOLVED') => {
    setSaving(true)
    try {
      if (selectedDecision === 'RESOLVED') {
        await updateInvestigation(id, {
          status: 'RESOLVED',
          investigator_notes: notes,
        })
        showToast('Investigation marked as RESOLVED.', 'success')
      } else {
        await updateInvestigation(id, {
          decision: selectedDecision,
          status: selectedDecision,
          investigator_notes: notes,
        })
        setDecision(selectedDecision)
        showToast(`Investigation adjudicated as ${selectedDecision}.`, 'success')
      }
      await invData.refresh()
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Failed to save decision', 'error')
    } finally {
      setSaving(false)
    }
  }

  // AI explanation raw string
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

  // Synthesize timeline stages
  const timelineStages = {
    received_at: transaction?.timestamp || transaction?.timeline?.received_at,
    fraud_model_at: transaction?.timeline?.fraud_model_at || transaction?.timestamp,
    anomaly_at: transaction?.timeline?.anomaly_at || transaction?.timestamp,
    rules_at: transaction?.timeline?.rules_at || transaction?.timestamp,
    shap_at: transaction?.timeline?.shap_at,
    rag_at: transaction?.timeline?.rag_at,
    ai_explanation_at: transaction?.timeline?.ai_explanation_at,
    alert_at: transaction?.timeline?.alert_at,
    investigation_opened_at: inv?.created_at,
    investigation_resolved_at: inv?.resolved_at,
  }

  return (
    <div className="flex-1 flex flex-col min-h-0">
      <TopBar
        title="Investigation Workspace"
        subtitle={id}
        status={status.data}
        lastUpdated={invData.lastUpdated}
        onRefresh={() => {
          invData.refresh()
          if (inv?.transaction_id) {
            getTransaction(inv.transaction_id).then(setTransaction)
          }
        }}
      />

      <div className="flex-1 overflow-y-auto scrollbar-thin p-3 sm:p-5 space-y-4 sm:space-y-5">
        {invData.error && !inv && <ErrorState message={invData.error} onRetry={invData.refresh} />}

        {invData.loading && !inv && (
          <div className="space-y-4">
            <SkeletonCard height={80} />
            <SkeletonCard height={300} />
          </div>
        )}

        {inv && (
          <>
            {/* HEADER */}
            <div className="border border-[var(--color-line-100)] bg-[var(--color-surface-1)] rounded-[3px] p-4 sm:p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div>
                <div className="flex items-center gap-2 text-[10.5px] uppercase tracking-wider text-[var(--color-ink-400)] font-medium mb-1">
                  <span>Case Adjudication</span>
                  <span>•</span>
                  <span>Created {formatDateTime(inv.created_at)}</span>
                </div>
                <div className="flex items-center gap-3 flex-wrap">
                  <span className="font-mono text-[18px] sm:text-[20px] font-bold text-[var(--color-ink-900)]">
                    {inv.investigation_id}
                  </span>
                  <span
                    className={`inline-flex items-center px-2 py-0.5 rounded-[2px] text-[11px] font-bold tracking-wider uppercase border ${
                      inv.status === 'CONFIRMED_FRAUD'
                        ? 'bg-[var(--color-risk-critical-bg)] text-[var(--color-risk-critical)] border-[var(--color-risk-critical-line)]'
                        : inv.status === 'FALSE_POSITIVE'
                        ? 'bg-[var(--color-risk-low-bg)] text-[var(--color-risk-low)] border-[var(--color-risk-low-line)]'
                        : inv.status === 'RESOLVED'
                        ? 'bg-[var(--color-risk-low-bg)] text-[var(--color-risk-low)] border-[var(--color-risk-low-line)]'
                        : 'bg-[var(--color-accent-100)] text-[var(--color-accent-600)] border-[var(--color-line-200)]'
                    }`}
                  >
                    {inv.status}
                  </span>
                  {transaction && <RiskBadge level={transaction.risk_level} size="sm" />}
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => navigate('/investigations')}
                  className="px-3 py-1.5 rounded-[3px] border border-[var(--color-line-200)] text-[11.5px] font-medium text-[var(--color-ink-700)] hover:bg-[var(--color-surface-2)] transition-colors"
                >
                  ← Back to Queue
                </button>
              </div>
            </div>

            {/* CASE SUMMARY BAR */}
            <div className="grid grid-cols-2 sm:grid-cols-4 border border-[var(--color-line-100)] bg-[var(--color-surface-1)] rounded-[3px] divide-x divide-y sm:divide-y-0 divide-[var(--color-line-100)] text-[12px]">
              <div className="p-3">
                <div className="text-[10px] uppercase text-[var(--color-ink-400)] font-medium mb-0.5">
                  Linked Transaction
                </div>
                <button
                  onClick={() => navigate(`/transactions/${encodeURIComponent(inv.transaction_id)}`)}
                  className="font-mono font-semibold text-[var(--color-accent-600)] hover:underline truncate block"
                >
                  {inv.transaction_id} →
                </button>
              </div>

              <div className="p-3">
                <div className="text-[10px] uppercase text-[var(--color-ink-400)] font-medium mb-0.5">
                  Alert ID
                </div>
                <div className="font-mono text-[var(--color-ink-800)] font-medium truncate">
                  {inv.alert_id || 'Direct Manual Case'}
                </div>
              </div>

              <div className="p-3">
                <div className="text-[10px] uppercase text-[var(--color-ink-400)] font-medium mb-0.5">
                  Assigned Analyst
                </div>
                <div className="text-[var(--color-ink-900)] font-medium truncate">
                  {inv.assigned_to || 'Unassigned'}
                </div>
              </div>

              <div className="p-3">
                <div className="text-[10px] uppercase text-[var(--color-ink-400)] font-medium mb-0.5">
                  Last Updated
                </div>
                <div className="font-mono text-[var(--color-ink-600)] tabular">
                  {inv.updated_at ? formatTime(inv.updated_at) : '—'}
                </div>
              </div>
            </div>

            {/* TWO-COLUMN INVESTIGATION WORKSPACE */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 sm:gap-5 items-start">
              {/* LEFT SIDE: Transaction signals, Risk Score, Reasons, SHAP, AI explanation (7 cols) */}
              <div className="lg:col-span-7 space-y-4 sm:space-y-5">
                {/* Transaction telemetry snapshot */}
                <Panel title="Transaction Telemetry" subtitle="Real-time payment indicators">
                  {loadingTx ? (
                    <div className="py-4 text-[12px] text-[var(--color-ink-400)]">Loading transaction payload…</div>
                  ) : transaction ? (
                    <div className="space-y-4">
                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-[12px]">
                        <div className="p-2.5 rounded-[2px] bg-[var(--color-surface-0)] border border-[var(--color-line-100)]">
                          <div className="text-[10px] text-[var(--color-ink-400)] uppercase font-medium">Amount</div>
                          <div className="text-[15px] font-bold tabular text-[var(--color-ink-900)]">
                            {formatCurrency(transaction.amount, transaction.currency)}
                          </div>
                        </div>
                        <div className="p-2.5 rounded-[2px] bg-[var(--color-surface-0)] border border-[var(--color-line-100)]">
                          <div className="text-[10px] text-[var(--color-ink-400)] uppercase font-medium">User Account</div>
                          <div className="font-mono text-[13px] font-semibold text-[var(--color-ink-900)]">
                            {transaction.user_id}
                          </div>
                        </div>
                        <div className="p-2.5 rounded-[2px] bg-[var(--color-surface-0)] border border-[var(--color-line-100)]">
                          <div className="text-[10px] text-[var(--color-ink-400)] uppercase font-medium">Distance from Home</div>
                          <div className="font-semibold text-[var(--color-ink-900)]">
                            {transaction.distance_from_home_km !== undefined ? `${transaction.distance_from_home_km} km` : '—'}
                          </div>
                        </div>
                      </div>

                      {/* Reasons */}
                      {transaction.reasons && transaction.reasons.length > 0 && (
                        <div>
                          <div className="text-[11px] uppercase tracking-wider text-[var(--color-ink-400)] font-semibold mb-2">
                            Triggered Flag Reasons
                          </div>
                          <div className="space-y-1.5">
                            {transaction.reasons.map((r, i) => (
                              <div
                                key={i}
                                className="flex items-center gap-2 px-2.5 py-1.5 rounded-[2px] bg-[var(--color-risk-high-bg)] text-[var(--color-risk-high)] text-[12px] font-medium border border-[var(--color-risk-high-line)]"
                              >
                                <span>⚠</span>
                                <span>{r}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  ) : (
                    <p className="text-[12px] text-[var(--color-ink-400)]">
                      Transaction data could not be retrieved.
                    </p>
                  )}
                </Panel>

                {/* Risk Score Assessment */}
                {transaction && (
                  <Panel title="Risk Score Analysis" subtitle="Model scoring outputs">
                    <RiskScoreHero tx={transaction} />
                  </Panel>
                )}

                {/* SHAP Explanation */}
                {transaction?.shap_explanations && transaction.shap_explanations.length > 0 && (
                  <Panel title="SHAP Attribution Analysis" subtitle="Feature weights driving prediction">
                    <ShapContributionChart contributors={transaction.shap_explanations} />
                  </Panel>
                )}

                {/* AI Explanation */}
                {aiMarkdown && (
                  <Panel title="AI Investigator Intelligence Summary" subtitle="Automated decision rationale">
                    <div className="p-3.5 rounded-[3px] border border-[var(--color-line-100)] bg-[var(--color-surface-1)]">
                      <MarkdownRenderer content={aiMarkdown} />
                    </div>
                  </Panel>
                )}
              </div>

              {/* RIGHT SIDE: Investigator Controls, Notes, Decisions, Lifecycle (5 cols) */}
              <div className="lg:col-span-5 space-y-4 sm:space-y-5">
                {/* INVESTIGATOR CONTROLS */}
                <Panel title="Investigator Controls" subtitle="Case management & adjudication actions">
                  <div className="space-y-4 text-[12px]">
                    {/* Status Selector */}
                    <div>
                      <label className="block text-[11px] font-medium text-[var(--color-ink-700)] mb-1">
                        Investigation Status
                      </label>
                      <select
                        value={selectedStatus}
                        onChange={(e) => handleStatusChange(e.target.value)}
                        disabled={saving}
                        className="w-full h-8 px-2 rounded-[3px] border border-[var(--color-line-200)] bg-[var(--color-surface-1)] text-[12px] text-[var(--color-ink-900)] font-medium focus:outline-none focus:border-[var(--color-accent-500)]"
                      >
                        {STATUS_OPTIONS.map((st) => (
                          <option key={st} value={st}>
                            {st}
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* Assigned To */}
                    <div>
                      <label className="block text-[11px] font-medium text-[var(--color-ink-700)] mb-1">
                        Assigned Analyst
                      </label>
                      <input
                        value={assignedTo}
                        onChange={(e) => setAssignedTo(e.target.value)}
                        placeholder="e.g. Investigator Alex M."
                        className="w-full h-8 px-2.5 rounded-[3px] border border-[var(--color-line-200)] bg-[var(--color-surface-0)] text-[12px] focus:outline-none focus:border-[var(--color-accent-500)]"
                      />
                    </div>

                    {/* Investigator Notes */}
                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <label className="text-[11px] font-medium text-[var(--color-ink-700)]">
                          Investigator Notes & Audit Log
                        </label>
                        <span className="text-[10px] text-[var(--color-ink-400)]">Preserved in database</span>
                      </div>
                      <textarea
                        rows={5}
                        value={notes}
                        onChange={(e) => setNotes(e.target.value)}
                        placeholder="Document investigation findings, customer communications, bank callbacks, device fingerprinting findings…"
                        className="w-full p-2.5 rounded-[3px] border border-[var(--color-line-200)] bg-[var(--color-surface-0)] text-[12px] focus:outline-none focus:border-[var(--color-accent-500)] leading-relaxed"
                      />
                      <button
                        onClick={handleSaveNotes}
                        disabled={saving}
                        className="mt-2 w-full py-1.5 rounded-[3px] border border-[var(--color-line-200)] bg-[var(--color-surface-1)] text-[11.5px] font-medium text-[var(--color-ink-800)] hover:bg-[var(--color-surface-2)] transition-colors disabled:opacity-50"
                      >
                        {saving ? 'Saving…' : 'Save Notes & Assignee'}
                      </button>
                    </div>

                    {/* Decision Options */}
                    <div className="pt-3 border-t border-[var(--color-line-100)] space-y-2">
                      <label className="block text-[11px] font-semibold uppercase tracking-wider text-[var(--color-ink-600)]">
                        Final Case Decision
                      </label>

                      <div className="grid grid-cols-2 gap-2">
                        <button
                          onClick={() => handleDecision('CONFIRMED_FRAUD')}
                          disabled={saving}
                          className={`p-2 rounded-[3px] text-center font-semibold text-[11px] tracking-wide border transition-all ${
                            decision === 'CONFIRMED_FRAUD'
                              ? 'bg-[var(--color-risk-critical)] text-white border-[var(--color-risk-critical)] shadow-xs'
                              : 'bg-[var(--color-risk-critical-bg)] text-[var(--color-risk-critical)] border-[var(--color-risk-critical-line)] hover:opacity-80'
                          }`}
                        >
                          CONFIRMED FRAUD
                        </button>

                        <button
                          onClick={() => handleDecision('FALSE_POSITIVE')}
                          disabled={saving}
                          className={`p-2 rounded-[3px] text-center font-semibold text-[11px] tracking-wide border transition-all ${
                            decision === 'FALSE_POSITIVE'
                              ? 'bg-[var(--color-risk-low)] text-white border-[var(--color-risk-low)] shadow-xs'
                              : 'bg-[var(--color-risk-low-bg)] text-[var(--color-risk-low)] border-[var(--color-risk-low-line)] hover:opacity-80'
                          }`}
                        >
                          FALSE POSITIVE (LEGITIMATE)
                        </button>
                      </div>

                      {/* Resolve Button */}
                      <button
                        onClick={() => handleDecision('RESOLVED')}
                        disabled={saving}
                        className="w-full py-2 rounded-[3px] bg-[var(--color-accent-600)] text-white text-[12px] font-semibold hover:bg-[var(--color-accent-500)] transition-colors shadow-xs disabled:opacity-50"
                      >
                        ✓ Complete & Resolve Investigation
                      </button>
                    </div>
                  </div>
                </Panel>

                {/* TIMELINE */}
                <Panel title="Investigation Lifecycle Timeline" subtitle="End-to-end event chain">
                  <InvestigationTimeline timeline={timelineStages} />
                </Panel>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
