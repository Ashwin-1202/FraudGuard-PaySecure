import { riskPalette } from '../lib/risk'
import type { RiskLevel } from '../types'

export default function RiskBadge({ level, size = 'md' }: { level?: RiskLevel | null; size?: 'sm' | 'md' }) {
  const p = riskPalette(level ?? undefined)
  const pad = size === 'sm' ? 'px-1.5 py-0.5 text-[10px]' : 'px-2 py-0.5 text-[11px]'
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-[3px] border font-semibold tracking-wide uppercase ${pad}`}
      style={{ color: p.fg, backgroundColor: p.bg, borderColor: p.line }}
    >
      <span className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: p.fg }} />
      {p.label}
    </span>
  )
}
