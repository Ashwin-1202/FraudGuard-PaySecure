import { useState } from 'react'
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import TopBar from '../components/TopBar'
import Panel from '../components/Panel'
import MetricStrip from '../components/MetricStrip'
import RiskDistributionBar from '../components/RiskDistributionBar'
import RiskTrendChart from '../components/RiskTrendChart'
import { EmptyState, ErrorState } from '../components/EmptyState'
import { SkeletonMetrics, SkeletonCard } from '../components/SkeletonLoader'
import { usePolling } from '../hooks/usePolling'
import { getAnalytics } from '../api/analytics'
import { getSystemStatus } from '../api/system'
import { formatCurrency, formatPercent, formatScore } from '../lib/format'

const axisStyle = { fontSize: 10, fill: 'var(--color-ink-400)' }

type DateRange = '24H' | '7D' | '30D' | 'ALL'

export default function Analytics() {
  const [dateRange, setDateRange] = useState<DateRange>('ALL')

  const status = usePolling(getSystemStatus, 20000)
  const analytics = usePolling(getAnalytics, 15000)
  const a = analytics.data

  return (
    <div className="flex-1 flex flex-col min-h-0">
      <TopBar
        title="Fraud Analytics"
        subtitle="Portfolio-level risk distribution, probability modeling, and behavioral metrics"
        status={status.data}
        lastUpdated={analytics.lastUpdated}
        onRefresh={analytics.refresh}
      />

      <div className="flex-1 overflow-y-auto scrollbar-thin p-3 sm:p-5 space-y-4 sm:space-y-5">
        {/* DATE RANGE CONTROLS */}
        <div className="flex flex-wrap items-center justify-between gap-3 p-3 rounded-[3px] border border-[var(--color-line-100)] bg-[var(--color-surface-1)]">
          <div className="flex items-center gap-2">
            <span className="text-[11.5px] font-medium text-[var(--color-ink-600)]">Analysis Horizon:</span>
            <div className="flex items-center border border-[var(--color-line-200)] rounded-[3px] overflow-hidden text-[11px]">
              {(
                [
                  { id: '24H', label: 'Last 24 Hours' },
                  { id: '7D', label: 'Last 7 Days' },
                  { id: '30D', label: 'Last 30 Days' },
                  { id: 'ALL', label: 'All Processed Records' },
                ] as const
              ).map((d) => (
                <button
                  key={d.id}
                  onClick={() => setDateRange(d.id)}
                  className={`h-7 px-2.5 sm:px-3 font-medium border-r border-[var(--color-line-200)] last:border-r-0 transition-colors ${
                    dateRange === d.id
                      ? 'bg-[var(--color-ink-900)] text-white'
                      : 'bg-[var(--color-surface-1)] text-[var(--color-ink-600)] hover:bg-[var(--color-surface-2)]'
                  }`}
                >
                  {d.label}
                </button>
              ))}
            </div>
          </div>

          <span className="text-[11px] text-[var(--color-ink-400)] italic">
            Telemetry fed from backend data store
          </span>
        </div>

        {analytics.loading && !a ? (
          <div className="space-y-4">
            <SkeletonMetrics count={5} />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <SkeletonCard height={180} />
              <SkeletonCard height={180} />
            </div>
          </div>
        ) : analytics.error && !a ? (
          <ErrorState message={analytics.error} onRetry={analytics.refresh} />
        ) : !a || a.total_transactions === 0 ? (
          <div className="p-12 text-center">
            <EmptyState message="More transaction data is required to generate analytics." />
          </div>
        ) : (
          <>
            {/* PORTFOLIO METRICS */}
            <MetricStrip
              metrics={[
                { label: 'Total Volume', value: a.total_transactions.toLocaleString(), hint: 'Evaluated transactions' },
                { label: 'Portfolio Fraud Rate', value: formatPercent(a.fraud_rate), tone: 'var(--color-risk-high)', hint: 'High + Critical' },
                { label: 'Critical Tier Count', value: a.critical_count, tone: 'var(--color-risk-critical)', hint: 'Score ≥ 85' },
                { label: 'Avg Risk Score', value: formatScore(a.average_risk_score), hint: 'Scale (0-100)' },
                { label: 'Avg Payment Amount', value: formatCurrency(a.average_transaction_amount), hint: 'Mean ticket size' },
              ]}
            />

            {/* CHARTS GRID 1: Risk Distribution & Fraud Probability */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-5">
              <Panel title="Fraud Risk Distribution" subtitle="Low vs Medium vs High vs Critical categorizations">
                <RiskDistributionBar distribution={a.risk_distribution ?? {}} />
              </Panel>

              <Panel title="Fraud Probability Distribution" subtitle="Model confidence frequency buckets">
                {a.fraud_probability_distribution && a.fraud_probability_distribution.length > 0 ? (
                  <div style={{ width: '100%', height: 180 }}>
                    <ResponsiveContainer>
                      <BarChart data={a.fraud_probability_distribution} margin={{ left: -18, right: 8, top: 6 }}>
                        <CartesianGrid vertical={false} stroke="var(--color-line-100)" />
                        <XAxis dataKey="bucket" tick={axisStyle} axisLine={{ stroke: 'var(--color-line-100)' }} tickLine={false} />
                        <YAxis tick={axisStyle} axisLine={false} tickLine={false} width={30} />
                        <Tooltip
                          contentStyle={{ fontSize: 11, borderRadius: 3, border: '1px solid var(--color-line-200)', boxShadow: 'none' }}
                        />
                        <Bar dataKey="count" fill="var(--color-accent-600)" radius={[2, 2, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                ) : (
                  <EmptyState message="No fraud probability distribution reported." />
                )}
              </Panel>
            </div>

            {/* CHARTS GRID 2: Transaction Volume & Risk Trend */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-5">
              <Panel title="Transactions Over Time" subtitle="Real-time payment throughput per interval">
                {a.transaction_volume && a.transaction_volume.length > 0 ? (
                  <div style={{ width: '100%', height: 180 }}>
                    <ResponsiveContainer>
                      <BarChart data={a.transaction_volume} margin={{ left: -18, right: 8, top: 6 }}>
                        <CartesianGrid vertical={false} stroke="var(--color-line-100)" />
                        <XAxis dataKey="time" tick={axisStyle} axisLine={{ stroke: 'var(--color-line-100)' }} tickLine={false} />
                        <YAxis tick={axisStyle} axisLine={false} tickLine={false} width={30} />
                        <Tooltip
                          contentStyle={{ fontSize: 11, borderRadius: 3, border: '1px solid var(--color-line-200)', boxShadow: 'none' }}
                        />
                        <Bar dataKey="count" fill="var(--color-ink-700)" radius={[2, 2, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                ) : (
                  <EmptyState message="No transaction volume data reported." />
                )}
              </Panel>

              <Panel title="Risk Score Over Time" subtitle="Chronological index volatility">
                <RiskTrendChart data={a.risk_score_over_time ?? []} height={180} />
              </Panel>
            </div>

            {/* CHARTS GRID 3: Top Fraud Signals & Top SHAP Features */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-5">
              <Panel title="Top Fraud Signals (Frequency)" subtitle="Most prevalent business rule & heuristic flags" padded={false}>
                {a.top_fraud_indicators && a.top_fraud_indicators.length > 0 ? (
                  <ul className="divide-y divide-[var(--color-line-100)]">
                    {a.top_fraud_indicators.map((f) => (
                      <li key={f.name} className="flex items-center justify-between px-4 py-2.5 text-[12.5px] hover:bg-[var(--color-surface-2)] transition-colors">
                        <div className="flex items-center gap-2">
                          <span className="h-1.5 w-1.5 rounded-full bg-[var(--color-risk-high)]" />
                          <span className="text-[var(--color-ink-800)]">{f.name}</span>
                        </div>
                        <span className="font-mono font-semibold tabular text-[var(--color-ink-900)]">{f.count}</span>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <div className="p-4">
                    <EmptyState message="No fraud indicators reported." />
                  </div>
                )}
              </Panel>

              <Panel title="Top SHAP Features (Model Impact)" subtitle="Mean absolute feature attribution weights" padded={false}>
                {a.top_shap_features && a.top_shap_features.length > 0 ? (
                  <ul className="divide-y divide-[var(--color-line-100)]">
                    {a.top_shap_features.map((f) => (
                      <li key={f.feature} className="flex items-center justify-between px-4 py-2.5 text-[12.5px] hover:bg-[var(--color-surface-2)] transition-colors">
                        <div className="flex items-center gap-2">
                          <span className="h-1.5 w-1.5 rounded-full bg-[var(--color-accent-600)]" />
                          <span className="text-[var(--color-ink-800)] capitalize">{f.feature.replace(/_/g, ' ')}</span>
                        </div>
                        <span className="font-mono font-semibold tabular text-[var(--color-accent-600)]">
                          +{f.avg_contribution.toFixed(3)}
                        </span>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <div className="p-4">
                    <EmptyState message="No SHAP feature summary reported." />
                  </div>
                )}
              </Panel>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
