import RiskBadge from './RiskBadge'
import { formatCurrency, formatDateTime, formatScore } from '../lib/format'
import type { Transaction } from '../types'

export default function TransactionHeader({ tx }: { tx: Transaction }) {
  return (
    <div className="border border-[var(--color-line-100)] bg-[var(--color-surface-1)] rounded-[3px] px-3 sm:px-5 py-3 sm:py-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-4">
      <div>
        <div className="text-[10.5px] uppercase tracking-wide text-[var(--color-ink-400)] mb-1">Transaction</div>
        <div className="flex items-center gap-3 flex-wrap">
          <span className="font-mono text-[14px] sm:text-[16px] font-semibold text-[var(--color-ink-900)] break-all">{tx.transaction_id}</span>
          <RiskBadge level={tx.risk_level} />
        </div>
        <div className="text-[11.5px] text-[var(--color-ink-500)] mt-1">
          User {tx.user_id} · {formatDateTime(tx.timestamp)}
        </div>
      </div>

      <div className="flex items-center gap-4 sm:gap-6 self-end sm:self-auto">
        <div className="text-right">
          <div className="text-[10.5px] uppercase tracking-wide text-[var(--color-ink-400)]">Amount</div>
          <div className="text-[16px] sm:text-[18px] font-semibold tabular text-[var(--color-ink-900)]">
            {formatCurrency(tx.amount, tx.currency)}
          </div>
        </div>
        <div className="w-px h-9 bg-[var(--color-line-100)]" />
        <div className="text-right">
          <div className="text-[10.5px] uppercase tracking-wide text-[var(--color-ink-400)]">Final Risk Score</div>
          <div className="text-[16px] sm:text-[18px] font-semibold tabular text-[var(--color-ink-900)]">
            {formatScore(tx.final_risk_score)}
          </div>
        </div>
      </div>
    </div>
  )
}
