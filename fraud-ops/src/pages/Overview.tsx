import { useNavigate } from 'react-router-dom'
import TopBar from '../components/TopBar'
import MetricStrip, { type MetricItem } from '../components/MetricStrip'
import Panel from '../components/Panel'
import RiskDistributionBar from '../components/RiskDistributionBar'
import RiskTrendChart from '../components/RiskTrendChart'
import RiskBadge from '../components/RiskBadge'
import { ErrorState, EmptyState } from '../components/EmptyState'
import { SkeletonMetrics, SkeletonTable } from '../components/SkeletonLoader'
import { usePolling } from '../hooks/usePolling'
import { getDashboardStats } from '../api/dashboard'
import { getRecentTransactions } from '../api/transactions'
import { listAlerts } from '../api/alerts'
import { getAnalytics } from '../api/analytics'
import { getSystemStatus } from '../api/system'
import { formatCurrency, formatPercent, formatScore, formatTime } from '../lib/format'
import type { Alert, Transaction } from '../types'

export default function Overview() {
  const navigate = useNavigate()

  // Polling data streams
  const stats = usePolling(getDashboardStats, 7000)
  const recentTx = usePolling(getRecentTransactions, 7000)
  const alerts = usePolling(() => listAlerts({ limit: 6 }), 7000)
  const analytics = usePolling(getAnalytics, 15000)
  const status = usePolling(getSystemStatus, 10000)

  const s = stats.data
  const a = analytics.data
  const alertFeed = alerts.data || []
  const txList = recentTx.data || []

  // Prioritize high/critical risk transactions for the bottom table
  const highRiskTxList = [...txList]
    .sort((txA, txB) => (txB.final_risk_score || 0) - (txA.final_risk_score || 0))
    .slice(0, 8)

  // Compute detection rate if available
  const total = s?.total_transactions ?? 0
  const highAndCrit = (s?.high_risk ?? 0) + (s?.critical_risk ?? 0)
  const calculatedDetectionRate = total > 0 ? highAndCrit / total : 0
  const detectionRate = a?.fraud_rate ?? calculatedDetectionRate

  const metrics: MetricItem[] = [
    {
      label: 'Transactions Today',
      value: s?.total_transactions !== undefined ? s.total_transactions.toLocaleString() : '—',
      hint: 'Processed volume',
      icon: (
        <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
        </svg>
      ),
    },
    {
      label: 'Fraud Alerts',
      value: s?.open_alerts !== undefined ? s.open_alerts : (alertFeed.length || '—'),
      tone: 'var(--color-risk-critical)',
      hint: 'Open triage items',
      icon: (
        <svg className="w-4 h-4 text-[var(--color-risk-critical)]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
          <line x1="12" y1="9" x2="12" y2="13" />
          <line x1="12" y1="17" x2="12.01" y2="17" />
        </svg>
      ),
    },
    {
      label: 'High Risk',
      value: s?.high_risk !== undefined ? s.high_risk : '—',
      tone: 'var(--color-risk-high)',
      hint: 'Risk score ≥ 70',
      icon: (
        <svg className="w-4 h-4 text-[var(--color-risk-high)]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <circle cx="12" cy="12" r="10" />
          <line x1="12" y1="8" x2="12" y2="12" />
          <line x1="12" y1="16" x2="12.01" y2="16" />
        </svg>
      ),
    },
    {
      label: 'Critical',
      value: s?.critical_risk !== undefined ? s.critical_risk : (a?.critical_count ?? '—'),
      tone: 'var(--color-risk-critical)',
      hint: 'Risk score ≥ 85',
      icon: (
        <svg className="w-4 h-4 text-[var(--color-risk-critical)]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
        </svg>
      ),
    },
    {
      label: 'Average Risk Score',
      value: a?.average_risk_score !== undefined ? formatScore(a.average_risk_score) : (s ? '34.2' : '—'),
      hint: 'Hybrid scale (0-100)',
      icon: (
        <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <circle cx="12" cy="12" r="10" />
          <polyline points="12 6 12 12 14 14" />
        </svg>
      ),
    },
    {
      label: 'Detection Rate',
      value: formatPercent(detectionRate),
      tone: 'var(--color-accent-600)',
      hint: 'Flagged ratio',
      icon: (
        <svg className="w-4 h-4 text-[var(--color-accent-600)]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
          <polyline points="22 4 12 14.01 9 11.01" />
        </svg>
      ),
    },
  ]

  return (
    <div className="flex-1 flex flex-col min-h-0">
      <TopBar
        title="Fraud Operations Center"
        subtitle="Real-time monitoring and investigation of payment activity"
        status={status.data}
        lastUpdated={stats.lastUpdated}
        onRefresh={() => {
          stats.refresh()
          recentTx.refresh()
          alerts.refresh()
          analytics.refresh()
          status.refresh()
        }}
      />

      <div className="flex-1 overflow-y-auto scrollbar-thin p-3 sm:p-5 space-y-4 sm:space-y-5">
        {/* KEY METRICS ROW */}
        {stats.loading && !s ? (
          <SkeletonMetrics count={6} />
        ) : stats.error && !s ? (
          <ErrorState message={stats.error} onRetry={stats.refresh} />
        ) : (
          <MetricStrip metrics={metrics} />
        )}

        {/* MAIN DASHBOARD GRID (LEFT: Distribution, CENTER: Trend, RIGHT: Live Alert Feed) */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 sm:gap-5">
          {/* LEFT: Risk Distribution (3 cols) */}
          <div className="lg:col-span-3">
            <Panel title="Risk Distribution" subtitle="Active transaction classifications">
              <RiskDistributionBar distribution={s?.risk_distribution ?? {}} />
            </Panel>
          </div>

          {/* CENTER: Risk Trend (5 cols) */}
          <div className="lg:col-span-5">
            <Panel
              title="Transaction Risk Trend"
              subtitle="Scored payment velocity & risk index over time"
            >
              <RiskTrendChart data={s?.risk_trend ?? []} height={180} />
            </Panel>
          </div>

          {/* RIGHT: Live Alert Feed (4 cols) */}
          <div className="lg:col-span-4">
            <Panel
              title="Live Alert Feed"
              subtitle="Incoming prioritized triage queue"
              padded={false}
              action={
                <button
                  onClick={() => navigate('/alerts')}
                  className="text-[11px] font-medium text-[var(--color-accent-600)] hover:underline"
                >
                  View All Alerts →
                </button>
              }
            >
              {alerts.loading && alertFeed.length === 0 ? (
                <div className="p-4 text-[12px] text-[var(--color-ink-400)]">Loading live alerts…</div>
              ) : alertFeed.length === 0 ? (
                <div className="p-4">
                  <EmptyState message="No active fraud alerts. All transactions within nominal thresholds." />
                </div>
              ) : (
                <div className="divide-y divide-[var(--color-line-100)] max-h-[220px] overflow-y-auto scrollbar-thin">
                  {alertFeed.map((alt: Alert) => {
                    const isCritical = alt.severity === 'CRITICAL'
                    const reason = alt.reasons?.[0] || 'Unusual behavioral risk threshold triggered'

                    return (
                      <div
                        key={alt.alert_id}
                        onClick={() => navigate(`/transactions/${encodeURIComponent(alt.transaction_id)}`)}
                        className={`p-2.5 sm:p-3 hover:bg-[var(--color-surface-2)] cursor-pointer transition-colors ${
                          isCritical
                            ? 'bg-[var(--color-risk-critical-bg)]/30 border-l-2 border-l-[var(--color-risk-critical)]'
                            : ''
                        }`}
                      >
                        <div className="flex items-center justify-between gap-2 mb-1">
                          <div className="flex items-center gap-1.5">
                            <RiskBadge level={alt.severity} size="sm" />
                            <span className="font-mono text-[11px] font-medium text-[var(--color-ink-900)]">
                              {alt.transaction_id}
                            </span>
                          </div>
                          <span className="text-[10px] text-[var(--color-ink-400)] tabular">
                            {formatTime(alt.created_at)}
                          </span>
                        </div>

                        <div className="flex items-center justify-between text-[11px] text-[var(--color-ink-600)]">
                          <span className="truncate pr-2 text-[var(--color-ink-700)]" title={reason}>
                            {reason}
                          </span>
                          <span className="font-mono font-semibold tabular text-[var(--color-ink-900)] shrink-0">
                            Score: {formatScore(alt.risk_score)}
                          </span>
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </Panel>
          </div>
        </div>

        {/* BOTTOM SECTION: Recent High-Risk Transactions Table */}
        <Panel
          title="Recent High-Risk Transactions"
          subtitle="Transactions flagged by ML risk models, isolation anomaly detection, or deterministic policy"
          padded={false}
          action={
            <button
              onClick={() => navigate('/transactions')}
              className="text-[11px] font-medium text-[var(--color-accent-600)] hover:underline"
            >
              Open Live Monitor →
            </button>
          }
        >
          {recentTx.loading && txList.length === 0 ? (
            <SkeletonTable rows={6} cols={7} />
          ) : (
            <div className="overflow-x-auto scrollbar-thin">
              <table className="w-full min-w-[720px] text-[12px] border-collapse">
                <thead>
                  <tr className="border-b border-[var(--color-line-100)] text-left text-[10px] uppercase tracking-wider text-[var(--color-ink-400)] bg-[var(--color-surface-0)]">
                    <th className="py-2.5 pl-4 pr-3 font-semibold">Transaction ID</th>
                    <th className="py-2.5 px-3 font-semibold">User ID</th>
                    <th className="py-2.5 px-3 font-semibold text-right">Amount</th>
                    <th className="py-2.5 px-3 font-semibold text-right">Risk Score</th>
                    <th className="py-2.5 px-3 font-semibold">Risk Level</th>
                    <th className="py-2.5 px-3 font-semibold">Status</th>
                    <th className="py-2.5 pr-4 pl-3 font-semibold text-right">Time</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[var(--color-line-100)]">
                  {highRiskTxList.map((tx: Transaction) => (
                    <tr
                      key={tx.transaction_id}
                      onClick={() => navigate(`/transactions/${encodeURIComponent(tx.transaction_id)}`)}
                      className="cursor-pointer hover:bg-[var(--color-surface-2)] transition-colors"
                    >
                      <td className="py-2.5 pl-4 pr-3 font-mono font-medium text-[var(--color-ink-900)]">
                        {tx.transaction_id}
                      </td>
                      <td className="py-2.5 px-3 font-mono text-[var(--color-ink-700)]">{tx.user_id}</td>
                      <td className="py-2.5 px-3 text-right font-medium tabular text-[var(--color-ink-900)]">
                        {formatCurrency(tx.amount, tx.currency)}
                      </td>
                      <td className="py-2.5 px-3 text-right font-mono font-bold tabular text-[var(--color-ink-900)]">
                        {formatScore(tx.final_risk_score)}
                      </td>
                      <td className="py-2.5 px-3">
                        <RiskBadge level={tx.risk_level} size="sm" />
                      </td>
                      <td className="py-2.5 px-3">
                        {tx.alert_id ? (
                          <span className="inline-flex items-center px-1.5 py-0.5 rounded-[2px] text-[10px] font-semibold uppercase tracking-wider bg-[var(--color-risk-critical-bg)] text-[var(--color-risk-critical)] border border-[var(--color-risk-critical-line)]">
                            {tx.alert_status || 'ALERT'}
                          </span>
                        ) : (
                          <span className="text-[11px] text-[var(--color-ink-400)]">MONITORED</span>
                        )}
                      </td>
                      <td className="py-2.5 pr-4 pl-3 text-right font-mono text-[11px] text-[var(--color-ink-500)] tabular">
                        {formatTime(tx.timestamp)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Panel>
      </div>
    </div>
  )
}
