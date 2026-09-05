import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import TopBar from '../components/TopBar'
import Panel from '../components/Panel'
import MetricStrip from '../components/MetricStrip'
import { EmptyState, ErrorState } from '../components/EmptyState'
import { SkeletonTable } from '../components/SkeletonLoader'
import { usePolling } from '../hooks/usePolling'
import { listInvestigations } from '../api/investigations'
import { getSystemStatus } from '../api/system'
import { formatDateTime } from '../lib/format'
import type { Investigation } from '../types'

export default function Cases() {
  const navigate = useNavigate()
  const [filterDecision, setFilterDecision] = useState<string>('ALL')
  const [search, setSearch] = useState('')

  const status = usePolling(getSystemStatus, 20000)
  const investigations = usePolling(() => listInvestigations({ limit: 300 }), 10000)

  const list: Investigation[] = investigations.data || []

  // Metrics
  const totalCases = list.length
  const confirmedFraud = list.filter((i) => i.decision === 'CONFIRMED_FRAUD' || i.status === 'CONFIRMED_FRAUD').length
  const falsePositives = list.filter((i) => i.decision === 'FALSE_POSITIVE' || i.status === 'FALSE_POSITIVE').length
  const resolved = list.filter((i) => i.status === 'RESOLVED' || i.resolved_at).length
  const pending = totalCases - (confirmedFraud + falsePositives + resolved)

  // Filter
  let filtered = list.filter((i) => {
    if (filterDecision === 'CONFIRMED_FRAUD') {
      return i.decision === 'CONFIRMED_FRAUD' || i.status === 'CONFIRMED_FRAUD'
    }
    if (filterDecision === 'FALSE_POSITIVE') {
      return i.decision === 'FALSE_POSITIVE' || i.status === 'FALSE_POSITIVE'
    }
    if (filterDecision === 'RESOLVED') {
      return i.status === 'RESOLVED'
    }
    if (filterDecision === 'ACTIVE') {
      return !['CONFIRMED_FRAUD', 'FALSE_POSITIVE', 'RESOLVED'].includes(i.status)
    }
    return true
  })

  if (search) {
    const q = search.toLowerCase()
    filtered = filtered.filter(
      (i) =>
        i.investigation_id.toLowerCase().includes(q) ||
        i.transaction_id.toLowerCase().includes(q) ||
        (i.assigned_to && i.assigned_to.toLowerCase().includes(q))
    )
  }

  return (
    <div className="flex-1 flex flex-col min-h-0">
      <TopBar
        title="Fraud Cases & Adjudication Registry"
        subtitle="Formal compliance case management, decisions, and audit log."
        status={status.data}
        lastUpdated={investigations.lastUpdated}
        onRefresh={investigations.refresh}
      />

      <div className="flex-1 overflow-y-auto scrollbar-thin p-3 sm:p-5 space-y-4 sm:space-y-5">
        {/* METRICS ROW */}
        <MetricStrip
          metrics={[
            { label: 'Total Case Records', value: totalCases, hint: 'Registered files' },
            { label: 'Active Under Review', value: Math.max(0, pending), tone: 'var(--color-risk-medium)', hint: 'Open triage' },
            { label: 'Confirmed Fraud', value: confirmedFraud, tone: 'var(--color-risk-critical)', hint: 'Adjudicated fraud' },
            { label: 'False Positives', value: falsePositives, tone: 'var(--color-risk-low)', hint: 'Legitimate activity' },
            { label: 'Closed & Resolved', value: resolved, tone: 'var(--color-accent-600)', hint: 'Audit-ready' },
          ]}
        />

        {/* CONTROLS */}
        <div className="p-3 rounded-[3px] border border-[var(--color-line-100)] bg-[var(--color-surface-1)] flex flex-wrap items-center justify-between gap-3">
          <div className="relative flex-1 min-w-[220px]">
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by Case ID, Transaction, or Analyst…"
              className="h-8 w-full pl-8 pr-3 rounded-[3px] border border-[var(--color-line-200)] bg-[var(--color-surface-0)] text-[12px] focus:outline-none focus:border-[var(--color-accent-500)]"
            />
            <svg className="w-3.5 h-3.5 absolute left-2.5 top-2.5 text-[var(--color-ink-400)]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="11" cy="11" r="8" />
              <line x1="21" y1="21" x2="16.65" y2="16.65" />
            </svg>
          </div>

          <div className="flex items-center border border-[var(--color-line-200)] rounded-[3px] overflow-hidden text-[11px]">
            {[
              { id: 'ALL', label: 'All Cases' },
              { id: 'ACTIVE', label: 'Active' },
              { id: 'CONFIRMED_FRAUD', label: 'Confirmed Fraud' },
              { id: 'FALSE_POSITIVE', label: 'False Positives' },
              { id: 'RESOLVED', label: 'Resolved' },
            ].map((d) => (
              <button
                key={d.id}
                onClick={() => setFilterDecision(d.id)}
                className={`h-8 px-2.5 sm:px-3 font-medium border-r border-[var(--color-line-200)] last:border-r-0 transition-colors ${
                  filterDecision === d.id
                    ? 'bg-[var(--color-ink-900)] text-white'
                    : 'bg-[var(--color-surface-1)] text-[var(--color-ink-600)] hover:bg-[var(--color-surface-2)]'
                }`}
              >
                {d.label}
              </button>
            ))}
          </div>

          <span className="text-[11.5px] text-[var(--color-ink-400)] tabular ml-auto">
            {filtered.length} record{filtered.length === 1 ? '' : 's'}
          </span>
        </div>

        {/* CASES TABLE */}
        <Panel padded={false}>
          {investigations.error && filtered.length === 0 ? (
            <ErrorState message={investigations.error} onRetry={investigations.refresh} />
          ) : investigations.loading && filtered.length === 0 ? (
            <SkeletonTable rows={8} cols={7} />
          ) : filtered.length === 0 ? (
            <div className="p-8">
              <EmptyState message="No fraud case records match the selected criteria." />
            </div>
          ) : (
            <div className="overflow-x-auto scrollbar-thin">
              <table className="w-full min-w-[780px] text-[12px] border-collapse">
                <thead>
                  <tr className="border-b border-[var(--color-line-100)] text-left text-[10px] uppercase tracking-wider text-[var(--color-ink-400)] bg-[var(--color-surface-0)] sticky top-0">
                    <th className="py-2.5 pl-4 pr-3 font-semibold">Case ID</th>
                    <th className="py-2.5 px-3 font-semibold">Transaction</th>
                    <th className="py-2.5 px-3 font-semibold">Status</th>
                    <th className="py-2.5 px-3 font-semibold">Formal Adjudication</th>
                    <th className="py-2.5 px-3 font-semibold">Investigator</th>
                    <th className="py-2.5 px-3 font-semibold">Opened</th>
                    <th className="py-2.5 pr-4 pl-3 font-semibold text-right">Resolved Date</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[var(--color-line-100)]">
                  {filtered.map((inv) => (
                    <tr
                      key={inv.investigation_id}
                      onClick={() => navigate(`/investigations/${encodeURIComponent(inv.investigation_id)}`)}
                      className="cursor-pointer hover:bg-[var(--color-surface-2)] transition-colors"
                    >
                      <td className="py-2.5 pl-4 pr-3 font-mono font-medium text-[var(--color-ink-900)] whitespace-nowrap">
                        {inv.investigation_id}
                      </td>
                      <td className="py-2.5 px-3 font-mono text-[var(--color-accent-600)] whitespace-nowrap">
                        {inv.transaction_id}
                      </td>
                      <td className="py-2.5 px-3 whitespace-nowrap">
                        <span className="text-[11px] font-medium text-[var(--color-ink-800)]">
                          {inv.status}
                        </span>
                      </td>
                      <td className="py-2.5 px-3 whitespace-nowrap">
                        {inv.decision ? (
                          <span
                            className={`inline-flex items-center px-1.5 py-0.5 rounded-[2px] text-[10px] font-bold uppercase tracking-wider ${
                              inv.decision === 'CONFIRMED_FRAUD'
                                ? 'bg-[var(--color-risk-critical-bg)] text-[var(--color-risk-critical)] border border-[var(--color-risk-critical-line)]'
                                : 'bg-[var(--color-risk-low-bg)] text-[var(--color-risk-low)] border border-[var(--color-risk-low-line)]'
                            }`}
                          >
                            {inv.decision}
                          </span>
                        ) : (
                          <span className="text-[11px] text-[var(--color-ink-400)] italic">Pending Decision</span>
                        )}
                      </td>
                      <td className="py-2.5 px-3 text-[var(--color-ink-700)] whitespace-nowrap">
                        {inv.assigned_to || '—'}
                      </td>
                      <td className="py-2.5 px-3 font-mono text-[11px] text-[var(--color-ink-500)] tabular whitespace-nowrap">
                        {formatDateTime(inv.created_at)}
                      </td>
                      <td className="py-2.5 pr-4 pl-3 text-right font-mono text-[11px] text-[var(--color-ink-500)] tabular whitespace-nowrap">
                        {inv.resolved_at ? formatDateTime(inv.resolved_at) : '—'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Panel>
      </div>
    </div>
  )
}
