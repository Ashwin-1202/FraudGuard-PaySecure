export function Skeleton({ className = '' }: { className?: string }) {
  return <div className={`animate-pulse bg-[var(--color-surface-2)] rounded-[2px] ${className}`} />
}

export function SkeletonMetrics({ count = 4 }: { count?: number }) {
  return (
    <div className={`grid grid-cols-2 lg:grid-cols-${count} border border-[var(--color-line-100)] bg-[var(--color-surface-1)] rounded-[3px] divide-x divide-[var(--color-line-100)]`}>
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="px-4 py-3 space-y-2">
          <Skeleton className="h-3 w-20" />
          <Skeleton className="h-6 w-16" />
        </div>
      ))}
    </div>
  )
}

export function SkeletonTable({ rows = 6, cols = 6 }: { rows?: number; cols?: number }) {
  return (
    <div className="p-3 space-y-2.5">
      <div className="flex gap-4 border-b border-[var(--color-line-100)] pb-2.5">
        {Array.from({ length: cols }).map((_, i) => (
          <Skeleton key={i} className="h-3 flex-1" />
        ))}
      </div>
      {Array.from({ length: rows }).map((_, r) => (
        <div key={r} className="flex gap-4 py-1.5 border-b border-[var(--color-line-100)]/60 last:border-0">
          {Array.from({ length: cols }).map((_, c) => (
            <Skeleton key={c} className="h-4 flex-1" />
          ))}
        </div>
      ))}
    </div>
  )
}

export function SkeletonCard({ height = 140 }: { height?: number }) {
  return (
    <div className="p-4 space-y-3" style={{ minHeight: height }}>
      <Skeleton className="h-4 w-1/3" />
      <Skeleton className="h-20 w-full" />
      <div className="flex gap-2">
        <Skeleton className="h-3 w-1/4" />
        <Skeleton className="h-3 w-1/4" />
      </div>
    </div>
  )
}
