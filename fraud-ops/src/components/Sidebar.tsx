import { useEffect, useState, type ReactNode } from 'react'
import { NavLink } from 'react-router-dom'
import { usePolling } from '../hooks/usePolling'
import { listAlerts } from '../api/alerts'
import { listInvestigations } from '../api/investigations'

interface NavSection {
  title: string
  items: {
    to: string
    label: string
    end?: boolean
    icon: (cls?: string) => ReactNode
    badgeKey?: 'openAlerts' | 'openInvestigations'
  }[]
}

const NAV_SECTIONS: NavSection[] = [
  {
    title: 'OVERVIEW',
    items: [
      {
        to: '/',
        label: 'Dashboard',
        end: true,
        icon: (cls = 'w-4 h-4') => (
          <svg className={cls} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <rect x="3" y="3" width="7" height="7" rx="1" />
            <rect x="14" y="3" width="7" height="7" rx="1" />
            <rect x="14" y="14" width="7" height="7" rx="1" />
            <rect x="3" y="14" width="7" height="7" rx="1" />
          </svg>
        ),
      },
    ],
  },
  {
    title: 'MONITORING',
    items: [
      {
        to: '/transactions',
        label: 'Live Transactions',
        icon: (cls = 'w-4 h-4') => (
          <svg className={cls} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
          </svg>
        ),
      },
      {
        to: '/alerts',
        label: 'Fraud Alerts',
        badgeKey: 'openAlerts',
        icon: (cls = 'w-4 h-4') => (
          <svg className={cls} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
            <line x1="12" y1="9" x2="12" y2="13" />
            <line x1="12" y1="17" x2="12.01" y2="17" />
          </svg>
        ),
      },
    ],
  },
  {
    title: 'INVESTIGATION',
    items: [
      {
        to: '/investigations',
        label: 'Investigation Queue',
        badgeKey: 'openInvestigations',
        icon: (cls = 'w-4 h-4') => (
          <svg className={cls} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2" />
            <rect x="8" y="2" width="8" height="4" rx="1" ry="1" />
            <path d="M9 14l2 2 4-4" />
          </svg>
        ),
      },
      {
        to: '/cases',
        label: 'Cases',
        icon: (cls = 'w-4 h-4') => (
          <svg className={cls} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <rect x="2" y="7" width="20" height="14" rx="2" ry="2" />
            <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16" />
          </svg>
        ),
      },
    ],
  },
  {
    title: 'INTELLIGENCE',
    items: [
      {
        to: '/analytics',
        label: 'Analytics',
        icon: (cls = 'w-4 h-4') => (
          <svg className={cls} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <line x1="18" y1="20" x2="18" y2="10" />
            <line x1="12" y1="20" x2="12" y2="4" />
            <line x1="6" y1="20" x2="6" y2="14" />
          </svg>
        ),
      },
      {
        to: '/insights',
        label: 'Fraud Insights',
        icon: (cls = 'w-4 h-4') => (
          <svg className={cls} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="12" cy="12" r="10" />
            <line x1="12" y1="16" x2="12" y2="12" />
            <line x1="12" y1="8" x2="12.01" y2="8" />
          </svg>
        ),
      },
      {
        to: '/model-monitoring',
        label: 'Model Monitoring',
        icon: (cls = 'w-4 h-4') => (
          <svg className={cls} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M3 3v18h18" />
            <path d="M7 16l4-5 3 3 5-7" />
          </svg>
        ),
      },
      {
        to: '/concept-drift',
        label: 'Concept Drift',
        icon: (cls = 'w-4 h-4') => (
          <svg className={cls} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M3 12h4l2-7 4 14 2-7h6" />
          </svg>
        ),
      },
      {
        to: '/model-comparison',
        label: 'Model Comparison',
        icon: (cls = 'w-4 h-4') => (
          <svg className={cls} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <rect x="3" y="4" width="7" height="16" rx="1" />
            <rect x="14" y="8" width="7" height="12" rx="1" />
          </svg>
        ),
      },
      {
        to: '/threshold-optimization',
        label: 'Threshold Optimization',
        icon: (cls = 'w-4 h-4') => (
          <svg className={cls} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M4 7h16" />
            <circle cx="9" cy="7" r="2" fill="currentColor" stroke="none" />
            <path d="M4 17h16" />
            <circle cx="15" cy="17" r="2" fill="currentColor" stroke="none" />
          </svg>
        ),
      },
    ],
  },
  {
    title: 'SYSTEM',
    items: [
      {
        to: '/system',
        label: 'System Health',
        icon: (cls = 'w-4 h-4') => (
          <svg className={cls} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <rect x="2" y="2" width="20" height="8" rx="2" ry="2" />
            <rect x="2" y="14" width="20" height="8" rx="2" ry="2" />
            <line x1="6" y1="6" x2="6.01" y2="6" />
            <line x1="6" y1="18" x2="6.01" y2="18" />
          </svg>
        ),
      },
      {
        to: '/analyze',
        label: 'Simulate Payment',
        icon: (cls = 'w-4 h-4') => (
          <svg className={cls} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <polygon points="5 3 19 12 5 21 5 3" />
          </svg>
        ),
      },
    ],
  },
]

interface SidebarProps {
  mobileOpen?: boolean
  onClose?: () => void
}

export default function Sidebar({ mobileOpen = false, onClose }: SidebarProps) {
  const [collapsed, setCollapsed] = useState(() => {
    return localStorage.getItem('fraud_ops_sidebar_collapsed') === 'true'
  })

  useEffect(() => {
    localStorage.setItem('fraud_ops_sidebar_collapsed', String(collapsed))
  }, [collapsed])

  // Badge counts
  const alertsData = usePolling(() => listAlerts({ status: 'OPEN', limit: 100 }), 15000)
  const openAlertsCount = (alertsData.data || []).length

  const invData = usePolling(() => listInvestigations({ status: 'OPEN', limit: 100 }), 15000)
  const openInvCount = (invData.data || []).length

  const badgeCounts = {
    openAlerts: openAlertsCount,
    openInvestigations: openInvCount,
  }

  const sidebarInner = (isDrawer = false) => {
    const isMini = collapsed && !isDrawer

    return (
      <div
        className={`${
          isMini ? 'w-[64px]' : 'w-[230px]'
        } shrink-0 border-r border-[var(--color-line-100)] bg-[var(--color-surface-1)] flex flex-col h-full transition-all duration-200 select-none`}
      >
        {/* Header Branding */}
        <div className="h-14 flex items-center justify-between px-3.5 border-b border-[var(--color-line-100)]">
          <div className="flex items-center gap-2.5 overflow-hidden">
            <div className="h-7 w-7 rounded-[3px] bg-[var(--color-ink-900)] flex items-center justify-center shrink-0 text-white">
              <svg width="15" height="15" viewBox="0 0 32 32" fill="currentColor">
                <path d="M16 3l11 3.8v7.6c0 7.2-4.6 12.7-11 14.7-6.4-2-11-7.5-11-14.7V6.8L16 3z" />
                <path
                  d="M11.5 16.6l3 3 6.2-6.4"
                  fill="none"
                  stroke="var(--color-surface-1)"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </div>
            {!isMini && (
              <div className="leading-tight truncate">
                <div className="text-[12.5px] font-semibold text-[var(--color-ink-900)] tracking-tight">
                  FraudOps SOC
                </div>
                <div className="text-[10px] text-[var(--color-ink-400)] font-medium uppercase tracking-wider">
                  Payments Defense
                </div>
              </div>
            )}
          </div>

          {/* Desktop collapse button or Mobile close */}
          {isDrawer ? (
            <button
              onClick={onClose}
              className="p-1 text-[var(--color-ink-500)] hover:text-[var(--color-ink-900)]"
              aria-label="Close menu"
            >
              ✕
            </button>
          ) : (
            <button
              onClick={() => setCollapsed((v) => !v)}
              className="p-1 rounded text-[var(--color-ink-400)] hover:text-[var(--color-ink-800)] hover:bg-[var(--color-surface-2)] transition-colors"
              title={isMini ? 'Expand sidebar' : 'Collapse sidebar'}
              aria-label={isMini ? 'Expand sidebar' : 'Collapse sidebar'}
            >
              <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                {isMini ? (
                  <path strokeLinecap="round" strokeLinejoin="round" d="M13 5l7 7-7 7M5 5l7 7-7 7" />
                ) : (
                  <path strokeLinecap="round" strokeLinejoin="round" d="M11 19l-7-7 7-7M19 19l-7-7 7-7" />
                )}
              </svg>
            </button>
          )}
        </div>

        {/* Navigation Sections */}
        <nav className="flex-1 overflow-y-auto scrollbar-thin py-3 px-2 space-y-4">
          {NAV_SECTIONS.map((section) => (
            <div key={section.title} className="space-y-0.5">
              {!isMini && (
                <div className="px-2.5 pb-1 text-[9.5px] font-semibold tracking-wider uppercase text-[var(--color-ink-400)]">
                  {section.title}
                </div>
              )}
              {section.items.map((item) => {
                const count = item.badgeKey ? badgeCounts[item.badgeKey] : 0

                return (
                  <NavLink
                    key={item.to}
                    to={item.to}
                    end={item.end}
                    onClick={() => onClose?.()}
                    title={isMini ? item.label : undefined}
                    className={({ isActive }) =>
                      `flex items-center gap-2.5 h-8 px-2.5 rounded-[3px] text-[12px] font-medium transition-all ${
                        isActive
                          ? 'bg-[var(--color-accent-100)] text-[var(--color-accent-600)] font-semibold shadow-xs'
                          : 'text-[var(--color-ink-700)] hover:bg-[var(--color-surface-2)] hover:text-[var(--color-ink-900)]'
                      } ${isMini ? 'justify-center px-0' : ''}`
                    }
                  >
                    <span className="shrink-0">{item.icon()}</span>
                    {!isMini && <span className="truncate flex-1">{item.label}</span>}
                    {!isMini && count > 0 && (
                      <span
                        className={`px-1.5 py-0.2 rounded-full text-[10px] font-mono font-semibold tabular ${
                          item.badgeKey === 'openAlerts'
                            ? 'bg-[var(--color-risk-critical-bg)] text-[var(--color-risk-critical)]'
                            : 'bg-[var(--color-risk-medium-bg)] text-[var(--color-risk-medium)]'
                        }`}
                      >
                        {count}
                      </span>
                    )}
                  </NavLink>
                )
              })}
            </div>
          ))}
        </nav>

        {/* Footer */}
        <div className="p-3 border-t border-[var(--color-line-100)] bg-[var(--color-surface-1)]">
          {!isMini ? (
            <div className="text-[10px] text-[var(--color-ink-400)] leading-tight flex items-center justify-between">
              <span>Engine: Real-Time</span>
              <span className="flex items-center gap-1 text-[var(--color-risk-low)] font-medium">
                <span className="h-1.5 w-1.5 rounded-full bg-[var(--color-risk-low)] live-dot" />
                Active
              </span>
            </div>
          ) : (
            <div className="flex justify-center">
              <span className="h-2 w-2 rounded-full bg-[var(--color-risk-low)] live-dot" title="Active engine" />
            </div>
          )}
        </div>
      </div>
    )
  }

  return (
    <>
      {/* Desktop Sidebar */}
      <aside className="hidden md:flex h-full shrink-0">{sidebarInner(false)}</aside>

      {/* Mobile Drawer */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50 flex md:hidden">
          <div className="fixed inset-0 bg-black/40 backdrop-blur-xs transition-opacity" onClick={onClose} />
          <div className="relative z-10 h-full shadow-2xl animate-in slide-in-from-left duration-200">
            {sidebarInner(true)}
          </div>
        </div>
      )}
    </>
  )
}
