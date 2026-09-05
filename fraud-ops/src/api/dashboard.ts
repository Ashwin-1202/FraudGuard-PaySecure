import { apiClient } from './client'
import type { DashboardStats } from '../types'

export async function getDashboardStats(): Promise<DashboardStats> {
  const { data } = await apiClient.get('/api/dashboard/stats')

  const riskDistMap: Record<string, number> = {
    LOW: Number(data.low_risk) || 0,
    MEDIUM: Number(data.medium_risk) || 0,
    HIGH: Number(data.high_risk) || 0,
    CRITICAL: Number(data.critical_risk) || 0,
  }

  if (Array.isArray(data.risk_distribution)) {
    data.risk_distribution.forEach((item: Record<string, unknown>) => {
      if (item && item.name) {
        riskDistMap[String(item.name).toUpperCase()] = Number(item.value) || 0
      }
    })
  } else if (typeof data.risk_distribution === 'object' && data.risk_distribution !== null) {
    Object.entries(data.risk_distribution as Record<string, unknown>).forEach(([k, v]) => {
      riskDistMap[k.toUpperCase()] = Number(v) || 0
    })
  }

  const riskTrend = Array.isArray(data.risk_trend)
    ? data.risk_trend.map((item: Record<string, unknown>) => ({
        time: String(item.time || ''),
        score: Number(item.score ?? item.risk_score ?? 0),
      }))
    : []

  return {
    total_transactions: Number(data.total_transactions) || 0,
    low_risk: Number(data.low_risk) || 0,
    medium_risk: Number(data.medium_risk) || 0,
    high_risk: Number(data.high_risk) || 0,
    critical_risk: Number(data.critical_risk) || 0,
    open_alerts: Number(data.open_alerts) || 0,
    risk_distribution: riskDistMap,
    risk_trend: riskTrend,
  }
}
