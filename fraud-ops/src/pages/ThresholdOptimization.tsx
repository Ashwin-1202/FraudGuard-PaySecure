import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ReferenceLine,
} from 'recharts'
import TopBar from '../components/TopBar'
import Panel from '../components/Panel'
import MetricStrip from '../components/MetricStrip'
import { EmptyState } from '../components/EmptyState'
import { usePolling } from '../hooks/usePolling'
import {
  getThresholdOptimization,
  type ThresholdOptimizationData,
} from '../api/thresholdOptimization'
import { getSystemStatus } from '../api/system'

const pct = (value?: number) =>
  value == null ? '—' : `${(Number(value) * 100).toFixed(1)}%`

const num = (value?: number) =>
  value == null ? '—' : Number(value).toFixed(3)

export default function ThresholdOptimization() {
  const status = usePolling(getSystemStatus, 20000)
  const thresholdData = usePolling<ThresholdOptimizationData>(
    getThresholdOptimization,
    15000,
  )
  const { data, loading, error } = thresholdData

  if (loading && !data) {
    return (
      <div className="flex-1 flex flex-col min-h-0">
        <TopBar
          title="Threshold Optimization"
          status={status.data}
          lastUpdated={thresholdData.lastUpdated}
        />
        <div className="flex-1 overflow-y-auto scrollbar-thin p-4">
          <EmptyState message="Loading threshold analysis..." />
        </div>
      </div>
    )
  }

  if (error && !data) {
    const errorMsg =
      typeof error === 'string'
        ? error
        : error && typeof error === 'object' && 'message' in error
        ? String((error as { message: unknown }).message)
        : 'API request failed'
    return (
      <div className="flex-1 flex flex-col min-h-0">
        <TopBar
          title="Threshold Optimization"
          status={status.data}
          lastUpdated={thresholdData.lastUpdated}
        />
        <div className="flex-1 overflow-y-auto scrollbar-thin p-4">
          <EmptyState
            message={`Unable to load threshold analysis: ${errorMsg}`}
          />
        </div>
      </div>
    )
  }

  if (!data) {
    return (
      <div className="flex-1 flex flex-col min-h-0">
        <TopBar
          title="Threshold Optimization"
          status={status.data}
          lastUpdated={thresholdData.lastUpdated}
        />
        <div className="flex-1 overflow-y-auto scrollbar-thin p-4">
          <EmptyState message="No threshold optimization data available" />
        </div>
      </div>
    )
  }

  const validation = data.validation_metrics
  const finalTest = data.final_test_metrics
  const chartData = [...(data.threshold_results ?? [])].sort(
    (a, b) => a.threshold - b.threshold,
  )

  const formattedThreshold =
    data.best_threshold != null ? data.best_threshold.toFixed(0) : '—'

  return (
    <div className="flex-1 flex flex-col min-h-0">
      <TopBar
        title="Threshold Optimization"
        subtitle="Find the operating point for the hybrid fraud risk engine"
        status={status.data}
        lastUpdated={thresholdData.lastUpdated}
        onRefresh={thresholdData.refresh}
      />

      <div className="flex-1 overflow-y-auto scrollbar-thin p-3 sm:p-5 space-y-4 sm:space-y-5">
        <MetricStrip
          metrics={[
            { label: 'Optimized Threshold', value: formattedThreshold },
            { label: 'Validation F1', value: pct(validation?.f1) },
            { label: 'Holdout F1', value: pct(finalTest?.f1) },
            { label: 'Holdout ROC-AUC', value: num(finalTest?.roc_auc) },
          ]}
        />

        <div className="grid grid-cols-1 xl:grid-cols-3 gap-4 sm:gap-5">
          <Panel title="Selected Operating Point">
            <div className="text-4xl sm:text-5xl font-bold tracking-tight">
              {formattedThreshold}
            </div>
            <p className="mt-2 text-xs opacity-70">
              Selected by maximum validation F1 across the tested threshold range.
            </p>
            <div className="mt-4 grid grid-cols-2 gap-2 text-xs">
              <div className="rounded-[3px] border border-[var(--color-line-100)] p-2.5">
                <div className="opacity-60">Precision</div>
                <div className="font-semibold mt-1">{pct(validation?.precision)}</div>
              </div>
              <div className="rounded-[3px] border border-[var(--color-line-100)] p-2.5">
                <div className="opacity-60">Recall</div>
                <div className="font-semibold mt-1">{pct(validation?.recall)}</div>
              </div>
              <div className="rounded-[3px] border border-[var(--color-line-100)] p-2.5">
                <div className="opacity-60">False Positive Rate</div>
                <div className="font-semibold mt-1">{pct(validation?.fpr)}</div>
              </div>
              <div className="rounded-[3px] border border-[var(--color-line-100)] p-2.5">
                <div className="opacity-60">False Negative Rate</div>
                <div className="font-semibold mt-1">{pct(validation?.fnr)}</div>
              </div>
            </div>
          </Panel>

          <Panel title="Validation vs Holdout">
            <div className="space-y-3">
              {[
                ['Precision', validation?.precision, finalTest?.precision],
                ['Recall', validation?.recall, finalTest?.recall],
                ['F1 Score', validation?.f1, finalTest?.f1],
                ['FPR', validation?.fpr, finalTest?.fpr],
                ['FNR', validation?.fnr, finalTest?.fnr],
                ['ROC-AUC', validation?.roc_auc, finalTest?.roc_auc],
              ].map(([label, v, t]) => (
                <div key={String(label)}>
                  <div className="flex justify-between text-xs mb-1">
                    <span className="opacity-70">{String(label)}</span>
                    <span>{pct(Number(t))} <span className="opacity-50">/</span> {pct(Number(v))}</span>
                  </div>
                  <div className="h-2 rounded-full bg-black/10 overflow-hidden">
                    <div
                      className="h-full rounded-full bg-[var(--color-accent-600)]"
                      style={{ width: `${Math.max(0, Math.min(100, Number(t) * 100))}%` }}
                    />
                  </div>
                </div>
              ))}
              <div className="text-[10px] opacity-50 pt-1">Holdout / Validation</div>
            </div>
          </Panel>

          <Panel title="Hybrid Weights">
            <div className="space-y-3">
              {[
                ['LightGBM', data.hybrid_weights?.lightgbm],
                ['Isolation Forest', data.hybrid_weights?.anomaly],
                ['Rules', data.hybrid_weights?.rules],
              ].map(([label, value]) => (
                <div key={String(label)} className="flex items-center justify-between border-b border-[var(--color-line-100)] pb-2.5 last:border-b-0">
                  <span className="text-xs opacity-70">{String(label)}</span>
                  <span className="font-semibold text-xs">{pct(Number(value))}</span>
                </div>
              ))}
            </div>
            <p className="text-[11px] opacity-50 mt-3">
              These are the production hybrid score weights used during optimization.
            </p>
          </Panel>
        </div>

        <Panel title="Threshold vs Detection Performance">
          <div className="h-[340px]">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData} margin={{ top: 10, right: 20, left: 0, bottom: 10 }}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="threshold" />
                <YAxis domain={[0, 1]} tickFormatter={(v) => `${Math.round(Number(v) * 100)}%`} />
                <Tooltip formatter={(v) => pct(Number(v))} />
                <Legend />
                {data.best_threshold != null && (
                  <ReferenceLine
                    x={data.best_threshold}
                    strokeDasharray="5 5"
                    label={{ value: `Best ${data.best_threshold}`, position: 'top' }}
                  />
                )}
                <Line type="monotone" dataKey="precision" name="Precision" dot={false} />
                <Line type="monotone" dataKey="recall" name="Recall" dot={false} />
                <Line type="monotone" dataKey="f1" name="F1" strokeWidth={3} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </Panel>

        <Panel title="False Positive / False Negative Trade-off">
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData} margin={{ top: 10, right: 20, left: 0, bottom: 10 }}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="threshold" />
                <YAxis domain={[0, 1]} tickFormatter={(v) => `${Math.round(Number(v) * 100)}%`} />
                <Tooltip formatter={(v) => pct(Number(v))} />
                <Legend />
                {data.best_threshold != null && (
                  <ReferenceLine
                    x={data.best_threshold}
                    strokeDasharray="5 5"
                    label={{ value: `Best ${data.best_threshold}`, position: 'top' }}
                  />
                )}
                <Line type="monotone" dataKey="fpr" name="False Positive Rate" dot={false} />
                <Line type="monotone" dataKey="fnr" name="False Negative Rate" dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </Panel>

        <Panel title="Threshold Benchmark">
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="text-left border-b border-[var(--color-line-100)]">
                  <th className="py-2.5 pr-4">Threshold</th>
                  <th className="py-2.5 pr-4">Precision</th>
                  <th className="py-2.5 pr-4">Recall</th>
                  <th className="py-2.5 pr-4">F1</th>
                  <th className="py-2.5 pr-4">FPR</th>
                  <th className="py-2.5">FNR</th>
                </tr>
              </thead>
              <tbody>
                {chartData.map((row) => (
                  <tr
                    key={row.threshold}
                    className={`border-b border-[var(--color-line-100)] last:border-b-0 ${
                      row.threshold === data.best_threshold ? 'font-semibold bg-[var(--color-surface-2)]' : ''
                    }`}
                  >
                    <td className="py-2.5 pr-4 font-mono">
                      {row.threshold}
                      {row.threshold === data.best_threshold && (
                        <span className="ml-2 text-[10px] text-[var(--color-accent-600)] font-semibold">BEST</span>
                      )}
                    </td>
                    <td className="py-2.5 pr-4 font-mono">{pct(row.precision)}</td>
                    <td className="py-2.5 pr-4 font-mono">{pct(row.recall)}</td>
                    <td className="py-2.5 pr-4 font-mono">{pct(row.f1)}</td>
                    <td className="py-2.5 pr-4 font-mono">{pct(row.fpr)}</td>
                    <td className="py-2.5 font-mono">{pct(row.fnr)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Panel>

        <Panel title="Final Holdout Evaluation">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <div className="text-[10px] uppercase text-[var(--color-ink-400)]">Precision</div>
              <div className="text-lg font-semibold font-mono mt-0.5">{pct(finalTest?.precision)}</div>
            </div>
            <div>
              <div className="text-[10px] uppercase text-[var(--color-ink-400)]">Recall</div>
              <div className="text-lg font-semibold font-mono mt-0.5">{pct(finalTest?.recall)}</div>
            </div>
            <div>
              <div className="text-[10px] uppercase text-[var(--color-ink-400)]">F1</div>
              <div className="text-lg font-semibold font-mono mt-0.5">{pct(finalTest?.f1)}</div>
            </div>
            <div>
              <div className="text-[10px] uppercase text-[var(--color-ink-400)]">ROC-AUC</div>
              <div className="text-lg font-semibold font-mono mt-0.5">{num(finalTest?.roc_auc)}</div>
            </div>
          </div>
        </Panel>
      </div>
    </div>
  )
}
