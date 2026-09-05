import { riskPalette } from '../lib/risk'
import type { RiskLevel } from '../types'

const ORDER: RiskLevel[] = ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL']

export default function RiskDistributionBar({ distribution }: { distribution: Record<string, number> }) {
  const entries = ORDER.map((level) => ({
    level,
    count: distribution[level] ?? distribution[level.toLowerCase()] ?? 0,
  }))
  const total = entries.reduce((sum, e) => sum + e.count, 0)

  return (
    <div>
      <div className="flex h-3 rounded-[2px] overflow-hidden border border-[var(--color-line-100)]">
        {entries.map((e) => {
          const pct = total === 0 ? 0 : (e.count / total) * 100
          const p = riskPalette(e.level)
          return pct > 0 ? (
            <div key={e.level} style={{ width: `${pct}%`, backgroundColor: p.fg }} title={`${p.label}: ${e.count}`} />
          ) : null
        })}
        {total === 0 && <div className="flex-1 bg-[var(--color-surface-2)]" />}
      </div>
      <div className="grid grid-cols-4 gap-2 mt-3">
        {entries.map((e) => {
          const p = riskPalette(e.level)
          return (
            <div key={e.level} className="flex items-center gap-1.5">
              <span className="h-1.5 w-1.5 rounded-full shrink-0" style={{ backgroundColor: p.fg }} />
              <span className="text-[11px] text-[var(--color-ink-500)]">{p.label}</span>
              <span className="text-[11px] font-semibold tabular ml-auto text-[var(--color-ink-900)]">{e.count}</span>
            </div>
          )
        })}
      </div>
    </div>
  )
}
