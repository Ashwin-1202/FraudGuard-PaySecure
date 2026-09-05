import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  LineChart,
  Line,
} from 'recharts'
import TopBar from '../components/TopBar'
import Panel from '../components/Panel'
import MetricStrip from '../components/MetricStrip'
import { EmptyState } from '../components/EmptyState'
import { usePolling } from '../hooks/usePolling'
import {
  getModelComparison,
  type ModelComparisonResult,
} from '../api/modelComparison'
import { getSystemStatus } from '../api/system'

function pct(value: number) {
  return `${(value * 100).toFixed(1)}%`
}

function seconds(value: number) {
  if (value < 0.001) return `${(value * 1000).toFixed(2)} ms`
  return `${value.toFixed(4)} s`
}

function modelShortName(model: string) {
  return model === 'Random Forest' ? 'Random Forest' : model
}

export default function ModelComparison() {
  const comparison = usePolling(getModelComparison, 15000)
  const status = usePolling(getSystemStatus, 20000)
  const { data, loading, error } = comparison

  if (loading && !data) {
    return (
      <div className="flex-1 flex flex-col min-h-0 bg-[var(--color-surface-0)]">
        <TopBar
          title="Model Comparison"
          status={status.data}
          lastUpdated={comparison.lastUpdated}
        />
        <div className="flex-1 overflow-y-auto scrollbar-thin p-4">
          <div className="text-[12px] text-[var(--color-ink-400)]">
            Loading model comparison…
          </div>
        </div>
      </div>
    )
  }

  if (error || !data) {
    return (
      <div className="flex-1 flex flex-col min-h-0 bg-[var(--color-surface-0)]">
        <TopBar
          title="Model Comparison"
          status={status.data}
          lastUpdated={comparison.lastUpdated}
        />
        <div className="flex-1 overflow-y-auto scrollbar-thin p-4">
          <EmptyState
            message={error || 'No comparison results are available.'}
          />
        </div>
      </div>
    )
  }

  const results: ModelComparisonResult[] = data.results || []
  const best = data.best_result

  const performanceData = results.map((item) => ({
    model: modelShortName(item.model),
    Precision: Number((item.precision * 100).toFixed(2)),
    Recall: Number((item.recall * 100).toFixed(2)),
    F1: Number((item.f1_score * 100).toFixed(2)),
    'ROC-AUC': Number((item.roc_auc * 100).toFixed(2)),
  }))

  const speedData = results.map((item) => ({
    model: modelShortName(item.model),
    'Training (s)': Number(item.training_time_seconds.toFixed(4)),
    'Inference (s)': Number(item.inference_time_seconds.toFixed(6)),
  }))

  return (
    <div className="flex-1 flex flex-col min-h-0 bg-[var(--color-surface-0)]">
      <TopBar
        title="Model Comparison"
        subtitle="Benchmark of candidate fraud detection models"
        status={status.data}
        lastUpdated={comparison.lastUpdated}
        onRefresh={comparison.refresh}
      />

      <div className="flex-1 overflow-y-auto scrollbar-thin p-3 sm:p-5 space-y-4 sm:space-y-5">
        <div className="flex items-center justify-between">
          <div>
            <div className="text-[12px] font-semibold text-[var(--color-ink-900)]">
              Model Benchmark
            </div>
            <div className="text-[10px] text-[var(--color-ink-400)] mt-0.5">
              Existing experiment results • {data.total_models} models evaluated
            </div>
          </div>

          <div className="text-right">
            <div className="text-[9px] uppercase tracking-wider text-[var(--color-ink-400)]">
              Selected Model
            </div>
            <div className="text-[13px] font-semibold text-[var(--color-accent-600)]">
              {data.selected_model || '—'}
            </div>
          </div>
        </div>

        <MetricStrip
          metrics={[
            {
              label: 'Selected Model',
              value: data.selected_model || '—',
              hint: 'Experiment winner',
              tone: 'var(--color-accent-600)',
            },
            {
              label: 'Best F1',
              value: best ? pct(best.f1_score) : '—',
              hint: best?.model || 'No result',
            },
            {
              label: 'Best ROC-AUC',
              value:
                results.length
                  ? pct(Math.max(...results.map((r) => r.roc_auc)))
                  : '—',
              hint: 'Across candidates',
            },
            {
              label: 'Transactions',
              value:
                data.dataset.total_transactions != null
                  ? data.dataset.total_transactions.toLocaleString()
                  : '—',
              hint:
                data.dataset.fraud_percentage != null
                  ? `${data.dataset.fraud_percentage.toFixed(2)}% fraud`
                  : undefined,
            },
          ]}
        />

        <Panel
          title="Performance Comparison"
          subtitle="Precision, recall, F1 and ROC-AUC"
        >
          {performanceData.length ? (
            <div className="h-[330px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={performanceData}
                  margin={{ top: 10, right: 20, left: 0, bottom: 10 }}
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="model" tick={{ fontSize: 10 }} />
                  <YAxis
                    domain={[0, 100]}
                    tick={{ fontSize: 10 }}
                    tickFormatter={(v) => `${v}%`}
                  />
                  <Tooltip formatter={(v) => `${Number(v).toFixed(2)}%`} />
                  <Legend wrapperStyle={{ fontSize: 10 }} />
                  <Bar dataKey="Precision" />
                  <Bar dataKey="Recall" />
                  <Bar dataKey="F1" />
                  <Bar dataKey="ROC-AUC" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <EmptyState
              message="The comparison experiment returned no models."
            />
          )}
        </Panel>

        <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
          <Panel
            title="Execution Cost"
            subtitle="Training and inference time"
          >
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={speedData}
                  margin={{ top: 10, right: 20, left: 0, bottom: 10 }}
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="model" tick={{ fontSize: 10 }} />
                  <YAxis tick={{ fontSize: 10 }} />
                  <Tooltip />
                  <Legend wrapperStyle={{ fontSize: 10 }} />
                  <Bar dataKey="Training (s)" />
                  <Bar dataKey="Inference (s)" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </Panel>

          <Panel
            title="Model Quality Trend"
            subtitle="Relative performance across candidates"
          >
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart
                  data={performanceData}
                  margin={{ top: 10, right: 20, left: 0, bottom: 10 }}
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="model" tick={{ fontSize: 10 }} />
                  <YAxis
                    domain={[0, 100]}
                    tick={{ fontSize: 10 }}
                    tickFormatter={(v) => `${v}%`}
                  />
                  <Tooltip formatter={(v) => `${Number(v).toFixed(2)}%`} />
                  <Legend wrapperStyle={{ fontSize: 10 }} />
                  <Line type="monotone" dataKey="F1" strokeWidth={2} />
                  <Line type="monotone" dataKey="ROC-AUC" strokeWidth={2} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </Panel>
        </div>

        <Panel
          title="Detailed Benchmark"
          subtitle="Candidate model metrics from the saved experiment"
        >
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-[var(--color-line-100)]">
                  {[
                    'Model',
                    'Precision',
                    'Recall',
                    'F1',
                    'ROC-AUC',
                    'Training',
                    'Inference',
                    'Status',
                  ].map((head) => (
                    <th
                      key={head}
                      className="px-3 py-2 text-[9px] font-semibold uppercase tracking-wider text-[var(--color-ink-400)]"
                    >
                      {head}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {results.map((item) => {
                  const selected = item.model === data.selected_model

                  return (
                    <tr
                      key={item.model}
                      className={`border-b border-[var(--color-line-100)] ${
                        selected
                          ? 'bg-[var(--color-accent-100)]/40'
                          : ''
                      }`}
                    >
                      <td className="px-3 py-2.5 text-[11px] font-semibold text-[var(--color-ink-900)]">
                        {item.model}
                        {selected && (
                          <span className="ml-2 text-[9px] font-medium text-[var(--color-accent-600)]">
                            SELECTED
                          </span>
                        )}
                      </td>
                      <td className="px-3 py-2.5 text-[11px] font-mono">
                        {pct(item.precision)}
                      </td>
                      <td className="px-3 py-2.5 text-[11px] font-mono">
                        {pct(item.recall)}
                      </td>
                      <td className="px-3 py-2.5 text-[11px] font-mono font-semibold">
                        {pct(item.f1_score)}
                      </td>
                      <td className="px-3 py-2.5 text-[11px] font-mono">
                        {pct(item.roc_auc)}
                      </td>
                      <td className="px-3 py-2.5 text-[11px] font-mono">
                        {seconds(item.training_time_seconds)}
                      </td>
                      <td className="px-3 py-2.5 text-[11px] font-mono">
                        {seconds(item.inference_time_seconds)}
                      </td>
                      <td className="px-3 py-2.5">
                        {selected ? (
                          <span className="text-[9px] font-semibold text-[var(--color-accent-600)]">
                            BEST
                          </span>
                        ) : (
                          <span className="text-[9px] text-[var(--color-ink-400)]">
                            CANDIDATE
                          </span>
                        )}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </Panel>

        <Panel title="Selection Rationale" subtitle="Why the experiment selected this model">
          <div className="rounded-md border border-[var(--color-line-100)] bg-[var(--color-surface-1)] p-3">
            <div className="text-[11px] leading-relaxed text-[var(--color-ink-700)]">
              {data.selection_reason}
            </div>
          </div>
        </Panel>
      </div>
    </div>
  )
}
