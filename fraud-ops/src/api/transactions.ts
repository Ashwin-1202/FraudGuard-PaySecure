import { apiClient } from './client'
import { normalizeTransaction } from '../lib/normalize'
import type { AnalyzeTransactionInput, Transaction } from '../types'

export interface ListTransactionsParams {
  risk_level?: string
  search?: string
  page?: number
  page_size?: number
}

export async function listTransactions(params: ListTransactionsParams = {}): Promise<Transaction[]> {
  const query: Record<string, string | number> = {}
  if (params.risk_level && params.risk_level !== 'ALL') query.risk_level = params.risk_level
  if (params.search) query.search = params.search
  if (params.page) query.page = params.page
  if (params.page_size) query.page_size = params.page_size

  const { data } = await apiClient.get('/api/transactions', { params: query })
  const list = Array.isArray(data) ? data : data?.transactions ?? data?.items ?? []
  return list.map(normalizeTransaction)
}

export async function getRecentTransactions(): Promise<Transaction[]> {
  const { data } = await apiClient.get('/api/dashboard/recent-transactions')
  const list = Array.isArray(data) ? data : data?.transactions ?? data?.items ?? []
  return list.map(normalizeTransaction)
}

export async function getTransaction(id: string): Promise<Transaction> {
  const { data } = await apiClient.get(`/api/transactions/${encodeURIComponent(id)}`)
  return normalizeTransaction(data)
}

export async function analyzeTransaction(input: AnalyzeTransactionInput): Promise<Transaction> {
  const rawInput = input as unknown as Record<string, unknown>
  const amount = Number(input.amount) || 0
  const avgUserAmount = Number(input.average_user_amount) || Number(rawInput.avg_user_amount) || 1
  const amountRatio = avgUserAmount > 0 ? Number((amount / avgUserAmount).toFixed(2)) : 1

  let userIdNum = 1001
  if (typeof input.user_id === 'number') {
    userIdNum = input.user_id
  } else if (typeof input.user_id === 'string') {
    const parsed = parseInt(input.user_id.replace(/\D/g, ''), 10)
    if (!isNaN(parsed)) userIdNum = parsed
  }

  let merchantRiskInt = 0
  const mr = Number(input.merchant_risk) || 0
  if (mr > 0 && mr <= 1) {
    merchantRiskInt = Math.round(mr * 10)
  } else {
    merchantRiskInt = Math.round(mr)
  }

  const payload = {
    transaction_id: String(input.transaction_id || `TXN-${Date.now()}`),
    user_id: userIdNum,
    amount,
    avg_user_amount: avgUserAmount,
    amount_ratio: amountRatio,
    transactions_last_10min: Number(input.transactions_last_10min) || 0,
    new_device: input.new_device ? 1 : 0,
    new_location: input.new_location ? 1 : 0,
    international: input.international ? 1 : 0,
    merchant_risk: merchantRiskInt,
    account_age_days: Number(input.account_age_days) || 0,
    device_age_days: Number(input.device_age_days) || 0,
    distance_from_home: Number(input.distance_from_home_km) || Number(rawInput.distance_from_home) || 0,
    failed_attempts_10min: Number(input.failed_attempts_last_10min) || Number(rawInput.failed_attempts_10min) || 0,
    hour: Number(input.hour) || 0,
    day_of_week: Number(input.day_of_week) || 0,
    is_weekend: input.is_weekend ? 1 : 0,
    unusual_hour: input.unusual_hour ? 1 : 0,
  }

  const { data } = await apiClient.post('/api/transactions/analyze', payload)
  return normalizeTransaction(data)
}
