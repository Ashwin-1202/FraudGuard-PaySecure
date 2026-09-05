import type { ShapContributor } from '../types'

interface ShapContributionChartProps {
  contributors?: ShapContributor[]
}

export default function ShapContributionChart({ contributors = [] }: ShapContributionChartProps) {
  if (!contributors || contributors.length === 0) {
    return (
      <div className="py-6 text-center text-[12px] text-[var(--color-ink-400)]">
        No SHAP feature contributions recorded for this model evaluation.
      </div>
    )
  }

  // Find max absolute value to scale the horizontal bars
  const maxAbsVal = Math.max(0.01, ...contributors.map((c) => Math.abs(c.value || 0)))

  // Sort by absolute impact (highest magnitude first)
  const sorted = [...contributors].sort((a, b) => Math.abs(b.value || 0) - Math.abs(a.value || 0))

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between text-[10.5px] uppercase tracking-wider text-[var(--color-ink-400)] pb-1 border-b border-[var(--color-line-100)]">
        <span className="w-44 sm:w-56 font-medium">Model Feature</span>
        <span className="flex-1 text-center font-medium px-2">Contribution Scale</span>
        <span className="w-20 text-right font-medium">SHAP Value</span>
        <span className="w-28 text-right font-medium hidden sm:inline">Risk Impact</span>
      </div>

      <div className="space-y-2">
        {sorted.map((item) => {
          const val = item.value || 0
          const isPositive = val > 0
          const barWidthPct = Math.min(100, Math.round((Math.abs(val) / maxAbsVal) * 100))
          const displayName = item.display_name || item.feature.replace(/_/g, ' ')

          return (
            <div
              key={item.feature}
              className="flex items-center justify-between py-1.5 px-2 rounded-[3px] hover:bg-[var(--color-surface-2)] transition-colors text-[12px]"
            >
              {/* Feature Title */}
              <div className="w-44 sm:w-56 pr-2">
                <div className="font-medium text-[var(--color-ink-900)] truncate capitalize" title={displayName}>
                  {displayName}
                </div>
                {item.explanation && (
                  <div className="text-[10px] text-[var(--color-ink-400)] truncate">{item.explanation}</div>
                )}
              </div>

              {/* Horizontal Bar */}
              <div className="flex-1 px-2 flex items-center">
                <div className="w-full bg-[var(--color-surface-sunken)] h-2 rounded-[2px] overflow-hidden relative">
                  <div
                    className="h-full rounded-[2px] transition-all duration-300"
                    style={{
                      width: `${barWidthPct}%`,
                      backgroundColor: isPositive ? 'var(--color-risk-high)' : 'var(--color-accent-600)',
                    }}
                  />
                </div>
              </div>

              {/* Numerical Value */}
              <div className="w-20 text-right font-mono font-semibold tabular">
                <span style={{ color: isPositive ? 'var(--color-risk-high)' : 'var(--color-accent-600)' }}>
                  {isPositive ? `+${val.toFixed(2)}` : val.toFixed(2)}
                </span>
              </div>

              {/* Impact Badge */}
              <div className="w-28 text-right hidden sm:block">
                <span
                  className={`inline-block px-1.5 py-0.5 rounded-[2px] text-[10px] font-semibold uppercase tracking-wider ${
                    isPositive
                      ? 'bg-[var(--color-risk-high-bg)] text-[var(--color-risk-high)] border border-[var(--color-risk-high-line)]'
                      : 'bg-[var(--color-accent-100)] text-[var(--color-accent-600)] border border-[var(--color-line-200)]'
                  }`}
                >
                  {isPositive ? 'Increases Risk' : 'Decreases Risk'}
                </span>
              </div>
            </div>
          )
        })}
      </div>

      <div className="pt-2 border-t border-[var(--color-line-100)] flex items-center justify-between text-[11px] text-[var(--color-ink-400)]">
        <div className="flex items-center gap-4">
          <span className="flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-full bg-[var(--color-risk-high)]" />
            Increases Fraud Probability
          </span>
          <span className="flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-full bg-[var(--color-accent-600)]" />
            Pushes Model Toward Normal
          </span>
        </div>
        <span className="italic">TreeSHAP Explainer</span>
      </div>
    </div>
  )
}
