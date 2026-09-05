import type { AiExplanation } from '../types'

export default function InvestigatorSummary({ explanation }: { explanation: AiExplanation | string | null | undefined }) {
  if (!explanation) {
    return <p className="text-[12px] text-[var(--color-ink-400)]">No investigator summary generated for this transaction.</p>
  }

  const data: AiExplanation = typeof explanation === 'string' ? { raw: explanation } : explanation

  if (data.raw && !data.risk_explanation && !data.investigation_recommendation) {
    return <p className="text-[12.5px] text-[var(--color-ink-800)] leading-relaxed whitespace-pre-line">{data.raw}</p>
  }

  return (
    <div className="space-y-4">
      {data.risk_explanation && (
        <div>
          <h4 className="text-[10.5px] uppercase tracking-wide text-[var(--color-ink-400)] font-semibold mb-1.5">
            Risk Explanation
          </h4>
          <p className="text-[12.5px] text-[var(--color-ink-800)] leading-relaxed">{data.risk_explanation}</p>
        </div>
      )}

      {data.top_contributing_factors && data.top_contributing_factors.length > 0 && (
        <div>
          <h4 className="text-[10.5px] uppercase tracking-wide text-[var(--color-ink-400)] font-semibold mb-1.5">
            Top Contributing Factors
          </h4>
          <ul className="space-y-1">
            {data.top_contributing_factors.map((f, i) => (
              <li key={i} className="text-[12.5px] text-[var(--color-ink-800)] flex gap-2">
                <span className="text-[var(--color-ink-300)]">—</span>
                {f}
              </li>
            ))}
          </ul>
        </div>
      )}

      {data.investigation_recommendation && (
        <div className="border-t border-[var(--color-line-100)] pt-3">
          <h4 className="text-[10.5px] uppercase tracking-wide text-[var(--color-ink-400)] font-semibold mb-1.5">
            Investigation Recommendation
          </h4>
          <p className="text-[12.5px] text-[var(--color-ink-800)] leading-relaxed">{data.investigation_recommendation}</p>
        </div>
      )}
    </div>
  )
}
