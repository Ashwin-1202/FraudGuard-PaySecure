import { apiClient } from './client'

export interface ConceptDriftMonth {
  month: string
  fraud_rate: number
  precision: number
  recall: number
  f1: number
  roc_auc: number
  fpr: number
  drift_score: number
  drift_status: string
  f1_drop_from_baseline: number
  retraining_recommended: boolean
}

export interface ConceptDriftData {
  results: ConceptDriftMonth[]
  baseline_f1: number
  current_f1: number
  max_drift_score: number
  drift_detected_count: number
  retraining_recommended: boolean
  overall_status: string
}

export async function getConceptDrift(): Promise<ConceptDriftData> {
  const { data } = await apiClient.get('/api/concept-drift')
  const months: ConceptDriftMonth[] = data.months ?? data.results ?? []
  const maxDrift = months.length
    ? Math.max(...months.map((m) => m.drift_score ?? 0))
    : 0
  const baselineF1 = data.baseline?.f1 ?? data.baseline_f1 ?? (months[0]?.f1 ?? 0)
  const currentF1 = data.latest?.f1 ?? data.current_f1 ?? (months[months.length - 1]?.f1 ?? 0)
  const retrainingRecommended =
    typeof data.retraining_recommended === 'boolean'
      ? data.retraining_recommended
      : (data.retraining_recommended_count ?? 0) > 0

  return {
    results: months,
    baseline_f1: Number(baselineF1) || 0,
    current_f1: Number(currentF1) || 0,
    max_drift_score: Number(maxDrift) || 0,
    drift_detected_count: data.drift_detected_count ?? 0,
    retraining_recommended: retrainingRecommended,
    overall_status: data.overall_status ?? 'UNKNOWN',
  }
}
