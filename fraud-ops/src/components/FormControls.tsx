import type { ReactNode } from 'react'

export function FieldGroup({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div>
      <h4 className="text-[10.5px] uppercase tracking-wide font-semibold text-[var(--color-ink-400)] mb-3">{title}</h4>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">{children}</div>
    </div>
  )
}

export function Field({ label, children, full }: { label: string; children: ReactNode; full?: boolean }) {
  return (
    <label className={`block ${full ? 'col-span-1 sm:col-span-2' : ''}`}>
      <span className="block text-[11.5px] text-[var(--color-ink-600)] mb-1">{label}</span>
      {children}
    </label>
  )
}

export function TextInput(props: React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      {...props}
      className={`w-full h-8 px-2.5 rounded-[3px] border border-[var(--color-line-200)] bg-[var(--color-surface-1)] text-[12.5px] text-[var(--color-ink-900)] tabular focus:outline-none focus:border-[var(--color-accent-500)] focus:ring-1 focus:ring-[var(--color-accent-500)] ${props.className ?? ''}`}
    />
  )
}

export function Switch({ checked, onChange, label }: { checked: boolean; onChange: (v: boolean) => void; label?: boolean }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      onClick={() => onChange(!checked)}
      className="flex items-center gap-2"
    >
      <span
        className="relative inline-flex h-5 w-9 items-center rounded-full border transition-colors shrink-0"
        style={{
          backgroundColor: checked ? 'var(--color-accent-600)' : 'var(--color-surface-2)',
          borderColor: checked ? 'var(--color-accent-600)' : 'var(--color-line-200)',
        }}
      >
        <span
          className="inline-block h-3.5 w-3.5 transform rounded-full bg-white transition-transform"
          style={{ transform: checked ? 'translateX(18px)' : 'translateX(2px)' }}
        />
      </span>
      {label && <span className="text-[12px] text-[var(--color-ink-800)]">{checked ? 'Yes' : 'No'}</span>}
    </button>
  )
}
