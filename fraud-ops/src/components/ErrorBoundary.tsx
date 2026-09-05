import { Component, type ErrorInfo, type ReactNode } from 'react'

interface ErrorBoundaryProps {
  children: ReactNode
}

interface ErrorBoundaryState {
  hasError: boolean
  error: Error | null
}

export default class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props)
    this.state = { hasError: false, error: null }
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('ErrorBoundary caught an unhandled render exception:', error, errorInfo)
  }

  handleRetry = () => {
    this.setState({ hasError: false, error: null })
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex-1 flex flex-col items-center justify-center p-6 text-center bg-[var(--color-surface-0)]">
          <div className="max-w-md w-full border border-dashed border-[var(--color-risk-critical-line)] bg-[var(--color-risk-critical-bg)] rounded-[4px] p-6 space-y-3">
            <div className="flex items-center justify-center gap-2 text-[var(--color-risk-critical)]">
              <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="10" />
                <line x1="12" y1="8" x2="12" y2="12" />
                <line x1="12" y1="16" x2="12.01" y2="16" />
              </svg>
              <h2 className="text-[14px] font-semibold">Page Rendering Error</h2>
            </div>

            <p className="text-[12px] text-[var(--color-ink-700)] leading-relaxed">
              An unexpected error occurred while rendering this page. The system caught the error to prevent application failure.
            </p>

            {this.state.error && (
              <div className="p-2.5 rounded bg-[var(--color-surface-1)] border border-[var(--color-line-100)] text-[11px] font-mono text-[var(--color-risk-critical)] text-left overflow-x-auto max-h-32">
                {this.state.error.message || String(this.state.error)}
              </div>
            )}

            <div className="pt-2 flex items-center justify-center gap-3">
              <button
                onClick={this.handleRetry}
                className="px-4 py-1.5 rounded-[3px] bg-[var(--color-accent-600)] text-white text-[12px] font-medium hover:bg-[var(--color-accent-500)] transition-colors shadow-xs"
              >
                Retry Component
              </button>
              <button
                onClick={() => window.location.reload()}
                className="px-4 py-1.5 rounded-[3px] border border-[var(--color-line-200)] bg-[var(--color-surface-1)] text-[12px] font-medium text-[var(--color-ink-800)] hover:bg-[var(--color-surface-2)] transition-colors"
              >
                Reload Window
              </button>
            </div>
          </div>
        </div>
      )
    }

    return this.props.children
  }
}
