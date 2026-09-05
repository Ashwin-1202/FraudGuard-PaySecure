export type RiskLevel = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL'

export interface ShapContributor {
  feature: string
  display_name?: string
  value: number
  impact?: string
  explanation?: string
}

export interface RagKnowledgeItem {
  feature: string
  title: string
  content: string
  similarity?: number
}

export interface InvestigationTimeline {
  received_at?: string | null
  fraud_model_at?: string | null
  anomaly_at?: string | null
  rules_at?: string | null
  shap_at?: string | null
  rag_at?: string | null
  ai_explanation_at?: string | null
  alert_at?: string | null
  investigation_opened_at?: string | null
  investigation_resolved_at?: string | null
}

export interface AiExplanation {
  risk_explanation?: string
  top_contributing_factors?: string[]
  investigation_recommendation?: string
  raw?: string
}

export interface Transaction {
  transaction_id: string
  user_id: string
  amount: number
  average_user_amount?: number
  amount_ratio?: number
  currency?: string
  timestamp?: string

  fraud_probability?: number
  fraud_score?: number
  anomaly_score?: number
  rule_score?: number
  final_risk_score?: number
  risk_level?: RiskLevel

  reasons?: string[]
  shap_explanations?: ShapContributor[]
  ai_explanation?: AiExplanation | string | null
  rag_knowledge?: RagKnowledgeItem[]

  transactions_last_10min?: number
  failed_attempts_last_10min?: number
  new_device?: boolean
  new_location?: boolean
  international?: boolean
  merchant_risk?: number
  account_age_days?: number
  device_age_days?: number
  distance_from_home_km?: number
  hour?: number
  day_of_week?: number
  is_weekend?: boolean
  unusual_hour?: boolean

  alert_id?: string | null
  alert_status?: string | null
  investigation_id?: string | null
  investigation_status?: string | null

  timeline?: InvestigationTimeline
}

export interface Alert {
  alert_id: string
  transaction_id: string
  severity: RiskLevel
  risk_score: number
  status: 'OPEN' | 'ACKNOWLEDGED' | 'RESOLVED' | string
  created_at: string
  user_id?: string
  amount?: number
  reasons?: string[]
}

export type InvestigationStatus =
  | 'OPEN'
  | 'ASSIGNED'
  | 'INVESTIGATING'
  | 'CONFIRMED_FRAUD'
  | 'FALSE_POSITIVE'
  | 'RESOLVED'

export type InvestigationDecision = 'CONFIRMED_FRAUD' | 'FALSE_POSITIVE' | 'LEGITIMATE'

export interface Investigation {
  id?: number
  investigation_id: string
  transaction_id: string
  alert_id?: string | null
  status: InvestigationStatus | string
  assigned_to?: string | null
  investigator_notes?: string | null
  decision?: InvestigationDecision | string | null
  created_at: string
  updated_at?: string
  resolved_at?: string | null
  // Enriched in frontend if joined with transaction/alert
  risk_level?: RiskLevel
  risk_score?: number
  amount?: number
  user_id?: string
}

export interface CreateInvestigationInput {
  transaction_id: string
  alert_id?: string | null
  assigned_to?: string | null
  investigator_notes?: string | null
}

export interface UpdateInvestigationInput {
  status?: string | null
  assigned_to?: string | null
  investigator_notes?: string | null
  decision?: string | null
}

export interface DashboardStats {
  total_transactions: number
  low_risk: number
  medium_risk: number
  high_risk: number
  critical_risk: number
  open_alerts: number
  risk_distribution: Record<string, number>
  risk_trend: { time: string; score: number; risk_score?: number }[]
}

export interface SystemStatus {
  kafka: boolean | string
  risk_engine: boolean | string
  ai_xai: boolean | string
  supabase: boolean | string
  [key: string]: boolean | string
}

export interface AnalyticsData {
  total_transactions: number
  fraud_rate: number
  critical_count: number
  average_risk_score: number
  average_transaction_amount: number
  risk_distribution: Record<string, number>
  fraud_probability_distribution?: { bucket: string; count: number }[]
  transaction_volume?: { time: string; count: number }[]
  risk_score_over_time?: { time: string; score: number }[]
  top_fraud_indicators?: { name: string; count: number }[]
  top_shap_features?: { feature: string; avg_contribution: number }[]
}

export interface AnalyzeTransactionInput {
  transaction_id: string
  user_id: string
  amount: number
  average_user_amount: number
  transactions_last_10min: number
  failed_attempts_last_10min: number
  new_device: boolean
  new_location: boolean
  international: boolean
  merchant_risk: number
  account_age_days: number
  device_age_days: number
  distance_from_home_km: number
  hour: number
  day_of_week: number
  is_weekend: boolean
  unusual_hour: boolean
}
