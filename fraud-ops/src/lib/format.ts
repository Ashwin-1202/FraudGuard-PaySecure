export function formatCurrency(value: number | undefined | null, currency = 'INR'): string {
  if (value === undefined || value === null || Number.isNaN(value)) return '—'
  const symbol = currency === 'INR' ? '₹' : ''
  return `${symbol}${value.toLocaleString('en-IN', { maximumFractionDigits: 2 })}`
}

export function formatPercent(value: number | undefined | null, digits = 2): string {
  if (value === undefined || value === null || Number.isNaN(value)) return '—'
  // Accept either a 0-1 fraction or an already-scaled 0-100 value.
  const pct = value <= 1 ? value * 100 : value
  return `${pct.toFixed(digits)}%`
}

export function formatScore(value: number | undefined | null, digits = 1): string {
  if (value === undefined || value === null || Number.isNaN(value)) return '—'
  const scaled = value <= 1 ? value * 100 : value
  return scaled.toFixed(digits)
}

export function formatTime(value: string | undefined | null): string {
  if (!value) return '—'
  const d = new Date(value)
  if (Number.isNaN(d.getTime())) return '—'
  return d.toLocaleTimeString('en-IN', { hour12: false })
}

export function formatDateTime(value: string | undefined | null): string {
  if (!value) return '—'
  const d = new Date(value)
  if (Number.isNaN(d.getTime())) return '—'
  return d.toLocaleString('en-IN', { hour12: false })
}

export function formatRelative(value: string | undefined | null): string {
  if (!value) return '—'
  const d = new Date(value)
  if (Number.isNaN(d.getTime())) return '—'
  const diffSec = Math.round((Date.now() - d.getTime()) / 1000)
  if (diffSec < 5) return 'just now'
  if (diffSec < 60) return `${diffSec}s ago`
  const diffMin = Math.round(diffSec / 60)
  if (diffMin < 60) return `${diffMin}m ago`
  const diffHr = Math.round(diffMin / 60)
  if (diffHr < 24) return `${diffHr}h ago`
  return formatDateTime(value)
}
