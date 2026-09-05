import { Field, FieldGroup, Switch, TextInput } from './FormControls'
import type { AnalyzeTransactionInput } from '../types'

interface TransactionFormProps {
  value: AnalyzeTransactionInput
  onChange: (value: AnalyzeTransactionInput) => void
  onSubmit: () => void
  onLoadTest: () => void
  onClear: () => void
  submitting: boolean
}

export function set<K extends keyof AnalyzeTransactionInput>(
  value: AnalyzeTransactionInput,
  onChange: (v: AnalyzeTransactionInput) => void,
  key: K
) {
  return (v: AnalyzeTransactionInput[K]) => onChange({ ...value, [key]: v })
}

export default function TransactionForm({ value, onChange, onSubmit, onLoadTest, onClear, submitting }: TransactionFormProps) {
  const num = (key: keyof AnalyzeTransactionInput) => ({
    value: value[key] as number,
    onChange: (e: React.ChangeEvent<HTMLInputElement>) =>
      onChange({ ...value, [key]: e.target.value === '' ? 0 : Number(e.target.value) }),
    type: 'number' as const,
  })
  const str = (key: keyof AnalyzeTransactionInput) => ({
    value: value[key] as string,
    onChange: (e: React.ChangeEvent<HTMLInputElement>) => onChange({ ...value, [key]: e.target.value }),
    type: 'text' as const,
  })

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault()
        onSubmit()
      }}
      className="space-y-6"
    >
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <p className="text-[12px] text-[var(--color-ink-500)]">
          Enter transaction details to run it through the fraud detection engine.
        </p>
        <div className="flex items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={onLoadTest}
            className="text-[11.5px] font-medium px-2.5 py-1.5 rounded-[3px] border border-[var(--color-line-200)] text-[var(--color-ink-700)] hover:bg-[var(--color-surface-2)]"
          >
            Load Test Transaction
          </button>
          <button
            type="button"
            onClick={onClear}
            className="text-[11.5px] font-medium px-2.5 py-1.5 rounded-[3px] border border-[var(--color-line-200)] text-[var(--color-ink-500)] hover:bg-[var(--color-surface-2)]"
          >
            Clear
          </button>
        </div>
      </div>

      <FieldGroup title="Payment">
        <Field label="Transaction ID">
          <TextInput placeholder="TXN-2026-000482" {...str('transaction_id')} />
        </Field>
        <Field label="User ID">
          <TextInput placeholder="USR-88214" {...str('user_id')} />
        </Field>
        <Field label="Amount (₹)">
          <TextInput min={0} step="0.01" {...num('amount')} />
        </Field>
        <Field label="Average User Amount (₹)">
          <TextInput min={0} step="0.01" {...num('average_user_amount')} />
        </Field>
      </FieldGroup>

      <FieldGroup title="Behaviour">
        <Field label="Transactions in Last 10 Minutes">
          <TextInput min={0} step={1} {...num('transactions_last_10min')} />
        </Field>
        <Field label="Failed Attempts in Last 10 Minutes">
          <TextInput min={0} step={1} {...num('failed_attempts_last_10min')} />
        </Field>
      </FieldGroup>

      <FieldGroup title="Device &amp; Location">
        <Field label="New Device">
          <Switch checked={value.new_device} onChange={set(value, onChange, 'new_device')} label />
        </Field>
        <Field label="New Location">
          <Switch checked={value.new_location} onChange={set(value, onChange, 'new_location')} label />
        </Field>
        <Field label="International Transaction">
          <Switch checked={value.international} onChange={set(value, onChange, 'international')} label />
        </Field>
        <Field label="Distance From Home (km)">
          <TextInput min={0} step={1} {...num('distance_from_home_km')} />
        </Field>
      </FieldGroup>

      <FieldGroup title="Merchant">
        <Field label="Merchant Risk (0.00 – 1.00)">
          <TextInput min={0} max={1} step="0.01" {...num('merchant_risk')} />
        </Field>
      </FieldGroup>

      <FieldGroup title="Account &amp; Device History">
        <Field label="Account Age (days)">
          <TextInput min={0} step={1} {...num('account_age_days')} />
        </Field>
        <Field label="Device Age (days)">
          <TextInput min={0} step={1} {...num('device_age_days')} />
        </Field>
      </FieldGroup>

      <FieldGroup title="Time">
        <Field label="Hour (0–23)">
          <TextInput min={0} max={23} step={1} {...num('hour')} />
        </Field>
        <Field label="Day of Week (0=Mon)">
          <TextInput min={0} max={6} step={1} {...num('day_of_week')} />
        </Field>
        <Field label="Weekend">
          <Switch checked={value.is_weekend} onChange={set(value, onChange, 'is_weekend')} label />
        </Field>
        <Field label="Unusual Hour">
          <Switch checked={value.unusual_hour} onChange={set(value, onChange, 'unusual_hour')} label />
        </Field>
      </FieldGroup>

      <div className="pt-2 border-t border-[var(--color-line-100)] flex justify-end">
        <button
          type="submit"
          disabled={submitting}
          className="h-9 px-5 rounded-[3px] bg-[var(--color-ink-900)] text-white text-[12.5px] font-medium hover:bg-[var(--color-ink-700)] disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {submitting ? 'Analyzing transaction…' : 'Analyze Transaction'}
        </button>
      </div>
    </form>
  )
}
