import { useState } from 'react'
import TopBar from '../components/TopBar'
import Panel from '../components/Panel'
import MetricStrip from '../components/MetricStrip'
import { EmptyState, ErrorState } from '../components/EmptyState'
import { usePolling } from '../hooks/usePolling'
import { getAnalytics } from '../api/analytics'
import { listTransactions } from '../api/transactions'
import { getSystemStatus } from '../api/system'
import { formatPercent, formatScore } from '../lib/format'
import type { Transaction } from '../types'

export default function FraudInsights() {
  const [selectedSignal, setSelectedSignal] = useState<string | null>(null)

  const status = usePolling(getSystemStatus, 20000)
  const analytics = usePolling(getAnalytics, 15000)
  const transactions = usePolling(() => listTransactions({ page_size: 100 }), 15000)

  const a = analytics.data
  const txList: Transaction[] = transactions.data || []

  // Aggregate real behavioral patterns from transactions
  const totalAnalyzed = txList.length

  const velocitySpikes = txList.filter(
    (t) => t.transactions_last_10min && t.transactions_last_10min > 3
  ).length

  const failedAttemptsSpikes = txList.filter(
    (t) => t.failed_attempts_last_10min && t.failed_attempts_last_10min > 0
  ).length

  const newDeviceAndLocation = txList.filter((t) => t.new_device && t.new_location).length

  const internationalAnomalies = txList.filter((t) => t.international).length

  const unusualHours = txList.filter((t) => t.unusual_hour).length

  // Extract all retrieved RAG knowledge cards across recent transactions without duplication
  const knowledgeMap = new Map<string, { title: string; feature: string; content: string }>()
  txList.forEach((t) => {
    (t.rag_knowledge || []).forEach((k) => {
      if (k.title && !knowledgeMap.has(k.title)) {
        knowledgeMap.set(k.title, {
          title: k.title,
          feature: k.feature,
          content: k.content,
        })
      }
    })
  })

  const uniqueKnowledge = Array.from(knowledgeMap.values())

  return (
    <div className="flex-1 flex flex-col min-h-0">
      <TopBar
        title="Fraud Intelligence & Behavioral Insights"
        subtitle="Threat intelligence and recurring anomaly signatures synthesized from live traffic."
        status={status.data}
        lastUpdated={analytics.lastUpdated}
        onRefresh={() => {
          analytics.refresh()
          transactions.refresh()
        }}
      />

      <div className="flex-1 overflow-y-auto scrollbar-thin p-3 sm:p-5 space-y-4 sm:space-y-5">
        {analytics.error && !a ? (
          <ErrorState message={analytics.error} onRetry={analytics.refresh} />
        ) : (
          <>
            {/* METRIC STRIP */}
            <MetricStrip
              metrics={[
                { label: 'Sample Analyzed', value: totalAnalyzed, hint: 'Recent stream size' },
                { label: 'Portfolio Fraud Rate', value: a ? formatPercent(a.fraud_rate) : '—', tone: 'var(--color-risk-high)', hint: 'High + Critical' },
                { label: 'Avg Risk Index', value: a ? formatScore(a.average_risk_score) : '—', hint: '0-100 baseline' },
                { label: 'Credential Stress (Failed)', value: failedAttemptsSpikes, tone: 'var(--color-risk-critical)', hint: 'Failed attempt flags' },
                { label: 'Device + Geo Swaps', value: newDeviceAndLocation, tone: 'var(--color-risk-medium)', hint: 'Co-occurring features' },
              ]}
            />

            {/* TOP FRAUD PATTERNS & COMMON RISK SIGNALS */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-5">
              {/* Common Risk Signals */}
              <Panel
                title="Common Risk Signals (Empirical Frequency)"
                subtitle="Frequency of triggered detection flags across recent transactions"
                padded={false}
              >
                {a?.top_fraud_indicators && a.top_fraud_indicators.length > 0 ? (
                  <div className="divide-y divide-[var(--color-line-100)]">
                    {a.top_fraud_indicators.map((sig, idx) => {
                      const isSelected = selectedSignal === sig.name
                      return (
                        <div
                          key={idx}
                          onClick={() => setSelectedSignal((prev) => (prev === sig.name ? null : sig.name))}
                          className={`flex items-center justify-between p-3.5 hover:bg-[var(--color-surface-2)] cursor-pointer transition-colors ${
                            isSelected ? 'bg-[var(--color-accent-100)]/70' : ''
                          }`}
                        >
                          <div className="flex items-center gap-2">
                            <span className="h-2 w-2 rounded-full bg-[var(--color-risk-high)]" />
                            <span className="text-[12.5px] font-medium text-[var(--color-ink-900)]">
                              {sig.name}
                            </span>
                            {isSelected && (
                              <span className="text-[10px] text-[var(--color-accent-600)] font-semibold">(Selected)</span>
                            )}
                          </div>
                          <div className="flex items-center gap-3">
                            <span className="text-[11px] text-[var(--color-ink-400)]">
                              {totalAnalyzed > 0 ? `${((sig.count / totalAnalyzed) * 100).toFixed(0)}% prevalence` : ''}
                            </span>
                            <span className="px-2 py-0.5 rounded-[2px] bg-[var(--color-surface-2)] text-[12px] font-mono font-bold tabular text-[var(--color-ink-900)] border border-[var(--color-line-100)]">
                              {sig.count}
                            </span>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                ) : (
                  <div className="p-6">
                    <EmptyState message="More transaction data is required to aggregate risk signals." />
                  </div>
                )}
              </Panel>

              {/* High-Risk Behavioral Indicators */}
              <Panel
                title="High-Risk Behavioral Indicators"
                subtitle="Multi-signal compound vectors observed in telemetry"
              >
                <div className="space-y-3 text-[12px]">
                  <div className="p-3 rounded-[3px] border border-[var(--color-line-100)] bg-[var(--color-surface-1)]">
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-semibold text-[var(--color-ink-900)]">
                        Account Takeover (ATO) Pattern
                      </span>
                      <span className="text-[10.5px] font-mono font-semibold text-[var(--color-risk-critical)]">
                        {newDeviceAndLocation} observed
                      </span>
                    </div>
                    <p className="text-[11.5px] text-[var(--color-ink-500)] leading-relaxed">
                      Simultaneous new device fingerprint and new geographic IP/city. Highly predictive of credential stuffing or session hijacking.
                    </p>
                  </div>

                  <div className="p-3 rounded-[3px] border border-[var(--color-line-100)] bg-[var(--color-surface-1)]">
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-semibold text-[var(--color-ink-900)]">
                        Rapid Velocity Burst (Card Testing)
                      </span>
                      <span className="text-[10.5px] font-mono font-semibold text-[var(--color-risk-high)]">
                        {velocitySpikes} observed
                      </span>
                    </div>
                    <p className="text-[11.5px] text-[var(--color-ink-500)] leading-relaxed">
                      More than 3 transactions executed within a rolling 10-minute window, indicative of automated card validation bot activity.
                    </p>
                  </div>

                  <div className="p-3 rounded-[3px] border border-[var(--color-line-100)] bg-[var(--color-surface-1)]">
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-semibold text-[var(--color-ink-900)]">
                        Brute-Force PIN / OTP Exhaustion
                      </span>
                      <span className="text-[10.5px] font-mono font-semibold text-[var(--color-risk-critical)]">
                        {failedAttemptsSpikes} observed
                      </span>
                    </div>
                    <p className="text-[11.5px] text-[var(--color-ink-500)] leading-relaxed">
                      Repeated authorization failures immediately preceding a successful transaction execution.
                    </p>
                  </div>

                  <div className="p-3 rounded-[3px] border border-[var(--color-line-100)] bg-[var(--color-surface-1)]">
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-semibold text-[var(--color-ink-900)]">
                        Out-of-Hours Cross-Border Routing
                      </span>
                      <span className="text-[10.5px] font-mono font-semibold text-[var(--color-risk-medium)]">
                        {internationalAnomalies + unusualHours} observed
                      </span>
                    </div>
                    <p className="text-[11.5px] text-[var(--color-ink-500)] leading-relaxed">
                      International cross-border transactions occurring during dormant circadian hours (2am - 5am local account time).
                    </p>
                  </div>
                </div>
              </Panel>
            </div>

            {/* TOP SHAP IMPACT DRIVERS */}
            <Panel
              title="Top Machine Learning Drivers (SHAP Absolute Attribution)"
              subtitle="Average magnitude of influence each feature exerts on the gradient boosted tree classifier"
              padded={false}
            >
              {a?.top_shap_features && a.top_shap_features.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 divide-y sm:divide-y-0 sm:divide-x divide-[var(--color-line-100)]">
                  {a.top_shap_features.map((feat, idx) => (
                    <div key={idx} className="p-4 space-y-1.5 hover:bg-[var(--color-surface-0)] transition-colors">
                      <div className="text-[10.5px] uppercase font-semibold text-[var(--color-ink-400)] tracking-wider">
                        Rank #{idx + 1} Driver
                      </div>
                      <div className="text-[13px] font-semibold text-[var(--color-ink-900)] capitalize truncate">
                        {feat.feature.replace(/_/g, ' ')}
                      </div>
                      <div className="flex items-baseline gap-2">
                        <span className="text-[18px] font-mono font-bold text-[var(--color-accent-600)]">
                          +{feat.avg_contribution.toFixed(3)}
                        </span>
                        <span className="text-[10px] text-[var(--color-ink-400)]">Mean |SHAP|</span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-6">
                  <EmptyState message="SHAP contribution aggregates require active transaction inference history." />
                </div>
              )}
            </Panel>

            {/* RAG FRAUD KNOWLEDGE BASE DIRECTORY */}
            <Panel
              title="Retrieved Fraud Knowledge Base Articles"
              subtitle="Context retrieval domain repository utilized by the Explainable AI (XAI) agent"
            >
              {uniqueKnowledge.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                  {uniqueKnowledge.map((k, i) => (
                    <div
                      key={i}
                      className="p-3.5 rounded-[3px] border border-[var(--color-line-100)] bg-[var(--color-surface-1)] hover:border-[var(--color-line-200)] transition-colors"
                    >
                      <div className="flex items-center justify-between mb-1.5">
                        <h4 className="text-[12.5px] font-semibold text-[var(--color-ink-900)]">
                          {k.title}
                        </h4>
                        <span className="text-[10px] font-mono bg-[var(--color-surface-2)] px-1.5 py-0.2 rounded text-[var(--color-ink-600)] border border-[var(--color-line-100)]">
                          {k.feature}
                        </span>
                      </div>
                      <p className="text-[12px] text-[var(--color-ink-600)] leading-relaxed">
                        {k.content}
                      </p>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-6">
                  <EmptyState message="Context retrieval knowledge items will populate automatically as transactions trigger specific risk features." />
                </div>
              )}
            </Panel>
          </>
        )}
      </div>
    </div>
  )
}
