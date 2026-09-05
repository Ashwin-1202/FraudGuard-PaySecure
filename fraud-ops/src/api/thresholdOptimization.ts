import { apiClient } from './client'

export interface ThresholdResult {
  threshold: number
  precision: number
  recall: number
  f1: number
  fpr: number
  fnr: number
}

export interface ThresholdMetrics {
  precision: number
  recall: number
  f1: number
  fpr: number
  fnr: number
  roc_auc: number
  true_negative?: number
  false_positive?: number
  false_negative?: number
  true_positive?: number
}

export interface ThresholdOptimizationData {
  best_threshold: number
  hybrid_weights: {
    lightgbm: number
    anomaly: number
    rules: number
  }
  validation_metrics: ThresholdMetrics
  final_test_metrics: ThresholdMetrics
  threshold_results: ThresholdResult[]
  runtime_seconds?: number
  validation_size?: number
  final_test_size?: number
  dataset?: Record<string, unknown>
}

export async function getThresholdOptimization(): Promise<ThresholdOptimizationData> {
  const { data } = await apiClient.get('/api/threshold-optimization')
  return data
}
