import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import TopBar from '../components/TopBar'
import Panel from '../components/Panel'
import RiskBadge from '../components/RiskBadge'
import { EmptyState, ErrorState } from '../components/EmptyState'
import { SkeletonTable } from '../components/SkeletonLoader'
import { useToast } from '../components/ToastContext'
import { usePolling } from '../hooks/usePolling'
import { createInvestigation, listInvestigations } from '../api/investigations'
import { getSystemStatus } from '../api/system'
import { formatDateTime } from '../lib/format'
import type { Investigation, RiskLevel } from '../types'

type QueueTab = 'ALL' | 'OPEN' | 'IN_PROGRESS' | 'RESOLVED'

export default function InvestigationQueue() {
  const navigate = useNavigate()
  const { showToast } = useToast()

  const [activeTab, setActiveTab] = useState<QueueTab>('OPEN')
  const [search, setSearch] = useState('')
  const [assignedFilter, setAssignedFilter] = useState<string>('ALL')

  // Create Modal state
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [newTxnId, setNewTxnId] = useState('')
  const [newAlertId, setNewAlertId] = useState('')
  const [newAssignee, setNewAssignee] = useState('')
  const [newNotes, setNewNotes] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const status = usePolling(getSystemStatus, 20000)
  const investigations = usePolling(() => listInvestigations({ limit: 200 }), 7000)

  const rawList: Investigation[] = investigations.data ?? []

  // Counts for tabs
  const openCount = rawList.filter((inv) => inv.status === 'OPEN').length
  const inProgressCount = rawList.filter((inv) =>
    ['ASSIGNED', 'INVESTIGATING'].includes(inv.status)
  ).length
  const resolvedCount = rawList.filter((inv) =>
    ['CONFIRMED_FRAUD', 'FALSE_POSITIVE', 'RESOLVED'].includes(inv.status)
  ).length

  // Filter based on active tab
  let filtered = rawList.filter((inv) => {
    if (activeTab === 'OPEN') return inv.status === 'OPEN'
    if (activeTab === 'IN_PROGRESS') return ['ASSIGNED', 'INVESTIGATING'].includes(inv.status)
    if (activeTab === 'RESOLVED') return ['CONFIRMED_FRAUD', 'FALSE_POSITIVE', 'RESOLVED'].includes(inv.status)
    return true
  })

  // Filter by search
  if (search) {
    const q = search.toLowerCase()
    filtered = filtered.filter(
      (inv) =>
        inv.investigation_id.toLowerCase().includes(q) ||
        inv.transaction_id.toLowerCase().includes(q) ||
        (inv.alert_id && inv.alert_id.toLowerCase().includes(q)) ||
        (inv.assigned_to && inv.assigned_to.toLowerCase().includes(q))
    )
  }

  // Filter by Assignee
  if (assignedFilter !== 'ALL') {
    filtered = filtered.filter((inv) => inv.assigned_to === assignedFilter)
  }

  // Unique assignees for filter
  const assignees = Array.from(
    new Set(rawList.map((i) => i.assigned_to).filter(Boolean) as string[])
  )

  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newTxnId.trim()) {
      showToast('Transaction ID is required.', 'error')
      return
    }

    setSubmitting(true)
    try {
      const inv = await createInvestigation({
        transaction_id: newTxnId.trim(),
        alert_id: newAlertId.trim() || undefined,
        assigned_to: newAssignee.trim() || undefined,
        investigator_notes: newNotes.trim() || undefined,
      })
      showToast(`Investigation ${inv.investigation_id} opened successfully.`, 'success')
      setIsModalOpen(false)
      setNewTxnId('')
      setNewAlertId('')
      setNewAssignee('')
      setNewNotes('')
      await investigations.refresh()
      navigate(`/investigations/${encodeURIComponent(inv.investigation_id)}`)
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Failed to create investigation.', 'error')
    } finally {
      setSubmitting(false)
    }
  }

  function getPriorityBadge(risk?: RiskLevel) {
    if (!risk) {
      return (
        <span className="inline-flex items-center px-1.5 py-0.5 rounded-[2px] text-[10px] font-medium bg-[var(--color-surface-2)] text-[var(--color-ink-500)]">
          NORMAL
        </span>
      )
    }
    return <RiskBadge level={risk} size="sm" />
  }

  return (
    <div className="flex-1 flex flex-col min-h-0">
      <TopBar
        title="Investigation Queue"
        subtitle="Manage active fraud investigations and investigator assignments."
        status={status.data}
        lastUpdated={investigations.lastUpdated}
        onRefresh={investigations.refresh}
      />

      <div className="flex-1 overflow-y-auto scrollbar-thin p-3 sm:p-5 space-y-4 sm:space-y-5">
        {/* TABS & ACTIONS HEADER */}
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[var(--color-line-100)] pb-2">
          {/* Work Queue Tabs */}
          <div className="flex items-center gap-2">
            {[
              { id: 'OPEN', label: 'Open Queue', count: openCount },
              { id: 'IN_PROGRESS', label: 'In Progress', count: inProgressCount },
              { id: 'RESOLVED', label: 'Resolved', count: resolvedCount },
              { id: 'ALL', label: 'All Cases', count: rawList.length },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as QueueTab)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-[3px] text-[12px] font-medium transition-all ${
                  activeTab === tab.id
                    ? 'bg-[var(--color-ink-900)] text-white shadow-xs'
                    : 'text-[var(--color-ink-600)] hover:bg-[var(--color-surface-2)]'
                }`}
              >
                <span>{tab.label}</span>
                <span
                  className={`px-1.5 py-0.2 rounded-full text-[10px] font-mono tabular ${
                    activeTab === tab.id
                      ? 'bg-white/20 text-white'
                      : 'bg-[var(--color-surface-2)] text-[var(--color-ink-500)]'
                  }`}
                >
                  {tab.count}
                </span>
              </button>
            ))}
          </div>

          {/* Create Button */}
          <button
            onClick={() => setIsModalOpen(true)}
            className="px-3.5 py-1.5 rounded-[3px] bg-[var(--color-accent-600)] text-white text-[12px] font-semibold hover:bg-[var(--color-accent-500)] transition-colors flex items-center gap-1.5 shadow-xs"
          >
            <span>+ Open Investigation</span>
          </button>
        </div>

        {/* SEARCH & FILTERS */}
        <div className="p-3 rounded-[3px] border border-[var(--color-line-100)] bg-[var(--color-surface-1)] flex flex-wrap items-center justify-between gap-3">
          <div className="relative flex-1 min-w-[220px]">
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search Case ID, Transaction, or Analyst…"
              className="h-8 w-full pl-8 pr-3 rounded-[3px] border border-[var(--color-line-200)] bg-[var(--color-surface-0)] text-[12px] focus:outline-none focus:border-[var(--color-accent-500)]"
            />
            <svg className="w-3.5 h-3.5 absolute left-2.5 top-2.5 text-[var(--color-ink-400)]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="11" cy="11" r="8" />
              <line x1="21" y1="21" x2="16.65" y2="16.65" />
            </svg>
          </div>

          {assignees.length > 0 && (
            <div className="flex items-center gap-1.5 text-[11.5px]">
              <span className="text-[var(--color-ink-400)] font-medium">Assignee:</span>
              <select
                value={assignedFilter}
                onChange={(e) => setAssignedFilter(e.target.value)}
                className="h-8 px-2 rounded-[3px] border border-[var(--color-line-200)] bg-[var(--color-surface-1)] text-[11.5px] text-[var(--color-ink-800)] focus:outline-none"
              >
                <option value="ALL">All Investigators</option>
                {assignees.map((a) => (
                  <option key={a} value={a}>
                    {a}
                  </option>
                ))}
              </select>
            </div>
          )}

          <span className="text-[11.5px] text-[var(--color-ink-400)] tabular ml-auto">
            {filtered.length} case{filtered.length === 1 ? '' : 's'} shown
          </span>
        </div>

        {/* WORK QUEUE TABLE */}
        <Panel padded={false}>
          {investigations.error && filtered.length === 0 ? (
            <ErrorState message={investigations.error} onRetry={investigations.refresh} />
          ) : investigations.loading && filtered.length === 0 ? (
            <SkeletonTable rows={8} cols={7} />
          ) : filtered.length === 0 ? (
            <div className="p-8">
              <EmptyState message="No investigations found in this queue tab." />
            </div>
          ) : (
            <div className="overflow-x-auto scrollbar-thin">
              <table className="w-full min-w-[760px] text-[12px] border-collapse">
                <thead>
                  <tr className="border-b border-[var(--color-line-100)] text-left text-[10px] uppercase tracking-wider text-[var(--color-ink-400)] bg-[var(--color-surface-0)] sticky top-0">
                    <th className="py-2.5 pl-4 pr-3 font-semibold">Investigation ID</th>
                    <th className="py-2.5 px-3 font-semibold">Transaction ID</th>
                    <th className="py-2.5 px-3 font-semibold">Alert ID</th>
                    <th className="py-2.5 px-3 font-semibold">Priority</th>
                    <th className="py-2.5 px-3 font-semibold">Status</th>
                    <th className="py-2.5 px-3 font-semibold">Assigned To</th>
                    <th className="py-2.5 px-3 font-semibold">Created Time</th>
                    <th className="py-2.5 pr-4 pl-3 font-semibold text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[var(--color-line-100)]">
                  {filtered.map((inv) => {
                    const isResolved = ['CONFIRMED_FRAUD', 'FALSE_POSITIVE', 'RESOLVED'].includes(inv.status)

                    return (
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
                        <td className="py-2.5 px-3 font-mono text-[11px] text-[var(--color-ink-600)] whitespace-nowrap">
                          {inv.alert_id || '—'}
                        </td>
                        <td className="py-2.5 px-3 whitespace-nowrap">
                          {getPriorityBadge(inv.risk_level)}
                        </td>
                        <td className="py-2.5 px-3 whitespace-nowrap">
                          <span
                            className={`inline-flex items-center px-1.5 py-0.5 rounded-[2px] text-[10px] font-semibold uppercase tracking-wider ${
                              inv.status === 'OPEN'
                                ? 'bg-[var(--color-risk-critical-bg)] text-[var(--color-risk-critical)] border border-[var(--color-risk-critical-line)]'
                                : isResolved
                                ? 'bg-[var(--color-risk-low-bg)] text-[var(--color-risk-low)] border border-[var(--color-risk-low-line)]'
                                : 'bg-[var(--color-risk-medium-bg)] text-[var(--color-risk-medium)] border border-[var(--color-risk-medium-line)]'
                            }`}
                          >
                            {inv.status}
                          </span>
                        </td>
                        <td className="py-2.5 px-3 text-[var(--color-ink-700)] whitespace-nowrap">
                          {inv.assigned_to ? (
                            <span className="flex items-center gap-1">
                              <span className="h-1.5 w-1.5 rounded-full bg-[var(--color-accent-600)]" />
                              {inv.assigned_to}
                            </span>
                          ) : (
                            <span className="text-[var(--color-ink-300)] italic">Unassigned</span>
                          )}
                        </td>
                        <td className="py-2.5 px-3 font-mono text-[11px] text-[var(--color-ink-500)] tabular whitespace-nowrap">
                          {formatDateTime(inv.created_at)}
                        </td>
                        <td className="py-2.5 pr-4 pl-3 text-right whitespace-nowrap">
                          <span className="text-[11px] font-medium text-[var(--color-accent-600)] hover:underline">
                            Open Workspace →
                          </span>
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

      {/* CREATE INVESTIGATION MODAL */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="w-full max-w-md bg-[var(--color-surface-1)] rounded-[3px] border border-[var(--color-line-200)] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-150">
            <div className="px-4 py-3 border-b border-[var(--color-line-100)] flex items-center justify-between">
              <h3 className="text-[13px] font-semibold text-[var(--color-ink-900)]">
                Initiate Fraud Investigation
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-[var(--color-ink-400)] hover:text-[var(--color-ink-800)] text-[12px]"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateSubmit} className="p-4 space-y-3 text-[12px]">
              <div>
                <label className="block text-[11px] font-medium text-[var(--color-ink-700)] mb-1">
                  Transaction ID *
                </label>
                <input
                  required
                  value={newTxnId}
                  onChange={(e) => setNewTxnId(e.target.value)}
                  placeholder="e.g. TXN-1700000001"
                  className="w-full h-8 px-2.5 rounded-[3px] border border-[var(--color-line-200)] bg-[var(--color-surface-0)] font-mono text-[11.5px] focus:outline-none focus:border-[var(--color-accent-500)]"
                />
              </div>

              <div>
                <label className="block text-[11px] font-medium text-[var(--color-ink-700)] mb-1">
                  Alert ID (Optional)
                </label>
                <input
                  value={newAlertId}
                  onChange={(e) => setNewAlertId(e.target.value)}
                  placeholder="e.g. ALERT-TXN-1700000001"
                  className="w-full h-8 px-2.5 rounded-[3px] border border-[var(--color-line-200)] bg-[var(--color-surface-0)] font-mono text-[11.5px] focus:outline-none focus:border-[var(--color-accent-500)]"
                />
              </div>

              <div>
                <label className="block text-[11px] font-medium text-[var(--color-ink-700)] mb-1">
                  Assign Investigator (Optional)
                </label>
                <input
                  value={newAssignee}
                  onChange={(e) => setNewAssignee(e.target.value)}
                  placeholder="e.g. Analyst Sarah C."
                  className="w-full h-8 px-2.5 rounded-[3px] border border-[var(--color-line-200)] bg-[var(--color-surface-0)] text-[11.5px] focus:outline-none focus:border-[var(--color-accent-500)]"
                />
              </div>

              <div>
                <label className="block text-[11px] font-medium text-[var(--color-ink-700)] mb-1">
                  Investigation Notes
                </label>
                <textarea
                  rows={3}
                  value={newNotes}
                  onChange={(e) => setNewNotes(e.target.value)}
                  placeholder="Enter initial triage notes, reasons for flagging, or customer contact notes…"
                  className="w-full p-2 rounded-[3px] border border-[var(--color-line-200)] bg-[var(--color-surface-0)] text-[11.5px] focus:outline-none focus:border-[var(--color-accent-500)]"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-[var(--color-line-100)]">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-3 py-1.5 rounded-[3px] border border-[var(--color-line-200)] text-[11.5px] font-medium text-[var(--color-ink-700)] hover:bg-[var(--color-surface-2)]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-3.5 py-1.5 rounded-[3px] bg-[var(--color-accent-600)] text-white text-[11.5px] font-semibold hover:bg-[var(--color-accent-500)] disabled:opacity-50"
                >
                  {submitting ? 'Creating Case…' : 'Create Investigation'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
