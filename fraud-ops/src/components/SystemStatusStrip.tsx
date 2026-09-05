import type { SystemStatus } from '../types'

const LABELS: { key: keyof SystemStatus; label: string }[] = [
  { key: 'kafka', label: 'Kafka' },
  { key: 'risk_engine', label: 'Risk Engine' },
  { key: 'ai_xai', label: 'AI / XAI' },
  { key: 'supabase', label: 'Supabase' },
]

function isUp(value: boolean | string | undefined): boolean {
  if (typeof value === 'boolean') return value
  if (typeof value === 'string') return ['up', 'connected', 'ok', 'true', 'healthy', 'online'].includes(value.toLowerCase())
  return false
}

export default function SystemStatusStrip({ status }: { status: SystemStatus | null }) {
  return (
    <div className="flex items-center gap-3">
      {LABELS.map(({ key, label }) => {
        const up = status ? isUp(status[key]) : undefined
        const color = up === undefined ? 'var(--color-ink-300)' : up ? 'var(--color-risk-low)' : 'var(--color-risk-critical)'
        return (
          <div key={key} className="flex items-center gap-1.5" title={up === undefined ? 'Unknown' : up ? 'Connected' : 'Down'}>
            <span className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: color }} />
            <span className="text-[11px] text-[var(--color-ink-500)]">{label}</span>
          </div>
        )
      })}
    </div>
  )
}
