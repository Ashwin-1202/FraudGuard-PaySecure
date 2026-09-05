import type { RiskLevel } from '../types'

export const RISK_LEVELS: RiskLevel[] = ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL']

interface RiskPalette {
  fg: string
  bg: string
  line: string
  label: string
}

export function riskPalette(level: RiskLevel | undefined | null): RiskPalette {
  switch (level) {
    case 'LOW':
      return { fg: 'var(--color-risk-low)', bg: 'var(--color-risk-low-bg)', line: 'var(--color-risk-low-line)', label: 'Low' }
    case 'MEDIUM':
      return { fg: 'var(--color-risk-medium)', bg: 'var(--color-risk-medium-bg)', line: 'var(--color-risk-medium-line)', label: 'Medium' }
    case 'HIGH':
      return { fg: 'var(--color-risk-high)', bg: 'var(--color-risk-high-bg)', line: 'var(--color-risk-high-line)', label: 'High' }
    case 'CRITICAL':
      return { fg: 'var(--color-risk-critical)', bg: 'var(--color-risk-critical-bg)', line: 'var(--color-risk-critical-line)', label: 'Critical' }
    default:
      return { fg: 'var(--color-ink-400)', bg: 'var(--color-surface-2)', line: 'var(--color-line-200)', label: 'Unknown' }
  }
}

export function riskLevelFromScore(score: number | undefined | null): RiskLevel | undefined {
  if (score === undefined || score === null || Number.isNaN(score)) return undefined
  const s = score <= 1 ? score * 100 : score
  if (s >= 85) return 'CRITICAL'
  if (s >= 65) return 'HIGH'
  if (s >= 35) return 'MEDIUM'
  return 'LOW'
}
