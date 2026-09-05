import type { ReactNode } from 'react'

export interface MetricItem {
  label: string
  value: string | number
  tone?: string
  hint?: string
  change?: string
  icon?: ReactNode
}

export default function MetricStrip({ metrics }: { metrics: MetricItem[] }) {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 border border-[var(--color-line-100)] bg-[var(--color-surface-1)] rounded-[3px] divide-x divide-y sm:divide-y-0 divide-[var(--color-line-100)]">
      {metrics.map((m, idx) => (
        <div key={idx} className="p-3 sm:p-3.5 flex flex-col justify-between group hover:bg-[var(--color-surface-0)] transition-colors">
          <div className="flex items-center justify-between gap-1 mb-1.5">
            <span className="text-[10px] uppercase tracking-wider text-[var(--color-ink-400)] font-medium truncate">
              {m.label}
            </span>
            {m.icon && (
              <span className="text-[var(--color-ink-400)] shrink-0 opacity-80 group-hover:opacity-100 transition-opacity">
                {m.icon}
              </span>
            )}
          </div>

          <div className="space-y-1">
            <div
              className="text-[20px] sm:text-[22px] font-bold tabular tracking-tight leading-none"
              style={{ color: m.tone ?? 'var(--color-ink-900)' }}
            >
              {m.value}
            </div>

            <div className="flex items-center gap-1.5 text-[10px] text-[var(--color-ink-400)] truncate">
              {m.change && (
                <span className="font-medium text-[var(--color-ink-600)] bg-[var(--color-surface-2)] px-1 py-0.2 rounded-[2px]">
                  {m.change}
                </span>
              )}
              {m.hint && <span className="truncate">{m.hint}</span>}
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}
