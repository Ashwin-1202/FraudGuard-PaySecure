import type { ShapContributor } from '../types'

function Bar({ value, max, positive }: { value: number; max: number; positive: boolean }) {
  const width = max === 0 ? 0 : (Math.abs(value) / max) * 100
  return (
    <div className="h-1.5 rounded-[2px] bg-[var(--color-surface-2)] overflow-hidden">
      <div
        className="h-full rounded-[2px]"
        style={{ width: `${width}%`, backgroundColor: positive ? 'var(--color-positive)' : 'var(--color-negative)' }}
      />
    </div>
  )
}

function ContributorList({ items, positive, max }: { items: ShapContributor[]; positive: boolean; max: number }) {
  if (items.length === 0) {
    return <p className="text-[11.5px] text-[var(--color-ink-400)] py-2">None reported.</p>
  }
  return (
    <ul className="space-y-2.5">
      {items.map((item) => (
        <li key={item.feature}>
          <div className="flex items-baseline justify-between mb-1">
            <span className="text-[12px] text-[var(--color-ink-800)]">{item.feature}</span>
            <span
              className="text-[11.5px] font-semibold tabular"
              style={{ color: positive ? 'var(--color-positive)' : 'var(--color-negative)' }}
            >
              {positive ? '+' : ''}
              {item.value.toFixed(2)}
            </span>
          </div>
          <Bar value={item.value} max={max} positive={positive} />
          {item.explanation && <p className="text-[11px] text-[var(--color-ink-400)] mt-1">{item.explanation}</p>}
        </li>
      ))}
    </ul>
  )
}

export default function ShapContributors({ contributors }: { contributors: ShapContributor[] }) {
  const positive = contributors.filter((c) => c.value > 0).sort((a, b) => b.value - a.value)
  const negative = contributors.filter((c) => c.value < 0).sort((a, b) => a.value - b.value)
  const max = Math.max(1, ...contributors.map((c) => Math.abs(c.value)))

  if (contributors.length === 0) {
    return <p className="text-[12px] text-[var(--color-ink-400)]">No model explanation available for this transaction.</p>
  }

  return (
    <div className="grid grid-cols-2 gap-6">
      <div>
        <h4 className="text-[10.5px] uppercase tracking-wide text-[var(--color-positive)] font-semibold mb-3">
          Increased Fraud Risk
        </h4>
        <ContributorList items={positive} positive max={max} />
      </div>
      <div>
        <h4 className="text-[10.5px] uppercase tracking-wide text-[var(--color-negative)] font-semibold mb-3">
          Reduced Fraud Risk
        </h4>
        <ContributorList items={negative} positive={false} max={max} />
      </div>
    </div>
  )
}
