import { useEffect, useState } from 'react'
import { useOutletContext } from 'react-router-dom'
import { formatTime } from '../lib/format'
import SystemStatusStrip from './SystemStatusStrip'
import type { SystemStatus } from '../types'
import type { AppShellContext } from './AppShell'

interface TopBarProps {
  title: string
  subtitle?: string
  status: SystemStatus | null
  lastUpdated: Date | null
  isLive?: boolean
  onRefresh?: () => void
}

export default function TopBar({
  title,
  subtitle,
  status,
  lastUpdated,
  isLive = true,
  onRefresh,
}: TopBarProps) {
  const context = useOutletContext<AppShellContext | null>()
  const [currentTime, setCurrentTime] = useState(new Date())

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000)
    return () => clearInterval(timer)
  }, [])

  return (
    <header className="min-h-[56px] py-2 shrink-0 border-b border-[var(--color-line-100)] bg-[var(--color-surface-1)] flex flex-wrap md:flex-nowrap items-center justify-between px-3 sm:px-5 gap-2 select-none">
      <div className="flex items-center gap-3">
        {context?.toggleMobileMenu && (
          <button
            onClick={context.toggleMobileMenu}
            className="md:hidden p-1.5 rounded-[3px] border border-[var(--color-line-200)] text-[var(--color-ink-700)] hover:bg-[var(--color-surface-2)]"
            aria-label="Toggle navigation menu"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
        )}
        <div>
          <h1 className="text-[13.5px] sm:text-[14px] font-semibold text-[var(--color-ink-900)] leading-tight flex items-center gap-2">
            {title}
          </h1>
          {subtitle && (
            <p className="text-[10.5px] sm:text-[11px] text-[var(--color-ink-500)] leading-tight">{subtitle}</p>
          )}
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-3 sm:gap-4 ml-auto">
        {/* Real-time SOC Clock */}
        <div className="hidden lg:flex items-center gap-1.5 px-2.5 py-1 rounded bg-[var(--color-surface-2)] text-[10.5px] font-mono tabular text-[var(--color-ink-700)] border border-[var(--color-line-100)]">
          <svg className="w-3 h-3 text-[var(--color-ink-400)]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="12" cy="12" r="10" />
            <polyline points="12 6 12 12 16 14" />
          </svg>
          <span>{currentTime.toISOString().replace('T', ' ').slice(0, 19)}</span>
        </div>

        {/* System status pill strip */}
        <div className="hidden sm:block">
          <SystemStatusStrip status={status} />
        </div>

        <div className="hidden sm:block h-4 w-px bg-[var(--color-line-100)]" />

        {/* Live indicator & Refresh action */}
        <div className="flex items-center gap-2.5">
          {isLive && (
            <span className="flex items-center gap-1.5 px-2 py-0.5 rounded-[2px] bg-[var(--color-risk-low-bg)] text-[10.5px] font-semibold text-[var(--color-risk-low)] border border-[var(--color-risk-low-line)]">
              <span className="h-1.5 w-1.5 rounded-full bg-[var(--color-risk-low)] live-dot" />
              LIVE STREAM
            </span>
          )}
          <span className="text-[10.5px] text-[var(--color-ink-400)] tabular hidden md:inline">
            Sync: {lastUpdated ? formatTime(lastUpdated.toISOString()) : '—'}
          </span>
          {onRefresh && (
            <button
              onClick={onRefresh}
              className="flex items-center gap-1 text-[11px] font-medium text-[var(--color-accent-600)] hover:bg-[var(--color-accent-100)] px-2 py-1 rounded-[3px] border border-transparent hover:border-[var(--color-accent-100)] transition-colors"
              title="Refresh telemetry"
            >
              <svg className="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M23 4v6h-6M1 20v-6h6" />
                <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15" />
              </svg>
              Refresh
            </button>
          )}
        </div>
      </div>
    </header>
  )
}
