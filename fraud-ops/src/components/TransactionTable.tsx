import { useNavigate } from 'react-router-dom'
import RiskBadge from './RiskBadge'
import { formatCurrency, formatPercent, formatScore, formatTime } from '../lib/format'
import { EmptyState, LoadingRows } from './EmptyState'
import type { Transaction } from '../types'

interface TransactionTableProps {
  transactions: Transaction[]
  loading?: boolean
  emptyMessage?: string
  compact?: boolean
}

function getAlertBadgeStyle(status?: string | null) {
  const s = (status || 'OPEN').toUpperCase()
  if (s === 'OPEN') return 'bg-[var(--color-risk-critical-bg)] text-[var(--color-risk-critical)] border-[var(--color-risk-critical-line)]'
  if (s === 'ACKNOWLEDGED') return 'bg-[var(--color-risk-medium-bg)] text-[var(--color-risk-medium)] border-[var(--color-risk-medium-line)]'
  if (s === 'RESOLVED') return 'bg-[var(--color-risk-low-bg)] text-[var(--color-risk-low)] border-[var(--color-risk-low-line)]'
  return 'bg-[var(--color-surface-2)] text-[var(--color-ink-600)] border-[var(--color-line-200)]'
}

export default function TransactionTable({ transactions, loading, emptyMessage = 'No transactions recorded yet.', compact }: TransactionTableProps) {
  const navigate = useNavigate()

  if (loading && transactions.length === 0) return <LoadingRows rows={8} />
  if (!loading && transactions.length === 0) return <EmptyState message={emptyMessage} />

  return (
    <div className="overflow-x-auto scrollbar-thin max-w-full">
      <table className="w-full min-w-[700px] text-[12px] border-collapse">
        <thead>
          <tr className="border-b border-[var(--color-line-100)] text-left text-[10.5px] uppercase tracking-wide text-[var(--color-ink-400)]">
            <th className="py-2.5 pl-3 pr-3 font-medium whitespace-nowrap">Transaction</th>
            <th className="py-2.5 px-3 font-medium whitespace-nowrap">User</th>
            <th className="py-2.5 px-3 font-medium text-right whitespace-nowrap">Amount</th>
            <th className="py-2.5 px-3 font-medium whitespace-nowrap">Risk</th>
            <th className="py-2.5 px-3 font-medium text-right whitespace-nowrap">Score</th>
            <th className="py-2.5 px-3 font-medium text-right whitespace-nowrap">Fraud Prob.</th>
            <th className="py-2.5 px-3 font-medium text-right whitespace-nowrap">Anomaly</th>
            <th className="py-2.5 px-3 font-medium whitespace-nowrap">Time</th>
            <th className="py-2.5 pr-3 pl-3 font-medium whitespace-nowrap">Alert</th>
          </tr>
        </thead>
        <tbody>
          {transactions.map((tx) => (
            <tr
              key={tx.transaction_id}
              onClick={() => navigate(`/transactions/${encodeURIComponent(tx.transaction_id)}`)}
              className="border-b border-[var(--color-line-100)] cursor-pointer hover:bg-[var(--color-surface-2)] transition-colors"
            >
              <td className={`py-2.5 pl-3 pr-3 font-mono text-[11.5px] text-[var(--color-ink-900)] whitespace-nowrap ${compact ? '' : 'font-medium'}`}>
                {tx.transaction_id}
              </td>
              <td className="py-2.5 px-3 font-mono text-[11.5px] text-[var(--color-ink-700)] whitespace-nowrap">{tx.user_id}</td>
              <td className="py-2.5 px-3 text-right tabular font-medium text-[var(--color-ink-900)] whitespace-nowrap">
                {formatCurrency(tx.amount, tx.currency)}
              </td>
              <td className="py-2.5 px-3 whitespace-nowrap">
                <RiskBadge level={tx.risk_level} size="sm" />
              </td>
              <td className="py-2.5 px-3 text-right tabular text-[var(--color-ink-900)] font-medium whitespace-nowrap">
                {formatScore(tx.final_risk_score)}
              </td>
              <td className="py-2.5 px-3 text-right tabular text-[var(--color-ink-500)] whitespace-nowrap">
                {formatPercent(tx.fraud_probability)}
              </td>
              <td className="py-2.5 px-3 text-right tabular text-[var(--color-ink-500)] whitespace-nowrap">
                {formatScore(tx.anomaly_score)}
              </td>
              <td className="py-2.5 px-3 text-[var(--color-ink-500)] tabular whitespace-nowrap">{formatTime(tx.timestamp)}</td>
              <td className="py-2.5 pr-3 pl-3 whitespace-nowrap">
                {tx.alert_id ? (
                  <span className={`inline-flex items-center px-1.5 py-0.5 rounded-[3px] border text-[10px] font-semibold uppercase tracking-wider ${getAlertBadgeStyle(tx.alert_status)}`}>
                    {tx.alert_status || 'OPEN'}
                  </span>
                ) : (
                  <span className="text-[var(--color-ink-300)]">—</span>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
