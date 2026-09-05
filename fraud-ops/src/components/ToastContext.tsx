import { createContext, useCallback, useContext, useState, type ReactNode } from 'react'

export type ToastType = 'success' | 'error' | 'info' | 'warning'

interface ToastMessage {
  id: string
  text: string
  type: ToastType
}

interface ToastContextValue {
  showToast: (text: string, type?: ToastType) => void
}

const ToastContext = createContext<ToastContextValue | null>(null)

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<ToastMessage[]>([])

  const showToast = useCallback((text: string, type: ToastType = 'info') => {
    const id = `${Date.now()}-${Math.random().toString(36).substring(2, 7)}`
    setToasts((prev) => [...prev.slice(-4), { id, text, type }])

    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id))
    }, 4500)
  }, [])

  const removeToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id))
  }

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2 max-w-sm pointer-events-none">
        {toasts.map((toast) => {
          let toneBg = 'bg-[var(--color-surface-1)] border-[var(--color-line-200)] text-[var(--color-ink-900)]'
          let indicatorColor = 'bg-[var(--color-accent-600)]'

          if (toast.type === 'success') {
            toneBg = 'bg-[var(--color-risk-low-bg)] border-[var(--color-risk-low-line)] text-[var(--color-risk-low)]'
            indicatorColor = 'bg-[var(--color-risk-low)]'
          } else if (toast.type === 'error') {
            toneBg = 'bg-[var(--color-risk-critical-bg)] border-[var(--color-risk-critical-line)] text-[var(--color-risk-critical)]'
            indicatorColor = 'bg-[var(--color-risk-critical)]'
          } else if (toast.type === 'warning') {
            toneBg = 'bg-[var(--color-risk-medium-bg)] border-[var(--color-risk-medium-line)] text-[var(--color-risk-medium)]'
            indicatorColor = 'bg-[var(--color-risk-medium)]'
          }

          return (
            <div
              key={toast.id}
              className={`pointer-events-auto flex items-start gap-2.5 px-3 py-2.5 rounded-[3px] border shadow-md text-[12px] transition-all animate-in fade-in slide-in-from-bottom-2 duration-150 ${toneBg}`}
            >
              <span className={`h-1.5 w-1.5 rounded-full mt-1.5 shrink-0 ${indicatorColor}`} />
              <div className="flex-1 leading-snug font-medium break-words">{toast.text}</div>
              <button
                onClick={() => removeToast(toast.id)}
                className="text-[var(--color-ink-400)] hover:text-[var(--color-ink-800)] p-0.5 text-[11px]"
                aria-label="Dismiss toast"
              >
                ✕
              </button>
            </div>
          )
        })}
      </div>
    </ToastContext.Provider>
  )
}

export function useToast() {
  const ctx = useContext(ToastContext)
  if (!ctx) {
    return {
      showToast: (msg: string) => console.log('Toast:', msg),
    }
  }
  return ctx
}
