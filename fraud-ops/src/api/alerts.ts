import { apiClient } from './client'
import { normalizeRiskLevel } from '../lib/normalize'
import type { Alert } from '../types'

export interface ListAlertsParams {
  status?: string
  severity?: string
  limit?: number
}

function normalizeAlert(raw: Record<string, unknown>): Alert {
  const riskScore = Number(raw.risk_score ?? raw.final_risk_score ?? 0)
  return {
    alert_id: String(raw.alert_id ?? raw.id ?? ''),
    transaction_id: String(raw.transaction_id ?? raw.txn_id ?? ''),
    severity: (normalizeRiskLevel(raw.severity ?? raw.risk_level) ?? 'LOW') as Alert['severity'],
    risk_score: isNaN(riskScore) ? 0 : riskScore,
    status: String(raw.status ?? 'OPEN').toUpperCase(),
    created_at: String(raw.created_at ?? raw.created_time ?? raw.timestamp ?? ''),
    user_id: raw.user_id ? String(raw.user_id) : undefined,
    amount: raw.amount !== undefined ? Number(raw.amount) : undefined,
  }
}

export async function listAlerts(params: ListAlertsParams = {}): Promise<Alert[]> {
  const query: Record<string, string | number> = {}
  if (params.status && params.status !== 'ALL') query.status = params.status
  if (params.severity && params.severity !== 'ALL') query.severity = params.severity
  if (params.limit) query.limit = params.limit

  const { data } = await apiClient.get('/api/alerts', { params: query })
  const list = Array.isArray(data) ? data : data?.alerts ?? data?.items ?? []
  return list.map(normalizeAlert)
}

export async function getAlert(id: string): Promise<Alert> {
  const { data } = await apiClient.get(`/api/alerts/${encodeURIComponent(id)}`)
  return normalizeAlert(data)
}

export async function acknowledgeAlert(id: string): Promise<Alert> {
  const { data } = await apiClient.patch(`/api/alerts/${encodeURIComponent(id)}/acknowledge`)
  return normalizeAlert(data)
}

export async function resolveAlert(id: string): Promise<Alert> {
  const { data } = await apiClient.patch(`/api/alerts/${encodeURIComponent(id)}/resolve`)
  return normalizeAlert(data)
}
