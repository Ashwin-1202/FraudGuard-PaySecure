import { useState } from 'react'
import { Outlet } from 'react-router-dom'
import Sidebar from './Sidebar'
import ErrorBoundary from './ErrorBoundary'

export interface AppShellContext {
  toggleMobileMenu: () => void
}

export default function AppShell() {
  const [mobileOpen, setMobileOpen] = useState(false)

  return (
    <div className="h-screen w-full flex bg-[var(--color-surface-0)] overflow-hidden">
      <Sidebar mobileOpen={mobileOpen} onClose={() => setMobileOpen(false)} />
      <main className="flex-1 min-w-0 flex flex-col min-h-0 overflow-hidden">
        <ErrorBoundary>
          <Outlet context={{ toggleMobileMenu: () => setMobileOpen((v) => !v) } satisfies AppShellContext} />
        </ErrorBoundary>
      </main>
    </div>
  )
}
