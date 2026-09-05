import { useNavigate } from 'react-router-dom'
import RiskBadge from './RiskBadge'
import { EmptyState, LoadingRows } from './EmptyState'
import { formatDateTime } from '../lib/format'
import type { Alert } from '../types'

interface AlertTableProps {
  alerts: Alert[]
  loading?: boolean
  busyId?: string | null
  onAcknowledge: (id: string) => void
  onResolve: (id: string) => void
}

function statusTone(status: string) {
  const s = status.toUpperCase()
  if (s === 'OPEN') return 'text-[var(--color-risk-high)]'
  if (s === 'ACKNOWLEDGED') return 'text-[var(--color-risk-medium)]'
  if (s === 'RESOLVED') return 'text-[var(--color-risk-low)]'
  return 'text-[var(--color-ink-500)]'
}

export default function AlertTable({ alerts, loading, busyId, onAcknowledge, onResolve }: AlertTableProps) {
  const navigate = useNavigate()

  if (loading && alerts.length === 0) return <LoadingRows rows={6} />
  if (!loading && alerts.length === 0) return <EmptyState message="No open fraud alerts." />

  return (
    <div className="overflow-x-auto scrollbar-thin max-w-full">
      <table className="w-full min-w-[650px] text-[12px] border-collapse">
        <thead>
          <tr className="border-b border-[var(--color-line-100)] text-left text-[10.5px] uppercase tracking-wide text-[var(--color-ink-400)]">
            <th className="py-2.5 pl-3 pr-3 font-medium whitespace-nowrap">Alert</th>
            <th className="py-2.5 px-3 font-medium whitespace-nowrap">Transaction</th>
            <th className="py-2.5 px-3 font-medium whitespace-nowrap">Severity</th>
            <th className="py-2.5 px-3 font-medium text-right whitespace-nowrap">Risk Score</th>
            <th className="py-2.5 px-3 font-medium whitespace-nowrap">Status</th>
            <th className="py-2.5 px-3 font-medium whitespace-nowrap">Created</th>
            <th className="py-2.5 pr-3 pl-3 font-medium text-right whitespace-nowrap">Actions</th>
          </tr>
        </thead>
        <tbody>
          {alerts.map((a) => (
            <tr key={a.alert_id} className="border-b border-[var(--color-line-100)] hover:bg-[var(--color-surface-2)] transition-colors">
              <td className="py-2.5 pl-3 pr-3 font-mono text-[11.5px] text-[var(--color-ink-900)] whitespace-nowrap">{a.alert_id}</td>
              <td
                className="py-2.5 px-3 font-mono text-[11.5px] text-[var(--color-accent-600)] cursor-pointer hover:underline whitespace-nowrap"
                onClick={() => navigate(`/transactions/${encodeURIComponent(a.transaction_id)}`)}
              >
                {a.transaction_id}
              </td>
              <td className="py-2.5 px-3 whitespace-nowrap">
                <RiskBadge level={a.severity} size="sm" />
              </td>
              <td className="py-2.5 px-3 text-right tabular font-medium text-[var(--color-ink-900)] whitespace-nowrap">{a.risk_score.toFixed(1)}</td>
              <td className={`py-2.5 px-3 font-semibold text-[11px] uppercase whitespace-nowrap ${statusTone(a.status)}`}>{a.status}</td>
              <td className="py-2.5 px-3 text-[var(--color-ink-500)] tabular whitespace-nowrap">{formatDateTime(a.created_at)}</td>
              <td className="py-2.5 pr-3 pl-3 whitespace-nowrap">
                <div className="flex items-center justify-end gap-1.5">
                  <button
                    disabled={a.status.toUpperCase() !== 'OPEN' || busyId === a.alert_id}
                    onClick={() => onAcknowledge(a.alert_id)}
                    className="text-[10.5px] font-medium px-2 py-1 rounded-[3px] border border-[var(--color-line-200)] text-[var(--color-ink-700)] hover:bg-[var(--color-surface-2)] disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    Acknowledge
                  </button>
                  <button
                    disabled={a.status.toUpperCase() === 'RESOLVED' || busyId === a.alert_id}
                    onClick={() => onResolve(a.alert_id)}
                    className="text-[10.5px] font-medium px-2 py-1 rounded-[3px] border border-[var(--color-accent-500)] text-[var(--color-accent-600)] hover:bg-[var(--color-accent-100)] disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    Resolve
                  </button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
