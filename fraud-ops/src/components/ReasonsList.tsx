export default function ReasonsList({ reasons }: { reasons: string[] | undefined }) {
  if (!reasons || reasons.length === 0) {
    return <p className="text-[12px] text-[var(--color-ink-400)]">No flag reasons were returned for this transaction.</p>
  }
  return (
    <ul className="space-y-1.5">
      {reasons.map((r, i) => (
        <li key={i} className="text-[12.5px] text-[var(--color-ink-800)] flex gap-2">
          <span className="text-[var(--color-risk-high)] mt-0.5">•</span>
          <span>{r}</span>
        </li>
      ))}
    </ul>
  )
}
