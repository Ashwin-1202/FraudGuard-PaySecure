import { formatTime } from '../lib/format'
import type { InvestigationTimeline as Timeline } from '../types'

const STAGES: { key: keyof Timeline; label: string }[] = [
  { key: 'received_at', label: 'Transaction received' },
  { key: 'fraud_model_at', label: 'Fraud model scored' },
  { key: 'anomaly_at', label: 'Anomaly detection scored' },
  { key: 'rules_at', label: 'Business rules evaluated' },
  { key: 'shap_at', label: 'SHAP explanation generated' },
  { key: 'rag_at', label: 'Context retrieval (RAG)' },
  { key: 'ai_explanation_at', label: 'AI explanation generated' },
  { key: 'alert_at', label: 'Alert raised' },
]

export default function InvestigationTimeline({ timeline }: { timeline?: Timeline }) {
  if (!timeline || Object.values(timeline).every((v) => !v)) {
    return <p className="text-[12px] text-[var(--color-ink-400)]">No timeline recorded for this transaction.</p>
  }

  return (
    <ol className="relative">
      {STAGES.map((stage, i) => {
        const value = timeline[stage.key]
        const done = Boolean(value)
        return (
          <li key={stage.key} className="relative pl-5 pb-4 last:pb-0">
            {i !== STAGES.length - 1 && (
              <span className="absolute left-[3px] top-2.5 bottom-0 w-px bg-[var(--color-line-100)]" />
            )}
            <span
              className="absolute left-0 top-1 h-1.5 w-1.5 rounded-full border"
              style={{
                backgroundColor: done ? 'var(--color-accent-600)' : 'var(--color-surface-1)',
                borderColor: done ? 'var(--color-accent-600)' : 'var(--color-line-200)',
              }}
            />
            <div className="flex items-baseline justify-between gap-3">
              <span className={`text-[12px] ${done ? 'text-[var(--color-ink-800)]' : 'text-[var(--color-ink-300)]'}`}>
                {stage.label}
              </span>
              <span className="text-[11px] tabular text-[var(--color-ink-400)]">
                {done ? formatTime(value as string) : '—'}
              </span>
            </div>
          </li>
        )
      })}
    </ol>
  )
}
