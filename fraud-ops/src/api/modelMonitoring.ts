import { apiClient } from './client'

export interface ModelMonitoringData {
  model_version: string
  model_type: string
  risk_threshold: number
  monitoring_window: number
  total_transactions: number
  prediction_distribution: Array<{
    name: string
    count: number
    percentage: number
  }>
  fraud_probability_distribution: Array<{
    bucket: string
    count: number
    percentage: number
  }>
  average_risk_score: number
  drift_score: number
  drift_status: string
  false_positive_rate: number | null
  false_negative_rate: number | null
  feedback_evaluated: number
  confusion_matrix: {
    true_positive: number
    false_positive: number
    false_negative: number
    true_negative: number
  }
  model_health: string
  last_updated: string
}

export async function getModelMonitoring(): Promise<ModelMonitoringData> {
  const { data } = await apiClient.get('/api/model-monitoring')
  return data
}
