import type { ReactNode } from 'react'

export interface PanelProps {
  title?: string
  subtitle?: string
  action?: ReactNode
  children: ReactNode
  className?: string
  padded?: boolean
}

export default function Panel({
  title,
  subtitle,
  action,
  children,
  className = '',
  padded = true,
}: PanelProps) {
  return (
    <section className={`border border-[var(--color-line-100)] bg-[var(--color-surface-1)] rounded-[3px] ${className}`}>
      {title && (
        <div className="flex items-center justify-between px-4 py-2.5 border-b border-[var(--color-line-100)]">
          <div>
            <h3 className="text-[11px] uppercase tracking-wide font-semibold text-[var(--color-ink-500)]">{title}</h3>
            {subtitle && <p className="text-[10.5px] text-[var(--color-ink-400)]">{subtitle}</p>}
          </div>
          {action}
        </div>
      )}
      <div className={padded ? 'p-4' : ''}>{children}</div>
    </section>
  )
}
