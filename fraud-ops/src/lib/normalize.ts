import type { AiExplanation, RagKnowledgeItem, RiskLevel, ShapContributor, Transaction } from '../types'

// The backend is the single source of truth. These helpers only smooth over
// minor key-naming variance (e.g. snake_case vs camelCase, or nested vs flat
// payloads) that can exist across FastAPI route revisions -- they never
// fabricate values that the API did not provide.

function pick<T = unknown>(obj: Record<string, unknown>, keys: string[]): T | undefined {
  for (const key of keys) {
    if (obj[key] !== undefined && obj[key] !== null) return obj[key] as T
  }
  return undefined
}

export function normalizeRiskLevel(value: unknown): RiskLevel | undefined {
  if (typeof value !== 'string') return undefined
  const v = value.toUpperCase().trim()
  if (v === 'LOW' || v === 'MEDIUM' || v === 'HIGH' || v === 'CRITICAL') return v
  return undefined
}

export function normalizeShap(raw: unknown): ShapContributor[] {
  if (!raw) return []
  if (Array.isArray(raw)) {
    return raw.map((item) => {
      if (typeof item === 'object' && item !== null) {
        const o = item as Record<string, unknown>
        const feature = String(pick(o, ['feature', 'name', 'feature_name']) ?? 'Unknown feature')
        const val = Number(pick(o, ['value', 'shap_value', 'contribution']) ?? 0)
        return {
          feature,
          display_name: pick<string>(o, ['display_name', 'label', 'feature_label']) ?? feature.replace(/_/g, ' '),
          value: isNaN(val) ? 0 : val,
          impact: pick<string>(o, ['impact']) ?? (val > 0 ? 'Increases Risk' : 'Decreases Risk'),
          explanation: pick<string>(o, ['explanation', 'description']),
        }
      }
      return { feature: String(item), value: 0 }
    })
  }
  if (typeof raw === 'object') {
    return Object.entries(raw as Record<string, unknown>).map(([feature, value]) => ({
      feature,
      display_name: feature.replace(/_/g, ' '),
      value: Number(value) || 0,
      impact: Number(value) > 0 ? 'Increases Risk' : 'Decreases Risk',
    }))
  }
  return []
}

export function normalizeRagKnowledge(raw: unknown): RagKnowledgeItem[] {
  if (!raw || !Array.isArray(raw)) return []
  return raw.map((item) => {
    if (typeof item === 'object' && item !== null) {
      const o = item as Record<string, unknown>
      return {
        feature: String(pick(o, ['feature']) ?? ''),
        title: String(pick(o, ['title', 'name']) ?? 'Fraud Intelligence Signal'),
        content: String(pick(o, ['content', 'explanation', 'text', 'description']) ?? ''),
        similarity: pick<number>(o, ['similarity', 'score']),
      }
    }
    return {
      feature: '',
      title: 'Fraud Signal',
      content: String(item),
    }
  })
}

export function normalizeAiExplanation(raw: unknown): AiExplanation | null {
  if (!raw) return null
  if (typeof raw === 'string') return { raw }
  if (typeof raw === 'object') {
    const o = raw as Record<string, unknown>
    return {
      risk_explanation: pick<string>(o, ['risk_explanation', 'summary', 'explanation']),
      top_contributing_factors: pick<string[]>(o, ['top_contributing_factors', 'top_factors']) ?? undefined,
      investigation_recommendation: pick<string>(o, [
        'investigation_recommendation',
        'recommendation',
      ]),
      raw: pick<string>(o, ['raw', 'text', 'content']),
    }
  }
  return null
}

function pickBool(obj: Record<string, unknown>, keys: string[]): boolean | undefined {
  const v = pick(obj, keys)
  if (typeof v === 'boolean') return v
  if (typeof v === 'number') return v === 1
  if (typeof v === 'string') return ['1', 'true', 'yes'].includes(v.toLowerCase())
  return undefined
}

export function normalizeTransaction(raw: Record<string, unknown>): Transaction {
  const alertObj = typeof raw.alert === 'object' && raw.alert !== null ? (raw.alert as Record<string, unknown>) : null
  const txnId = String(pick(raw, ['transaction_id', 'id', 'txn_id']) ?? '')
  const riskLevel = normalizeRiskLevel(pick(raw, ['risk_level', 'risk']))

  let alertId = pick<string>(raw, ['alert_id']) ?? (alertObj ? pick<string>(alertObj, ['alert_id', 'id']) : null) ?? null
  let alertStatus = pick<string>(raw, ['alert_status']) ?? (alertObj ? pick<string>(alertObj, ['status', 'alert_status']) : null) ?? null

  if (!alertId && (riskLevel === 'HIGH' || riskLevel === 'CRITICAL')) {
    alertId = `ALERT-${txnId}`
    alertStatus = alertStatus || 'OPEN'
  }

  return {
    transaction_id: txnId,
    user_id: String(pick(raw, ['user_id', 'userId']) ?? ''),
    amount: Number(pick(raw, ['amount', 'transaction_amount']) ?? 0),
    average_user_amount: pick<number>(raw, ['average_user_amount', 'avg_user_amount']),
    amount_ratio: pick<number>(raw, ['amount_ratio']),
    currency: pick<string>(raw, ['currency']) ?? 'INR',
    timestamp: pick<string>(raw, ['timestamp', 'created_at', 'received_at']),

    fraud_probability: pick<number>(raw, ['fraud_probability']),
    fraud_score: pick<number>(raw, ['fraud_score']),
    anomaly_score: pick<number>(raw, ['anomaly_score']),
    rule_score: pick<number>(raw, ['rule_score']),
    final_risk_score: pick<number>(raw, ['final_risk_score', 'risk_score']),
    risk_level: riskLevel,

    reasons: pick<string[]>(raw, ['reasons']) ?? [],
    shap_explanations: normalizeShap(pick(raw, ['shap_explanations', 'shap_values', 'shap'])),
    ai_explanation: normalizeAiExplanation(pick(raw, ['ai_explanation'])),
    rag_knowledge: normalizeRagKnowledge(pick(raw, ['rag_knowledge', 'retrieved_knowledge'])),

    transactions_last_10min: pick<number>(raw, ['transactions_last_10min', 'transactions_last_10_minutes']),
    failed_attempts_last_10min: pick<number>(raw, ['failed_attempts_last_10min', 'failed_attempts_10min', 'failed_attempts_last_10_minutes']),
    new_device: pickBool(raw, ['new_device']),
    new_location: pickBool(raw, ['new_location']),
    international: pickBool(raw, ['international', 'is_international']),
    merchant_risk: pick<number>(raw, ['merchant_risk']),
    account_age_days: pick<number>(raw, ['account_age_days']),
    device_age_days: pick<number>(raw, ['device_age_days']),
    distance_from_home_km: pick<number>(raw, ['distance_from_home_km', 'distance_from_home']),
    hour: pick<number>(raw, ['hour']),
    day_of_week: pick<number>(raw, ['day_of_week']),
    is_weekend: pickBool(raw, ['is_weekend', 'weekend']),
    unusual_hour: pickBool(raw, ['unusual_hour']),

    alert_id: alertId,
    alert_status: alertStatus,
    investigation_id: pick<string>(raw, ['investigation_id']),
    investigation_status: pick<string>(raw, ['investigation_status']),

    timeline: pick(raw, ['timeline', 'investigation_timeline']),
  }
}
