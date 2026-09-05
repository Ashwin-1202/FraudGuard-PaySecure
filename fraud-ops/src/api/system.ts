import { apiClient } from './client'
import type { SystemStatus } from '../types'

export async function getSystemStatus(): Promise<SystemStatus> {
  const { data } = await apiClient.get('/api/system/status')
  return data
}
