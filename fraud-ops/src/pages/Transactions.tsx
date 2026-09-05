import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import TopBar from '../components/TopBar'
import Panel from '../components/Panel'
import RiskBadge from '../components/RiskBadge'
import { EmptyState, ErrorState } from '../components/EmptyState'
import { SkeletonTable } from '../components/SkeletonLoader'
import { usePolling } from '../hooks/usePolling'
import { listTransactions } from '../api/transactions'
import { getSystemStatus } from '../api/system'
import { RISK_LEVELS } from '../lib/risk'
import { formatCurrency, formatPercent, formatScore, formatTime } from '../lib/format'
import type { RiskLevel } from '../types'

type TimeRangeFilter = 'ALL' | '5M' | '30M' | '1H' | 'TODAY'

const PAGE_SIZE = 25

export default function Transactions() {
  const navigate = useNavigate()

  // Filter states
  const [search, setSearch] = useState('')
  const [debouncedSearch, setDebouncedSearch] = useState('')
  const [riskFilter, setRiskFilter] = useState<RiskLevel | 'ALL'>('ALL')
  const [timeRange, setTimeRange] = useState<TimeRangeFilter>('ALL')
  const [minAmount, setMinAmount] = useState<string>('')
  const [maxAmount, setMaxAmount] = useState<string>('')
  const [page, setPage] = useState(1)

  // Track newly arrived transaction IDs for subtle entry animation
  const [newTxnIds, setNewTxnIds] = useState<Set<string>>(new Set())
  const previousTxnIdsRef = useRef<Set<string>>(new Set())
  const [newArrivalCount, setNewArrivalCount] = useState(0)

  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(search), 300)
    return () => clearTimeout(t)
  }, [search])

  useEffect(() => setPage(1), [riskFilter, debouncedSearch, timeRange, minAmount, maxAmount])

  const status = usePolling(getSystemStatus, 15000)
  const txs = usePolling(
    () => listTransactions({ risk_level: riskFilter, search: debouncedSearch, page, page_size: 100 }),
    6000,
    [riskFilter, debouncedSearch]
  )

  const rawData = txs.data ?? []

  // Check for newly arrived transactions
  useEffect(() => {
    if (rawData.length > 0) {
      const currentIds = new Set(rawData.map((t) => t.transaction_id))
      if (previousTxnIdsRef.current.size > 0) {
        const fresh = new Set<string>()
        currentIds.forEach((id) => {
          if (!previousTxnIdsRef.current.has(id)) {
            fresh.add(id)
          }
        })
        if (fresh.size > 0) {
          setNewTxnIds(fresh)
          setNewArrivalCount((c) => c + fresh.size)
          const timeout = setTimeout(() => {
            setNewTxnIds(new Set())
          }, 3000)
          return () => clearTimeout(timeout)
        }
      }
      previousTxnIdsRef.current = currentIds
    }
  }, [txs.data])

  // Filter client-side for Time Range and Amount Range (since backend only takes risk_level & search)
  const filteredData = rawData.filter((t) => {
    // Search user ID as well
    if (debouncedSearch) {
      const matchSearch =
        t.transaction_id.toLowerCase().includes(debouncedSearch.toLowerCase()) ||
        t.user_id.toLowerCase().includes(debouncedSearch.toLowerCase())
      if (!matchSearch) return false
    }

    // Amount range
    if (minAmount && t.amount < parseFloat(minAmount)) return false
    if (maxAmount && t.amount > parseFloat(maxAmount)) return false

    // Time range filter
    if (timeRange !== 'ALL' && t.timestamp) {
      const txTime = new Date(t.timestamp).getTime()
      const now = Date.now()
      const diffMinutes = (now - txTime) / (1000 * 60)

      if (timeRange === '5M' && diffMinutes > 5) return false
      if (timeRange === '30M' && diffMinutes > 30) return false
      if (timeRange === '1H' && diffMinutes > 60) return false
      if (timeRange === 'TODAY' && diffMinutes > 1440) return false
    }

    return true
  })

  // Pagination on filtered subset
  const startIndex = (page - 1) * PAGE_SIZE
  const paginatedData = filteredData.slice(startIndex, startIndex + PAGE_SIZE)
  const totalPages = Math.max(1, Math.ceil(filteredData.length / PAGE_SIZE))

  return (
    <div className="flex-1 flex flex-col min-h-0">
      <TopBar
        title="Live Transaction Monitor"
        subtitle="Monitor incoming payment activity and fraud risk in real time."
        status={status.data}
        lastUpdated={txs.lastUpdated}
        isLive={true}
        onRefresh={txs.refresh}
      />

      <div className="flex-1 overflow-y-auto scrollbar-thin p-3 sm:p-5 space-y-4">
        {/* NEW TRANSACTIONS ARRIVAL NOTIFICATION */}
        {newArrivalCount > 0 && (
          <div className="flex items-center justify-between px-3 py-1.5 rounded-[3px] bg-[var(--color-accent-100)] text-[var(--color-accent-600)] text-[11.5px] border border-[var(--color-line-200)] animate-in fade-in duration-200">
            <span className="flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-[var(--color-accent-600)] live-dot" />
              Stream active: {newArrivalCount} new transaction{newArrivalCount > 1 ? 's' : ''} captured since session start.
            </span>
            <button
              onClick={() => setNewArrivalCount(0)}
              className="font-medium hover:underline text-[11px]"
            >
              Dismiss
            </button>
          </div>
        )}

        {/* TOP FILTERS */}
        <div className="p-3 rounded-[3px] border border-[var(--color-line-100)] bg-[var(--color-surface-1)] space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-3">
            {/* Search Input */}
            <div className="relative flex-1 min-w-[220px]">
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search Transaction ID or User ID…"
                className="h-8 w-full pl-8 pr-3 rounded-[3px] border border-[var(--color-line-200)] bg-[var(--color-surface-0)] text-[12px] focus:outline-none focus:border-[var(--color-accent-500)] focus:ring-1 focus:ring-[var(--color-accent-500)]"
              />
              <svg className="w-3.5 h-3.5 absolute left-2.5 top-2.5 text-[var(--color-ink-400)]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="11" cy="11" r="8" />
                <line x1="21" y1="21" x2="16.65" y2="16.65" />
              </svg>
            </div>

            {/* Risk Level Segmented Buttons */}
            <div className="flex items-center border border-[var(--color-line-200)] rounded-[3px] overflow-hidden">
              {(['ALL', ...RISK_LEVELS] as const).map((level) => (
                <button
                  key={level}
                  onClick={() => setRiskFilter(level)}
                  className={`h-8 px-2.5 sm:px-3 text-[11px] font-medium border-r border-[var(--color-line-200)] last:border-r-0 transition-colors ${
                    riskFilter === level
                      ? 'bg-[var(--color-ink-900)] text-white'
                      : 'bg-[var(--color-surface-1)] text-[var(--color-ink-600)] hover:bg-[var(--color-surface-2)]'
                  }`}
                >
                  {level === 'ALL' ? 'All Risks' : level.charAt(0) + level.slice(1).toLowerCase()}
                </button>
              ))}
            </div>
          </div>

          {/* Sub-filters: Time Range & Amount Range */}
          <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-[var(--color-line-100)] text-[11px]">
            {/* Time Range Pills */}
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="text-[var(--color-ink-400)] font-medium mr-1">Time Range:</span>
              {(
                [
                  { id: 'ALL', label: 'All Time' },
                  { id: '5M', label: 'Last 5 min' },
                  { id: '30M', label: 'Last 30 min' },
                  { id: '1H', label: 'Last 1 hour' },
                  { id: 'TODAY', label: 'Today' },
                ] as const
              ).map((t) => (
                <button
                  key={t.id}
                  onClick={() => setTimeRange(t.id)}
                  className={`px-2 py-0.5 rounded-[2px] border transition-colors ${
                    timeRange === t.id
                      ? 'bg-[var(--color-accent-600)] text-white border-[var(--color-accent-600)] font-medium'
                      : 'bg-[var(--color-surface-1)] text-[var(--color-ink-600)] border-[var(--color-line-200)] hover:bg-[var(--color-surface-2)]'
                  }`}
                >
                  {t.label}
                </button>
              ))}
            </div>

            {/* Amount Range Inputs */}
            <div className="flex items-center gap-2">
              <span className="text-[var(--color-ink-400)] font-medium">Amount:</span>
              <input
                type="number"
                placeholder="Min ₹"
                value={minAmount}
                onChange={(e) => setMinAmount(e.target.value)}
                className="h-7 w-20 px-2 rounded-[2px] border border-[var(--color-line-200)] bg-[var(--color-surface-0)] text-[11px] focus:outline-none"
              />
              <span className="text-[var(--color-ink-300)]">—</span>
              <input
                type="number"
                placeholder="Max ₹"
                value={maxAmount}
                onChange={(e) => setMaxAmount(e.target.value)}
                className="h-7 w-20 px-2 rounded-[2px] border border-[var(--color-line-200)] bg-[var(--color-surface-0)] text-[11px] focus:outline-none"
              />
              {(minAmount || maxAmount) && (
                <button
                  onClick={() => {
                    setMinAmount('')
                    setMaxAmount('')
                  }}
                  className="text-[10px] text-[var(--color-accent-600)] hover:underline"
                >
                  Clear
                </button>
              )}
            </div>

            <span className="text-[var(--color-ink-400)] tabular ml-auto">
              Showing {filteredData.length} transaction{filteredData.length === 1 ? '' : 's'}
            </span>
          </div>
        </div>

        {/* LIVE TRANSACTION TABLE */}
        <Panel padded={false}>
          {txs.error && filteredData.length === 0 ? (
            <ErrorState message={txs.error} onRetry={txs.refresh} />
          ) : txs.loading && filteredData.length === 0 ? (
            <SkeletonTable rows={10} cols={8} />
          ) : filteredData.length === 0 ? (
            <div className="p-8">
              <EmptyState message="No transactions match the selected filters." />
            </div>
          ) : (
            <div className="overflow-x-auto scrollbar-thin">
              <table className="w-full min-w-[760px] text-[12px] border-collapse">
                <thead>
                  <tr className="border-b border-[var(--color-line-100)] text-left text-[10px] uppercase tracking-wider text-[var(--color-ink-400)] bg-[var(--color-surface-0)] sticky top-0">
                    <th className="py-2.5 pl-4 pr-3 font-semibold">Transaction ID</th>
                    <th className="py-2.5 px-3 font-semibold">User</th>
                    <th className="py-2.5 px-3 font-semibold text-right">Amount</th>
                    <th className="py-2.5 px-3 font-semibold text-right">Time</th>
                    <th className="py-2.5 px-3 font-semibold text-right">Risk Score</th>
                    <th className="py-2.5 px-3 font-semibold">Risk Level</th>
                    <th className="py-2.5 px-3 font-semibold text-right">Fraud Prob.</th>
                    <th className="py-2.5 pr-4 pl-3 font-semibold text-right">Alert Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[var(--color-line-100)]">
                  {paginatedData.map((tx) => {
                    const isNew = newTxnIds.has(tx.transaction_id)

                    return (
                      <tr
                        key={tx.transaction_id}
                        onClick={() => navigate(`/transactions/${encodeURIComponent(tx.transaction_id)}`)}
                        className={`cursor-pointer transition-colors duration-500 hover:bg-[var(--color-surface-2)] ${
                          isNew
                            ? 'bg-[var(--color-accent-100)]/60'
                            : 'bg-transparent'
                        }`}
                      >
                        <td className="py-2.5 pl-4 pr-3 font-mono font-medium text-[var(--color-ink-900)] whitespace-nowrap">
                          {isNew && (
                            <span className="inline-block w-1.5 h-1.5 rounded-full bg-[var(--color-accent-600)] mr-1.5 live-dot" />
                          )}
                          {tx.transaction_id}
                        </td>
                        <td className="py-2.5 px-3 font-mono text-[var(--color-ink-700)] whitespace-nowrap">
                          {tx.user_id}
                        </td>
                        <td className="py-2.5 px-3 text-right font-medium tabular text-[var(--color-ink-900)] whitespace-nowrap">
                          {formatCurrency(tx.amount, tx.currency)}
                        </td>
                        <td className="py-2.5 px-3 text-right font-mono text-[11px] text-[var(--color-ink-500)] tabular whitespace-nowrap">
                          {formatTime(tx.timestamp)}
                        </td>
                        <td className="py-2.5 px-3 text-right font-mono font-bold tabular text-[var(--color-ink-900)] whitespace-nowrap">
                          {formatScore(tx.final_risk_score)}
                        </td>
                        <td className="py-2.5 px-3 whitespace-nowrap">
                          <RiskBadge level={tx.risk_level} size="sm" />
                        </td>
                        <td className="py-2.5 px-3 text-right font-mono tabular text-[var(--color-ink-500)] whitespace-nowrap">
                          {formatPercent(tx.fraud_probability)}
                        </td>
                        <td className="py-2.5 pr-4 pl-3 text-right whitespace-nowrap">
                          {tx.alert_id ? (
                            <span
                              className={`inline-flex items-center px-1.5 py-0.5 rounded-[2px] text-[10px] font-semibold uppercase tracking-wider ${
                                (tx.alert_status || 'OPEN').toUpperCase() === 'OPEN'
                                  ? 'bg-[var(--color-risk-critical-bg)] text-[var(--color-risk-critical)] border border-[var(--color-risk-critical-line)]'
                                  : (tx.alert_status || '').toUpperCase() === 'RESOLVED'
                                  ? 'bg-[var(--color-risk-low-bg)] text-[var(--color-risk-low)] border border-[var(--color-risk-low-line)]'
                                  : 'bg-[var(--color-risk-medium-bg)] text-[var(--color-risk-medium)] border border-[var(--color-risk-medium-line)]'
                              }`}
                            >
                              {tx.alert_status || 'OPEN'}
                            </span>
                          ) : (
                            <span className="text-[11px] text-[var(--color-ink-300)]">—</span>
                          )}
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}
        </Panel>

        {/* PAGINATION CONTROLS */}
        <div className="flex items-center justify-between text-[11.5px] pt-1">
          <button
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page === 1}
            className="px-3 py-1 rounded-[3px] border border-[var(--color-line-200)] text-[var(--color-ink-700)] hover:bg-[var(--color-surface-2)] disabled:opacity-40 transition-colors"
          >
            ← Previous
          </button>
          <span className="text-[var(--color-ink-500)] font-medium">
            Page {page} of {totalPages}
          </span>
          <button
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            disabled={page >= totalPages}
            className="px-3 py-1 rounded-[3px] border border-[var(--color-line-200)] text-[var(--color-ink-700)] hover:bg-[var(--color-surface-2)] disabled:opacity-40 transition-colors"
          >
            Next →
          </button>
        </div>
      </div>
    </div>
  )
}
