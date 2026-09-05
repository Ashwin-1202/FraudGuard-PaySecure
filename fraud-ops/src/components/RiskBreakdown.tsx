import RiskMeter from './RiskMeter'
import { formatPercent, formatScore } from '../lib/format'
import type { Transaction } from '../types'

export default function RiskBreakdown({ tx }: { tx: Transaction }) {
  return (
    <div className="space-y-3">
      <RiskMeter
        label="Fraud Model"
        value={tx.fraud_probability !== undefined ? tx.fraud_probability * (tx.fraud_probability <= 1 ? 100 : 1) : undefined}
        tone="var(--color-accent-600)"
        valueLabel={formatPercent(tx.fraud_probability)}
      />
      <RiskMeter
        label="Anomaly Detection"
        value={tx.anomaly_score !== undefined ? (tx.anomaly_score <= 1 ? tx.anomaly_score * 100 : tx.anomaly_score) : undefined}
        tone="var(--color-ink-700)"
        valueLabel={formatScore(tx.anomaly_score)}
      />
      <RiskMeter
        label="Business Rules"
        value={tx.rule_score !== undefined ? (tx.rule_score <= 1 ? tx.rule_score * 100 : tx.rule_score) : undefined}
        tone="var(--color-ink-700)"
        valueLabel={formatScore(tx.rule_score)}
      />
      <div className="pt-2 border-t border-[var(--color-line-100)]">
        <RiskMeter
          label="Final Risk Score"
          value={tx.final_risk_score !== undefined ? (tx.final_risk_score <= 1 ? tx.final_risk_score * 100 : tx.final_risk_score) : undefined}
          tone="var(--color-risk-high)"
          valueLabel={formatScore(tx.final_risk_score)}
        />
      </div>
    </div>
  )
}
