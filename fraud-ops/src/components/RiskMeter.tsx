interface RiskMeterProps {
  label: string
  value: number | undefined | null // 0-100
  tone?: string
  compact?: boolean
  valueLabel?: string
}

export default function RiskMeter({ label, value, tone = 'var(--color-ink-700)', compact, valueLabel }: RiskMeterProps) {
  const pct = value === undefined || value === null || Number.isNaN(value) ? 0 : Math.max(0, Math.min(100, value))
  const hasValue = value !== undefined && value !== null && !Number.isNaN(value)

  return (
    <div className={`grid items-center gap-3 ${compact ? 'grid-cols-[96px_1fr_44px]' : 'grid-cols-[140px_1fr_56px]'}`}>
      <span className={`${compact ? 'text-[11px]' : 'text-xs'} text-[var(--color-ink-500)] truncate`}>{label}</span>
      <div className="relative h-2 rounded-[2px] bg-[var(--color-surface-2)] border border-[var(--color-line-100)] overflow-hidden">
        <div
          className="absolute inset-y-0 left-0 rounded-[1px]"
          style={{ width: `${hasValue ? pct : 0}%`, backgroundColor: tone }}
        />
        {/* tick marks at 25/50/75 */}
        {[25, 50, 75].map((t) => (
          <div key={t} className="absolute inset-y-0 w-px bg-[var(--color-surface-0)]/70" style={{ left: `${t}%` }} />
        ))}
      </div>
      <span className={`tabular text-right ${compact ? 'text-[11px]' : 'text-xs'} font-semibold text-[var(--color-ink-900)]`}>
        {hasValue ? valueLabel ?? pct.toFixed(1) : '—'}
      </span>
    </div>
  )
}
