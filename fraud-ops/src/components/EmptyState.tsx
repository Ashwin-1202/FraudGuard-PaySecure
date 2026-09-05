export function EmptyState({ message }: { message: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <div className="h-8 w-8 rounded-[3px] border border-[var(--color-line-200)] flex items-center justify-center mb-3">
        <div className="h-1 w-4 bg-[var(--color-line-200)] rounded-full" />
      </div>
      <p className="text-[12.5px] text-[var(--color-ink-500)]">{message}</p>
    </div>
  )
}

export function ErrorState({ message, onRetry }: { message: string; onRetry?: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center border border-dashed border-[var(--color-risk-critical-line)] bg-[var(--color-risk-critical-bg)] rounded-[3px] mx-1">
      <p className="text-[12.5px] font-medium text-[var(--color-risk-critical)] mb-1">Unable to load data</p>
      <p className="text-[11.5px] text-[var(--color-ink-500)] max-w-sm">{message}</p>
      {onRetry && (
        <button
          onClick={onRetry}
          className="mt-3 text-[11.5px] font-medium text-[var(--color-accent-600)] border border-[var(--color-accent-500)] px-3 py-1 rounded-[3px] hover:bg-[var(--color-accent-100)]"
        >
          Retry
        </button>
      )}
    </div>
  )
}

export function LoadingRows({ rows = 6 }: { rows?: number }) {
  return (
    <div className="divide-y divide-[var(--color-line-100)]">
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="h-9 px-3 flex items-center gap-4 animate-pulse">
          <div className="h-2.5 w-24 bg-[var(--color-surface-2)] rounded-sm" />
          <div className="h-2.5 w-14 bg-[var(--color-surface-2)] rounded-sm" />
          <div className="h-2.5 w-16 bg-[var(--color-surface-2)] rounded-sm" />
          <div className="h-2.5 w-20 bg-[var(--color-surface-2)] rounded-sm ml-auto" />
        </div>
      ))}
    </div>
  )
}
