import React from 'react'
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  BarChart,
  Bar,
} from 'recharts'
import TopBar from '../components/TopBar'
import Panel from '../components/Panel'
import MetricStrip from '../components/MetricStrip'
import { EmptyState, ErrorState } from '../components/EmptyState'
import { usePolling } from '../hooks/usePolling'
import { getConceptDrift, type ConceptDriftData } from '../api/conceptDrift'
import { getSystemStatus } from '../api/system'

function pct(value: number | null | undefined) {
  return value == null ? '—' : `${(value * 100).toFixed(1)}%`
}

function statusClass(status: string) {
  const value = status.toUpperCase()
  if (value.includes('DRIFT')) return 'text-red-400'
  if (value.includes('WARNING')) return 'text-amber-400'
  return 'text-emerald-400'
}

export default function ConceptDrift() {
  const [data, setData] = React.useState<ConceptDriftData | null>(null)
  const [error, setError] = React.useState<string | null>(null)
  const status = usePolling(getSystemStatus, 20000)

  const load = React.useCallback(async () => {
    try {
      setError(null)
      const res = await getConceptDrift()
      setData(res)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load concept drift data')
    }
  }, [])

  usePolling(load, 15000)

  const results = data?.results ?? []

  return (
    <div className="flex-1 flex flex-col min-h-0">
      <TopBar
        title="Concept Drift"
        subtitle="Monitor fraud-pattern changes and model performance degradation"
        status={status.data}
        lastUpdated={null}
        onRefresh={load}
      />

      <div className="flex-1 overflow-y-auto scrollbar-thin p-3 sm:p-5 space-y-4 sm:space-y-5">
        {error ? (
          <Panel>
            <ErrorState
              message={error}
              onRetry={load}
            />
          </Panel>
        ) : !data ? (
          <Panel>
            <EmptyState
              message="Fetching the latest drift experiment results..."
            />
          </Panel>
        ) : (
          <>
            <MetricStrip
              metrics={[
                { label: 'Baseline F1', value: data.baseline_f1 != null ? data.baseline_f1.toFixed(3) : '—' },
                { label: 'Current F1', value: data.current_f1 != null ? data.current_f1.toFixed(3) : '—' },
                { label: 'Max Drift', value: data.max_drift_score != null ? data.max_drift_score.toFixed(3) : '—' },
                { label: 'Drift Detected', value: String(data.drift_detected_count ?? 0) },
                { label: 'Overall Status', value: data.overall_status || 'UNKNOWN' },
              ]}
            />

            <Panel
              title="Pattern Evolution"
              subtitle="Model performance as fraud behavior changes across simulated months"
            >
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={results} margin={{ top: 10, right: 20, left: 0, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" opacity={0.12} />
                    <XAxis dataKey="month" tick={{ fontSize: 11 }} />
                    <YAxis domain={[0, 1]} tickFormatter={(v) => Number(v).toFixed(1)} />
                    <Tooltip
                      formatter={(value, name) => [value != null ? Number(value).toFixed(3) : '—', String(name ?? '')]}
                    />
                    <Legend />
                    <Line type="monotone" dataKey="precision" strokeWidth={2} dot />
                    <Line type="monotone" dataKey="recall" strokeWidth={2} dot />
                    <Line type="monotone" dataKey="f1" strokeWidth={3} dot />
                    <Line type="monotone" dataKey="roc_auc" strokeWidth={2} dot />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </Panel>

            <div className="grid grid-cols-1 gap-5 xl:grid-cols-2">
              <Panel title="Drift Score" subtitle="Distribution drift relative to Month 1 baseline">
                <div className="h-72">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={results}>
                      <CartesianGrid strokeDasharray="3 3" opacity={0.12} />
                      <XAxis dataKey="month" tick={{ fontSize: 11 }} />
                      <YAxis />
                      <Tooltip formatter={(value) => (value != null ? Number(value).toFixed(3) : '—')} />
                      <Bar dataKey="drift_score" name="Drift Score" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </Panel>

              <Panel title="Fraud Rate & F1 Degradation" subtitle="Change in fraud prevalence and model quality">
                <div className="h-72">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={results}>
                      <CartesianGrid strokeDasharray="3 3" opacity={0.12} />
                      <XAxis dataKey="month" tick={{ fontSize: 11 }} />
                      <YAxis domain={[0, 1]} tickFormatter={(v) => `${Math.round(Number(v) * 100)}%`} />
                      <Tooltip formatter={(value) => (value != null ? pct(Number(value)) : '—')} />
                      <Legend />
                      <Line type="monotone" dataKey="fraud_rate" name="Fraud Rate" strokeWidth={2} dot />
                      <Line type="monotone" dataKey="f1_drop_from_baseline" name="F1 Drop" strokeWidth={2} dot />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </Panel>
            </div>

            <Panel title="Monthly Drift Assessment" subtitle="Operational decision for each simulated fraud pattern">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-white/10 text-left text-xs uppercase tracking-wide text-slate-400">
                      <th className="px-3 py-3">Month</th>
                      <th className="px-3 py-3">Pattern</th>
                      <th className="px-3 py-3">F1</th>
                      <th className="px-3 py-3">Recall</th>
                      <th className="px-3 py-3">Drift</th>
                      <th className="px-3 py-3">Status</th>
                      <th className="px-3 py-3">Retrain</th>
                    </tr>
                  </thead>
                  <tbody>
                    {results.map((row) => {
                      const parts = row.month.split(' - ')
                      return (
                        <tr key={row.month} className="border-b border-white/5">
                          <td className="px-3 py-3 font-medium">{parts[0]}</td>
                          <td className="px-3 py-3 text-slate-300">{parts.slice(1).join(' - ') || row.month}</td>
                          <td className="px-3 py-3">{row.f1 != null ? row.f1.toFixed(3) : '—'}</td>
                          <td className="px-3 py-3">{row.recall != null ? row.recall.toFixed(3) : '—'}</td>
                          <td className="px-3 py-3">{row.drift_score != null ? row.drift_score.toFixed(3) : '—'}</td>
                          <td className={`px-3 py-3 font-semibold ${statusClass(row.drift_status || '')}`}>
                            {row.drift_status}
                          </td>
                          <td className="px-3 py-3">
                            {row.retraining_recommended ? (
                              <span className="font-semibold text-amber-400">Recommended</span>
                            ) : (
                              <span className="text-emerald-400">No</span>
                            )}
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            </Panel>

            <Panel
              title={data.retraining_recommended ? 'Retraining Recommended' : 'Model Stable'}
              subtitle={
                data.retraining_recommended
                  ? 'The simulated fraud pattern has caused enough drift or performance degradation to justify model retraining.'
                  : 'No retraining trigger was reported by the current concept-drift experiment.'
              }
            >
              <div className={`rounded-xl border px-4 py-4 ${data.retraining_recommended ? 'border-amber-500/30 bg-amber-500/5' : 'border-emerald-500/30 bg-emerald-500/5'}`}>
                <div className={`text-sm font-semibold ${data.retraining_recommended ? 'text-amber-300' : 'text-emerald-300'}`}>
                  {data.overall_status}
                </div>
                <p className="mt-1 text-sm text-slate-400">
                  Compare the baseline period with the newer fraud behavior before promoting a retrained model.
                </p>
              </div>
            </Panel>
          </>
        )}
      </div>
    </div>
  )
}
