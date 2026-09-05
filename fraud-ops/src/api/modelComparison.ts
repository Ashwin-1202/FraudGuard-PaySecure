import { apiClient } from './client'

export interface ModelComparisonResult {
  model: string
  precision: number
  recall: number
  f1_score: number
  roc_auc: number
  training_time_seconds: number
  inference_time_seconds: number
}

export interface ModelComparisonData {
  experiment: string
  dataset: {
    total_transactions?: number
    fraud_percentage?: number
    feature_count?: number
  }
  selected_model: string | null
  selection_reason: string
  best_result: ModelComparisonResult | null
  results: ModelComparisonResult[]
  total_models: number
}

export async function getModelComparison(): Promise<ModelComparisonData> {
  const { data } = await apiClient.get('/api/model-comparison')
  return data
}
