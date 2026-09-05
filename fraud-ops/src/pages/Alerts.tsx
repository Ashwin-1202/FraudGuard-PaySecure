import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import TopBar from '../components/TopBar'
import Panel from '../components/Panel'
import RiskBadge from '../components/RiskBadge'
import MetricStrip from '../components/MetricStrip'
import { EmptyState, ErrorState } from '../components/EmptyState'
import { SkeletonTable } from '../components/SkeletonLoader'
import { useToast } from '../components/ToastContext'
import { usePolling } from '../hooks/usePolling'
import { acknowledgeAlert, listAlerts, resolveAlert } from '../api/alerts'
import { createInvestigation, listInvestigations } from '../api/investigations'
import { getSystemStatus } from '../api/system'
import { formatDateTime, formatScore } from '../lib/format'
import type { Alert, RiskLevel } from '../types'

type SortOption = 'NEWEST' | 'HIGHEST_RISK' | 'OLDEST'

export default function Alerts() {
  const navigate = useNavigate()
  const { showToast } = useToast()

  // Filters & Sorting
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'OPEN' | 'ACKNOWLEDGED' | 'RESOLVED'>('ALL')
  const [severityFilter, setSeverityFilter] = useState<RiskLevel | 'ALL'>('ALL')
  const [sortBy, setSortBy] = useState<SortOption>('NEWEST')
  const [search, setSearch] = useState('')

  const [busyId, setBusyId] = useState<string | null>(null)

  const status = usePolling(getSystemStatus, 15000)
  const alerts = usePolling(
    () => listAlerts({ status: statusFilter, severity: severityFilter, limit: 200 }),
    7000,
    [statusFilter, severityFilter]
  )
  const investigations = usePolling(() => listInvestigations({ limit: 100 }), 12000)

  const rawList = alerts.data ?? []

  // Summary counts
  const totalCount = rawList.length
  const openCount = rawList.filter((a) => a.status.toUpperCase() === 'OPEN').length
  const ackCount = rawList.filter((a) => a.status.toUpperCase() === 'ACKNOWLEDGED').length
  const resolvedCount = rawList.filter((a) => a.status.toUpperCase() === 'RESOLVED').length
  const criticalCount = rawList.filter((a) => a.severity === 'CRITICAL').length

  // Filter and sort client-side
  let filtered = rawList.filter((a) => {
    if (search) {
      const q = search.toLowerCase()
      const matches = a.alert_id.toLowerCase().includes(q) || a.transaction_id.toLowerCase().includes(q)
      if (!matches) return false
    }
    return true
  })

  // Sort
  filtered = filtered.sort((a, b) => {
    if (sortBy === 'HIGHEST_RISK') {
      return (b.risk_score || 0) - (a.risk_score || 0)
    }
    if (sortBy === 'OLDEST') {
      return new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
    }
    // Default NEWEST
    return new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
  })

  async function handleAcknowledge(id: string) {
    setBusyId(id)
    try {
      await acknowledgeAlert(id)
      showToast(`Alert ${id} acknowledged.`, 'info')
      await alerts.refresh()
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Unable to acknowledge alert.', 'error')
    } finally {
      setBusyId(null)
    }
  }

  async function handleResolve(id: string) {
    setBusyId(id)
    try {
      await resolveAlert(id)
      showToast(`Alert ${id} marked as resolved.`, 'success')
      await alerts.refresh()
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Unable to resolve alert.', 'error')
    } finally {
      setBusyId(null)
    }
  }

  async function handleOpenInvestigation(alert: Alert) {
    setBusyId(alert.alert_id)
    try {
      const inv = await createInvestigation({
        transaction_id: alert.transaction_id,
        alert_id: alert.alert_id,
        investigator_notes: `Investigation automatically opened from Alert ${alert.alert_id}. Risk severity: ${alert.severity}`,
      })
      showToast(`Investigation ${inv.investigation_id} opened for Alert ${alert.alert_id}`, 'success')
      navigate(`/investigations/${encodeURIComponent(inv.investigation_id)}`)
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Unable to create investigation for alert.', 'error')
    } finally {
      setBusyId(null)
    }
  }

  return (
    <div className="flex-1 flex flex-col min-h-0">
      <TopBar
        title="Fraud Alerts"
        subtitle="Review and prioritize suspicious payment activity."
        status={status.data}
        lastUpdated={alerts.lastUpdated}
        onRefresh={() => {
          alerts.refresh()
          investigations.refresh()
        }}
      />

      <div className="flex-1 overflow-y-auto scrollbar-thin p-3 sm:p-5 space-y-4 sm:space-y-5">
        {/* ALERT SUMMARY */}
        <MetricStrip
          metrics={[
            { label: 'Total Alerts', value: totalCount, hint: 'Generated alerts' },
            { label: 'Open', value: openCount, tone: 'var(--color-risk-critical)', hint: 'Requires action' },
            { label: 'Acknowledged', value: ackCount, tone: 'var(--color-risk-medium)', hint: 'Under triage' },
            { label: 'Resolved', value: resolvedCount, tone: 'var(--color-risk-low)', hint: 'Closed out' },
            { label: 'Critical Severity', value: criticalCount, tone: 'var(--color-risk-critical)', hint: 'Immediate priority' },
          ]}
        />

        {/* FILTERS & SEARCH */}
        <div className="p-3 rounded-[3px] border border-[var(--color-line-100)] bg-[var(--color-surface-1)] space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-3">
            {/* Search */}
            <div className="relative flex-1 min-w-[220px]">
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search Alert ID or Transaction ID…"
                className="h-8 w-full pl-8 pr-3 rounded-[3px] border border-[var(--color-line-200)] bg-[var(--color-surface-0)] text-[12px] focus:outline-none focus:border-[var(--color-accent-500)]"
              />
              <svg className="w-3.5 h-3.5 absolute left-2.5 top-2.5 text-[var(--color-ink-400)]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="11" cy="11" r="8" />
                <line x1="21" y1="21" x2="16.65" y2="16.65" />
              </svg>
            </div>

            {/* Status Filter */}
            <div className="flex items-center border border-[var(--color-line-200)] rounded-[3px] overflow-hidden">
              {(['ALL', 'OPEN', 'ACKNOWLEDGED', 'RESOLVED'] as const).map((st) => (
                <button
                  key={st}
                  onClick={() => setStatusFilter(st)}
                  className={`h-8 px-2.5 sm:px-3 text-[11px] font-medium border-r border-[var(--color-line-200)] last:border-r-0 transition-colors ${
                    statusFilter === st
                      ? 'bg-[var(--color-ink-900)] text-white'
                      : 'bg-[var(--color-surface-1)] text-[var(--color-ink-600)] hover:bg-[var(--color-surface-2)]'
                  }`}
                >
                  {st === 'ALL' ? 'All Status' : st.charAt(0) + st.slice(1).toLowerCase()}
                </button>
              ))}
            </div>

            {/* Severity Filter */}
            <div className="flex items-center border border-[var(--color-line-200)] rounded-[3px] overflow-hidden">
              {(['ALL', 'HIGH', 'CRITICAL'] as const).map((sev) => (
                <button
                  key={sev}
                  onClick={() => setSeverityFilter(sev as RiskLevel | 'ALL')}
                  className={`h-8 px-2.5 sm:px-3 text-[11px] font-medium border-r border-[var(--color-line-200)] last:border-r-0 transition-colors ${
                    severityFilter === sev
                      ? 'bg-[var(--color-ink-900)] text-white'
                      : 'bg-[var(--color-surface-1)] text-[var(--color-ink-600)] hover:bg-[var(--color-surface-2)]'
                  }`}
                >
                  {sev === 'ALL' ? 'All Severities' : sev.charAt(0) + sev.slice(1).toLowerCase()}
                </button>
              ))}
            </div>

            {/* Sorting Dropdown */}
            <div className="flex items-center gap-1.5 text-[11.5px]">
              <span className="text-[var(--color-ink-400)] font-medium">Sort:</span>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as SortOption)}
                className="h-8 px-2 rounded-[3px] border border-[var(--color-line-200)] bg-[var(--color-surface-1)] text-[11.5px] text-[var(--color-ink-800)] focus:outline-none"
              >
                <option value="NEWEST">Newest First</option>
                <option value="HIGHEST_RISK">Highest Risk Score</option>
                <option value="OLDEST">Oldest First</option>
              </select>
            </div>
          </div>
        </div>

        {/* ALERT TABLE */}
        <Panel padded={false}>
          {alerts.error && filtered.length === 0 ? (
            <ErrorState message={alerts.error} onRetry={alerts.refresh} />
          ) : alerts.loading && filtered.length === 0 ? (
            <SkeletonTable rows={8} cols={7} />
          ) : filtered.length === 0 ? (
            <div className="p-8">
              <EmptyState message="No fraud alerts match your selected filters." />
            </div>
          ) : (
            <div className="overflow-x-auto scrollbar-thin">
              <table className="w-full min-w-[750px] text-[12px] border-collapse">
                <thead>
                  <tr className="border-b border-[var(--color-line-100)] text-left text-[10px] uppercase tracking-wider text-[var(--color-ink-400)] bg-[var(--color-surface-0)] sticky top-0">
                    <th className="py-2.5 pl-4 pr-3 font-semibold">Alert ID</th>
                    <th className="py-2.5 px-3 font-semibold">Transaction ID</th>
                    <th className="py-2.5 px-3 font-semibold">Severity</th>
                    <th className="py-2.5 px-3 font-semibold text-right">Risk Score</th>
                    <th className="py-2.5 px-3 font-semibold">Status</th>
                    <th className="py-2.5 px-3 font-semibold">Created At</th>
                    <th className="py-2.5 pr-4 pl-3 font-semibold text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[var(--color-line-100)]">
                  {filtered.map((a) => {
                    const isCritical = a.severity === 'CRITICAL'
                    const isOpen = a.status.toUpperCase() === 'OPEN'
                    const isResolved = a.status.toUpperCase() === 'RESOLVED'
                    const isBusy = busyId === a.alert_id

                    return (
                      <tr
                        key={a.alert_id}
                        className={`transition-colors hover:bg-[var(--color-surface-2)] ${
                          isCritical
                            ? 'bg-[var(--color-risk-critical-bg)]/20 font-medium'
                            : ''
                        }`}
                      >
                        <td className="py-2.5 pl-4 pr-3 font-mono font-medium text-[var(--color-ink-900)] whitespace-nowrap">
                          {isCritical && (
                            <span className="inline-block w-1.5 h-1.5 rounded-full bg-[var(--color-risk-critical)] mr-1.5" />
                          )}
                          {a.alert_id}
                        </td>
                        <td
                          className="py-2.5 px-3 font-mono text-[var(--color-accent-600)] cursor-pointer hover:underline whitespace-nowrap"
                          onClick={() => navigate(`/transactions/${encodeURIComponent(a.transaction_id)}`)}
                          title="Open Transaction Detail"
                        >
                          {a.transaction_id}
                        </td>
                        <td className="py-2.5 px-3 whitespace-nowrap">
                          <RiskBadge level={a.severity} size="sm" />
                        </td>
                        <td className="py-2.5 px-3 text-right font-mono font-bold tabular text-[var(--color-ink-900)] whitespace-nowrap">
                          {formatScore(a.risk_score)}
                        </td>
                        <td className="py-2.5 px-3 whitespace-nowrap">
                          <span
                            className={`inline-flex items-center px-1.5 py-0.5 rounded-[2px] text-[10px] font-semibold uppercase tracking-wider ${
                              isOpen
                                ? 'bg-[var(--color-risk-critical-bg)] text-[var(--color-risk-critical)] border border-[var(--color-risk-critical-line)]'
                                : isResolved
                                ? 'bg-[var(--color-risk-low-bg)] text-[var(--color-risk-low)] border border-[var(--color-risk-low-line)]'
                                : 'bg-[var(--color-risk-medium-bg)] text-[var(--color-risk-medium)] border border-[var(--color-risk-medium-line)]'
                            }`}
                          >
                            {a.status}
                          </span>
                        </td>
                        <td className="py-2.5 px-3 font-mono text-[11px] text-[var(--color-ink-500)] tabular whitespace-nowrap">
                          {formatDateTime(a.created_at)}
                        </td>
                        <td className="py-2.5 pr-4 pl-3 whitespace-nowrap text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              onClick={() => handleOpenInvestigation(a)}
                              disabled={isBusy}
                              className="text-[10.5px] font-medium px-2 py-1 rounded-[2px] border border-[var(--color-line-200)] bg-[var(--color-surface-1)] text-[var(--color-ink-800)] hover:bg-[var(--color-surface-2)] transition-colors disabled:opacity-40"
                              title="Create or open investigation case"
                            >
                              Investigate
                            </button>
                            {isOpen && (
                              <button
                                onClick={() => handleAcknowledge(a.alert_id)}
                                disabled={isBusy}
                                className="text-[10.5px] font-medium px-2 py-1 rounded-[2px] border border-[var(--color-risk-medium-line)] bg-[var(--color-risk-medium-bg)] text-[var(--color-risk-medium)] hover:opacity-80 transition-colors disabled:opacity-40"
                              >
                                Acknowledge
                              </button>
                            )}
                            {!isResolved && (
                              <button
                                onClick={() => handleResolve(a.alert_id)}
                                disabled={isBusy}
                                className="text-[10.5px] font-medium px-2 py-1 rounded-[2px] border border-[var(--color-risk-low-line)] bg-[var(--color-risk-low-bg)] text-[var(--color-risk-low)] hover:opacity-80 transition-colors disabled:opacity-40"
                              >
                                Resolve
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}
        </Panel>
      </div>
    </div>
  )
}
