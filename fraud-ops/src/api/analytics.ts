import { apiClient } from './client'
import type { AnalyticsData } from '../types'

export async function getAnalytics(): Promise<AnalyticsData> {
  const { data } = await apiClient.get('/api/analytics')

  const riskDistMap: Record<string, number> = {}
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

  return {
    total_transactions: Number(data.total_transactions) || 0,
    fraud_rate: Number(data.fraud_rate) || 0,
    critical_count: Number(data.critical_count) || 0,
    average_risk_score: Number(data.avg_risk_score ?? data.average_risk_score ?? 0),
    average_transaction_amount: Number(data.avg_amount ?? data.average_transaction_amount ?? 0),
    risk_distribution: riskDistMap,
    fraud_probability_distribution: Array.isArray(data.fraud_probability_distribution)
      ? data.fraud_probability_distribution.map((item: Record<string, unknown>) => ({
          bucket: String(item.bucket || ''),
          count: Number(item.count || 0),
        }))
      : [],
    transaction_volume: Array.isArray(data.transaction_volume)
      ? data.transaction_volume.map((item: Record<string, unknown>) => ({
          time: String(item.time || ''),
          count: Number(item.count || 0),
        }))
      : [],
    risk_score_over_time: Array.isArray(data.risk_score_over_time)
      ? data.risk_score_over_time.map((item: Record<string, unknown>) => ({
          time: String(item.time || ''),
          score: Number(item.score ?? item.risk_score ?? 0),
        }))
      : [],
    top_fraud_indicators: Array.isArray(data.top_fraud_indicators)
      ? data.top_fraud_indicators.map((item: Record<string, unknown>) => ({
          name: String(item.name ?? item.reason ?? ''),
          count: Number(item.count || 0),
        }))
      : [],
    top_shap_features: Array.isArray(data.top_shap_features)
      ? data.top_shap_features.map((item: Record<string, unknown>) => ({
          feature: String(item.feature || ''),
          avg_contribution: Number(item.avg_contribution ?? item.avg_abs_shap ?? 0),
        }))
      : [],
  }
}
