import { useEffect, useState } from 'react'
import TopBar from '../components/TopBar'
import Panel from '../components/Panel'
import MetricStrip from '../components/MetricStrip'
import { ErrorState } from '../components/EmptyState'
import { usePolling } from '../hooks/usePolling'
import { getSystemStatus } from '../api/system'
import { API_BASE_URL, apiClient } from '../api/client'

interface ServiceComponent {
  key: string
  name: string
  role: string
  telemetrySource: string
  statusKey: string
}

const SERVICES: ServiceComponent[] = [
  {
    key: 'api_server',
    name: 'FastAPI Application Server',
    role: 'Core REST API, request ingestion, orchestration',
    telemetrySource: '/health',
    statusKey: 'api',
  },
  {
    key: 'supabase',
    name: 'PostgreSQL / Supabase Database',
    role: 'Persistence of transactions, alerts, and investigator cases',
    telemetrySource: '/api/system/status (table ping)',
    statusKey: 'supabase',
  },
  {
    key: 'kafka',
    name: 'Apache Kafka Event Bus',
    role: 'High-throughput real-time payment transaction streaming',
    telemetrySource: '/api/system/status (broker heartbeat)',
    statusKey: 'kafka',
  },
  {
    key: 'risk_engine',
    name: 'Supervised Fraud ML Model (XGBoost/LightGBM)',
    role: 'Feature engineering, probability scoring, threshold evaluation',
    telemetrySource: '/api/system/status',
    statusKey: 'risk_engine',
  },
  {
    key: 'anomaly_engine',
    name: 'Anomaly Detection Engine (Isolation Forest)',
    role: 'Unsupervised multivariate outlier identification',
    telemetrySource: '/api/system/status (coupled to risk_engine)',
    statusKey: 'risk_engine',
  },
  {
    key: 'ai_xai',
    name: 'Explainability & XAI Service (Groq LLM + SHAP)',
    role: 'TreeSHAP attribution and investigator narrative synthesis',
    telemetrySource: '/api/system/status (GROQ_API_KEY check)',
    statusKey: 'ai_xai',
  },
  {
    key: 'rag_semantic',
    name: 'Semantic RAG Knowledge Base (all-MiniLM-L6-v2)',
    role: 'Domain vector retrieval for triggered risk feature vectors',
    telemetrySource: '/api/system/status (coupled to ai_xai)',
    statusKey: 'ai_xai',
  },
]

function isConnected(value: unknown): boolean {
  if (typeof value === 'boolean') return value
  if (typeof value === 'string') return ['up', 'connected', 'ok', 'true', 'healthy', 'online'].includes(value.toLowerCase())
  return false
}

export default function SystemStatusPage() {
  const status = usePolling(getSystemStatus, 6000)

  const [latencyMs, setLatencyMs] = useState<number | null>(null)
  const [apiHealth, setApiHealth] = useState<boolean | null>(null)

  useEffect(() => {
    let mounted = true
    const checkPing = async () => {
      const start = performance.now()
      try {
        const res = await apiClient.get('/health')
        const end = performance.now()
        if (mounted) {
          setLatencyMs(Math.round(end - start))
          setApiHealth(res.status === 200)
        }
      } catch {
        if (mounted) {
          setApiHealth(false)
          setLatencyMs(null)
        }
      }
    }
    checkPing()
    const timer = setInterval(checkPing, 10000)
    return () => {
      mounted = false
      clearInterval(timer)
    }
  }, [])

  const sData = status.data

  // Calculate status map
  const statusMap: Record<string, boolean> = {
    api: apiHealth ?? true,
    supabase: sData ? isConnected(sData.supabase) : false,
    kafka: sData ? isConnected(sData.kafka) : false,
    risk_engine: sData ? isConnected(sData.risk_engine) : false,
    ai_xai: sData ? isConnected(sData.ai_xai) : false,
  }

  const onlineCount = Object.values(statusMap).filter(Boolean).length
  const totalCount = Object.keys(statusMap).length

  return (
    <div className="flex-1 flex flex-col min-h-0">
      <TopBar
        title="System Health & Infrastructure Telemetry"
        subtitle="Real-time connectivity monitoring of microservices and ML engines."
        status={status.data}
        lastUpdated={status.lastUpdated}
        onRefresh={status.refresh}
      />

      <div className="flex-1 overflow-y-auto scrollbar-thin p-3 sm:p-5 space-y-4 sm:space-y-5">
        {/* SUMMARY STRIP */}
        <MetricStrip
          metrics={[
            {
              label: 'Overall Health',
              value: onlineCount === totalCount ? 'OPERATIONAL' : 'DEGRADED',
              tone: onlineCount === totalCount ? 'var(--color-risk-low)' : 'var(--color-risk-high)',
              hint: `${onlineCount}/${totalCount} subsystems online`,
            },
            {
              label: 'API Roundtrip Latency',
              value: latencyMs !== null ? `${latencyMs} ms` : '—',
              tone: 'var(--color-ink-900)',
              hint: 'HTTP /health ping',
            },
            {
              label: 'Event Streaming',
              value: statusMap.kafka ? 'ONLINE' : 'OFFLINE',
              tone: statusMap.kafka ? 'var(--color-risk-low)' : 'var(--color-risk-critical)',
              hint: 'Kafka cluster ingestion',
            },
            {
              label: 'AI & Explainer Engine',
              value: statusMap.ai_xai ? 'READY' : 'STANDBY',
              tone: statusMap.ai_xai ? 'var(--color-risk-low)' : 'var(--color-risk-medium)',
              hint: 'Groq + TreeSHAP worker',
            },
          ]}
        />

        {/* CONNECTION CONFIG */}
        <Panel title="Host Configuration">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-[12px]">
            <div className="flex items-center gap-2">
              <span className="text-[var(--color-ink-500)]">Target Backend Endpoint:</span>
              <span className="font-mono font-medium text-[var(--color-ink-900)] bg-[var(--color-surface-2)] px-2 py-0.5 rounded border border-[var(--color-line-100)]">
                {API_BASE_URL}
              </span>
            </div>
            <div className="text-[11px] text-[var(--color-ink-400)]">
              Protocols: HTTP/JSON REST · Port 8000
            </div>
          </div>
        </Panel>

        {/* SUBSYSTEM MATRIX */}
        <Panel title="Subsystem Health Matrix" subtitle="Explicit telemetry reported directly from backend status endpoints" padded={false}>
          {status.error && !sData ? (
            <ErrorState message={status.error} onRetry={status.refresh} />
          ) : (
            <div className="overflow-x-auto scrollbar-thin">
              <table className="w-full min-w-[700px] text-[12px] border-collapse">
                <thead>
                  <tr className="border-b border-[var(--color-line-100)] text-left text-[10px] uppercase tracking-wider text-[var(--color-ink-400)] bg-[var(--color-surface-0)]">
                    <th className="py-2.5 pl-4 pr-3 font-semibold">Subsystem Component</th>
                    <th className="py-2.5 px-3 font-semibold">Operational Function</th>
                    <th className="py-2.5 px-3 font-semibold">Backend Telemetry Source</th>
                    <th className="py-2.5 pr-4 pl-3 font-semibold text-right">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[var(--color-line-100)]">
                  {SERVICES.map((s) => {
                    const up = statusMap[s.statusKey] ?? false

                    return (
                      <tr key={s.key} className="hover:bg-[var(--color-surface-2)] transition-colors">
                        <td className="py-3 pl-4 pr-3">
                          <div className="flex items-center gap-2.5">
                            <span
                              className="h-2 w-2 rounded-full shrink-0"
                              style={{
                                backgroundColor: up ? 'var(--color-risk-low)' : 'var(--color-risk-critical)',
                              }}
                            />
                            <span className="font-medium text-[var(--color-ink-900)]">
                              {s.name}
                            </span>
                          </div>
                        </td>
                        <td className="py-3 px-3 text-[var(--color-ink-600)] text-[11.5px]">
                          {s.role}
                        </td>
                        <td className="py-3 px-3 font-mono text-[11px] text-[var(--color-ink-400)]">
                          {s.telemetrySource}
                        </td>
                        <td className="py-3 pr-4 pl-3 text-right">
                          <span
                            className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-[2px] text-[10px] font-bold uppercase tracking-wider ${
                              up
                                ? 'bg-[var(--color-risk-low-bg)] text-[var(--color-risk-low)] border border-[var(--color-risk-low-line)]'
                                : 'bg-[var(--color-risk-critical-bg)] text-[var(--color-risk-critical)] border border-[var(--color-risk-critical-line)]'
                            }`}
                          >
                            <span
                              className="h-1.5 w-1.5 rounded-full"
                              style={{
                                backgroundColor: up ? 'var(--color-risk-low)' : 'var(--color-risk-critical)',
                              }}
                            />
                            {up ? 'Operational' : 'Unavailable'}
                          </span>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}
        </Panel>
      </div>
    </div>
  )
}
