import { useState } from 'react'
import { formatPercent, formatScore } from '../lib/format'
import { riskPalette } from '../lib/risk'
import type { RiskLevel, Transaction } from '../types'

interface ScoreInfo {
  label: string
  value: string
  tooltip: string
  rawPct?: number
}

export default function RiskScoreHero({ tx }: { tx: Transaction }) {
  const [activeTooltip, setActiveTooltip] = useState<string | null>(null)

  const finalScore = tx.final_risk_score !== undefined
    ? (tx.final_risk_score <= 1 ? tx.final_risk_score * 100 : tx.final_risk_score)
    : 0

  const level: RiskLevel = tx.risk_level || (finalScore >= 85 ? 'CRITICAL' : finalScore >= 70 ? 'HIGH' : finalScore >= 30 ? 'MEDIUM' : 'LOW')
  const palette = riskPalette(level)

  // Standard threshold in backend is 70 for high/alert
  const riskThreshold = 70.0

  const scores: ScoreInfo[] = [
    {
      label: 'Fraud Probability',
      value: tx.fraud_probability !== undefined ? formatPercent(tx.fraud_probability) : '—',
      tooltip: 'Supervised ML model probability that this payment is fraudulent, trained on behavioral patterns.',
      rawPct: tx.fraud_probability !== undefined ? (tx.fraud_probability <= 1 ? tx.fraud_probability * 100 : tx.fraud_probability) : undefined,
    },
    {
      label: 'Fraud ML Score',
      value: tx.fraud_score !== undefined ? formatScore(tx.fraud_score) : (tx.fraud_probability !== undefined ? formatScore(tx.fraud_probability * 100) : '—'),
      tooltip: 'Normalized risk score (0-100) computed from the primary LightGBM/XGBoost fraud classifier.',
    },
    {
      label: 'Anomaly Score',
      value: tx.anomaly_score !== undefined ? formatScore(tx.anomaly_score) : '—',
      tooltip: 'Unsupervised Isolation Forest anomaly score indicating deviation from normal transaction distributions.',
      rawPct: tx.anomaly_score,
    },
    {
      label: 'Rule Score',
      value: tx.rule_score !== undefined ? formatScore(tx.rule_score) : '—',
      tooltip: 'Deterministic heuristic policy score triggered by velocity, impossible travel, or credentials flags.',
      rawPct: tx.rule_score,
    },
    {
      label: 'Risk Threshold',
      value: `${riskThreshold.toFixed(1)} / 100`,
      tooltip: 'Operational decision boundary. Transactions scoring above this threshold trigger automatic alerts.',
    },
  ]

  return (
    <div className="space-y-4">
      {/* Top Hero Banner */}
      <div className="p-4 sm:p-5 rounded-[3px] border border-[var(--color-line-100)] bg-[var(--color-surface-1)] flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="text-[11px] uppercase tracking-wider text-[var(--color-ink-400)] font-medium mb-1">
            Composite Assessment
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-[32px] sm:text-[38px] font-bold tabular tracking-tight text-[var(--color-ink-900)]">
              {finalScore.toFixed(2)}
            </span>
            <span className="text-[16px] text-[var(--color-ink-400)] font-medium">/ 100</span>
            <span
              className="ml-3 px-2.5 py-1 rounded-[3px] text-[11px] font-semibold tracking-wider uppercase border"
              style={{
                color: palette.fg,
                backgroundColor: palette.bg,
                borderColor: palette.line,
              }}
            >
              {level} RISK
            </span>
          </div>
          <p className="text-[12px] text-[var(--color-ink-500)] mt-1">
            Weighted hybrid score blending supervised ML, unsupervised anomaly detection, and deterministic business rules.
          </p>
        </div>

        {/* Visual Multi-Tier Scale */}
        <div className="w-full md:w-72 space-y-1.5 self-stretch flex flex-col justify-center">
          <div className="flex justify-between text-[10px] uppercase font-semibold text-[var(--color-ink-400)]">
            <span className={level === 'LOW' ? 'text-[var(--color-risk-low)] font-bold' : ''}>Low</span>
            <span className={level === 'MEDIUM' ? 'text-[var(--color-risk-medium)] font-bold' : ''}>Medium</span>
            <span className={level === 'HIGH' ? 'text-[var(--color-risk-high)] font-bold' : ''}>High</span>
            <span className={level === 'CRITICAL' ? 'text-[var(--color-risk-critical)] font-bold' : ''}>Critical</span>
          </div>

          <div className="relative h-2.5 rounded-[2px] bg-[var(--color-surface-sunken)] border border-[var(--color-line-100)] overflow-hidden">
            {/* 4 segments */}
            <div className="absolute inset-0 grid grid-cols-4 divide-x divide-[var(--color-surface-1)]">
              <div className="bg-[var(--color-risk-low-bg)]" />
              <div className="bg-[var(--color-risk-medium-bg)]" />
              <div className="bg-[var(--color-risk-high-bg)]" />
              <div className="bg-[var(--color-risk-critical-bg)]" />
            </div>
            {/* Indicator pin */}
            <div
              className="absolute top-0 bottom-0 w-1.5 rounded-[1px] bg-[var(--color-ink-900)] -ml-0.5 shadow-sm transition-all duration-300"
              style={{ left: `${Math.min(100, Math.max(0, finalScore))}%` }}
            />
          </div>

          <div className="flex justify-between text-[9.5px] font-mono text-[var(--color-ink-400)] tabular">
            <span>0</span>
            <span>30</span>
            <span>70</span>
            <span>85</span>
            <span>100</span>
          </div>
        </div>
      </div>

      {/* Sub-scores Grid with Tooltips */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
        {scores.map((s) => (
          <div
            key={s.label}
            className="relative p-3 rounded-[3px] border border-[var(--color-line-100)] bg-[var(--color-surface-1)] flex flex-col justify-between group"
            onMouseEnter={() => setActiveTooltip(s.label)}
            onMouseLeave={() => setActiveTooltip(null)}
          >
            <div className="flex items-center justify-between mb-1">
              <span className="text-[10.5px] uppercase tracking-wider text-[var(--color-ink-400)] font-medium truncate">
                {s.label}
              </span>
              <button
                type="button"
                className="text-[var(--color-ink-300)] hover:text-[var(--color-ink-600)] text-[11px] cursor-help px-0.5"
                title={s.tooltip}
              >
                ⓘ
              </button>
            </div>

            <div className="text-[16px] font-semibold tabular text-[var(--color-ink-900)]">
              {s.value}
            </div>

            {/* Custom Interactive Tooltip */}
            {activeTooltip === s.label && (
              <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-48 p-2 rounded bg-[var(--color-ink-900)] text-white text-[10.5px] leading-tight shadow-lg z-30 pointer-events-none">
                {s.tooltip}
                <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-[var(--color-ink-900)]" />
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
