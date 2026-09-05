import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import TopBar from '../components/TopBar'
import Panel from '../components/Panel'
import MetricStrip from '../components/MetricStrip'
import { EmptyState, ErrorState } from '../components/EmptyState'
import { SkeletonMetrics, SkeletonCard } from '../components/SkeletonLoader'
import { usePolling } from '../hooks/usePolling'
import { getModelMonitoring } from '../api/modelMonitoring'
import { getSystemStatus } from '../api/system'

const axisStyle = { fontSize: 10, fill: 'var(--color-ink-400)' }

function healthTone(health: string) {
  const value = health.toUpperCase()
  if (value === 'HEALTHY') return 'var(--color-risk-low)'
  if (value === 'WARNING') return 'var(--color-risk-medium)'
  return 'var(--color-risk-critical)'
}

function driftTone(status: string) {
  const value = status.toUpperCase()
  if (value === 'STABLE') return 'var(--color-risk-low)'
  if (value === 'WARNING') return 'var(--color-risk-medium)'
  return 'var(--color-risk-critical)'
}

function percent(value: number | null) {
  return value === null ? '—' : `${(value * 100).toFixed(2)}%`
}

export default function ModelMonitoring() {
  const status = usePolling(getSystemStatus, 20000)
  const monitoring = usePolling(getModelMonitoring, 15000)
  const m = monitoring.data

  return (
    <div className="flex-1 flex flex-col min-h-0">
      <TopBar
        title="Model Monitoring"
        subtitle="Operational health, drift, prediction behavior, and investigator feedback"
        status={status.data}
        lastUpdated={monitoring.lastUpdated}
        onRefresh={monitoring.refresh}
      />

      <div className="flex-1 overflow-y-auto scrollbar-thin p-3 sm:p-5 space-y-4 sm:space-y-5">
        {monitoring.loading && !m ? (
          <div className="space-y-4">
            <SkeletonMetrics count={5} />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <SkeletonCard height={220} />
              <SkeletonCard height={220} />
            </div>
          </div>
        ) : monitoring.error && !m ? (
          <ErrorState message={monitoring.error} onRetry={monitoring.refresh} />
        ) : !m ? (
          <EmptyState message="Model monitoring data is unavailable." />
        ) : (
          <>
            <div className="grid grid-cols-1 lg:grid-cols-[1fr_auto] gap-4">
              <Panel
                title="Model Health"
                subtitle="Current production model configuration and operational state"
              >
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div>
                    <div className="text-[10px] uppercase tracking-wide text-[var(--color-ink-400)]">Model</div>
                    <div className="mt-1 text-sm font-semibold text-[var(--color-ink-900)]">{m.model_type}</div>
                  </div>
                  <div>
                    <div className="text-[10px] uppercase tracking-wide text-[var(--color-ink-400)]">Version</div>
                    <div className="mt-1 text-sm font-mono font-semibold text-[var(--color-ink-900)]">{m.model_version}</div>
                  </div>
                  <div>
                    <div className="text-[10px] uppercase tracking-wide text-[var(--color-ink-400)]">Risk Threshold</div>
                    <div className="mt-1 text-sm font-mono font-semibold text-[var(--color-ink-900)]">{m.risk_threshold}</div>
                  </div>
                  <div>
                    <div className="text-[10px] uppercase tracking-wide text-[var(--color-ink-400)]">Health</div>
                    <div className="mt-1 inline-flex items-center gap-1.5 text-sm font-semibold" style={{ color: healthTone(m.model_health) }}>
                      <span className="h-2 w-2 rounded-full bg-current" />
                      {m.model_health}
                    </div>
                  </div>
                </div>
              </Panel>

              <Panel title="Drift Status" subtitle="Latest vs previous transaction window">
                <div className="min-w-[190px]">
                  <div className="text-3xl font-semibold tabular text-[var(--color-ink-900)]">
                    {m.drift_score.toFixed(4)}
                  </div>
                  <div className="mt-1 text-[11px] uppercase tracking-wide font-semibold" style={{ color: driftTone(m.drift_status) }}>
                    {m.drift_status}
                  </div>
                  <div className="mt-3 text-[11px] text-[var(--color-ink-400)]">
                    Window: {m.monitoring_window.toLocaleString()} transactions
                  </div>
                </div>
              </Panel>
            </div>

            <MetricStrip
              metrics={[
                { label: 'Avg Risk Score', value: m.average_risk_score.toFixed(2), hint: 'Current monitoring window' },
                { label: 'False Positive Rate', value: percent(m.false_positive_rate), hint: `${m.feedback_evaluated} human-reviewed cases` },
                { label: 'False Negative Rate', value: percent(m.false_negative_rate), hint: 'Based on investigator feedback' },
                { label: 'Feedback Evaluated', value: m.feedback_evaluated.toLocaleString(), hint: 'Ground-truth decisions' },
                { label: 'Transactions', value: m.total_transactions.toLocaleString(), hint: 'Current + previous windows' },
              ]}
            />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-5">
              <Panel title="Prediction Distribution" subtitle="Risk-level output in the current monitoring window">
                <div style={{ width: '100%', height: 220 }}>
                  <ResponsiveContainer>
                    <BarChart data={m.prediction_distribution} margin={{ left: -18, right: 8, top: 6 }}>
                      <CartesianGrid vertical={false} stroke="var(--color-line-100)" />
                      <XAxis dataKey="name" tick={axisStyle} axisLine={{ stroke: 'var(--color-line-100)' }} tickLine={false} />
                      <YAxis tick={axisStyle} axisLine={false} tickLine={false} width={32} />
                      <Tooltip
                        formatter={(value, _name, item) => [
                          `${value ?? 0} (${(item.payload as { percentage?: number } | undefined)?.percentage ?? 0}%)`,
                          'Predictions',
                        ]}
                        contentStyle={{ fontSize: 11, borderRadius: 3, border: '1px solid var(--color-line-200)', boxShadow: 'none' }}
                      />
                      <Bar dataKey="count" fill="var(--color-accent-600)" radius={[2, 2, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </Panel>

              <Panel title="Fraud Probability Distribution" subtitle="Model probability output across five confidence bands">
                <div style={{ width: '100%', height: 220 }}>
                  <ResponsiveContainer>
                    <BarChart data={m.fraud_probability_distribution} margin={{ left: -18, right: 8, top: 6 }}>
                      <CartesianGrid vertical={false} stroke="var(--color-line-100)" />
                      <XAxis dataKey="bucket" tick={axisStyle} axisLine={{ stroke: 'var(--color-line-100)' }} tickLine={false} />
                      <YAxis tick={axisStyle} axisLine={false} tickLine={false} width={32} />
                      <Tooltip
                        formatter={(value, _name, item) => [
                          `${value ?? 0} (${(item.payload as { percentage?: number } | undefined)?.percentage ?? 0}%)`,
                          'Transactions',
                        ]}
                        contentStyle={{ fontSize: 11, borderRadius: 3, border: '1px solid var(--color-line-200)', boxShadow: 'none' }}
                      />
                      <Bar dataKey="count" fill="var(--color-ink-700)" radius={[2, 2, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </Panel>
            </div>

            <Panel title="Investigator Feedback Performance" subtitle="Confusion matrix from human-reviewed decisions">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {[
                  ['True Positive', m.confusion_matrix.true_positive],
                  ['False Positive', m.confusion_matrix.false_positive],
                  ['False Negative', m.confusion_matrix.false_negative],
                  ['True Negative', m.confusion_matrix.true_negative],
                ].map(([label, value]) => (
                  <div key={String(label)} className="border border-[var(--color-line-100)] bg-[var(--color-surface-1)] p-3 rounded-[3px]">
                    <div className="text-[10px] uppercase tracking-wide text-[var(--color-ink-400)]">{label}</div>
                    <div className="mt-1 text-xl font-semibold font-mono tabular text-[var(--color-ink-900)]">{Number(value).toLocaleString()}</div>
                  </div>
                ))}
              </div>
              <div className="mt-4 text-[11px] text-[var(--color-ink-400)]">
                Last updated: {new Date(m.last_updated).toLocaleString()}
              </div>
            </Panel>
          </>
        )}
      </div>
    </div>
  )
}
