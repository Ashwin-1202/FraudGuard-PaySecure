import { apiClient } from './client'
import type { CreateInvestigationInput, Investigation, UpdateInvestigationInput } from '../types'

export interface ListInvestigationsParams {
  status?: string
  assigned_to?: string
  limit?: number
}

function normalizeInvestigation(raw: Record<string, unknown>): Investigation {
  return {
    id: typeof raw.id === 'number' ? raw.id : undefined,
    investigation_id: String(raw.investigation_id ?? raw.id ?? ''),
    transaction_id: String(raw.transaction_id ?? ''),
    alert_id: raw.alert_id ? String(raw.alert_id) : null,
    status: String(raw.status ?? 'OPEN').toUpperCase(),
    assigned_to: raw.assigned_to ? String(raw.assigned_to) : null,
    investigator_notes: raw.investigator_notes ? String(raw.investigator_notes) : null,
    decision: raw.decision ? String(raw.decision) : null,
    created_at: String(raw.created_at ?? new Date().toISOString()),
    updated_at: raw.updated_at ? String(raw.updated_at) : undefined,
    resolved_at: raw.resolved_at ? String(raw.resolved_at) : null,
  }
}

export async function listInvestigations(params: ListInvestigationsParams = {}): Promise<Investigation[]> {
  const query: Record<string, string | number> = {}
  if (params.status && params.status !== 'ALL') query.status = params.status
  if (params.assigned_to) query.assigned_to = params.assigned_to
  if (params.limit) query.limit = params.limit

  const { data } = await apiClient.get('/api/investigations', { params: query })
  const list = Array.isArray(data) ? data : data?.investigations ?? data?.items ?? []
  return list.map(normalizeInvestigation)
}

export async function getInvestigation(id: string): Promise<Investigation> {
  const { data } = await apiClient.get(`/api/investigations/${encodeURIComponent(id)}`)
  return normalizeInvestigation(data)
}

export async function createInvestigation(input: CreateInvestigationInput): Promise<Investigation> {
  const payload: Record<string, unknown> = {
    transaction_id: input.transaction_id,
  }
  if (input.alert_id) payload.alert_id = input.alert_id
  if (input.assigned_to) payload.assigned_to = input.assigned_to
  if (input.investigator_notes) payload.investigator_notes = input.investigator_notes

  const { data } = await apiClient.post('/api/investigations', payload)
  return normalizeInvestigation(data)
}

export async function updateInvestigation(id: string, input: UpdateInvestigationInput): Promise<Investigation> {
  const payload: Record<string, unknown> = {}
  if (input.status !== undefined && input.status !== null) payload.status = input.status
  if (input.assigned_to !== undefined) payload.assigned_to = input.assigned_to
  if (input.investigator_notes !== undefined) payload.investigator_notes = input.investigator_notes
  if (input.decision !== undefined) payload.decision = input.decision

  const { data } = await apiClient.patch(`/api/investigations/${encodeURIComponent(id)}`, payload)
  return normalizeInvestigation(data)
}
