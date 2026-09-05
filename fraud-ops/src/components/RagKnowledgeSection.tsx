import { useState } from 'react'
import type { RagKnowledgeItem } from '../types'

interface RagKnowledgeSectionProps {
  items?: RagKnowledgeItem[]
}

export default function RagKnowledgeSection({ items = [] }: RagKnowledgeSectionProps) {
  const [showTechnical, setShowTechnical] = useState(false)

  if (!items || items.length === 0) {
    return (
      <div className="py-6 text-center text-[12px] text-[var(--color-ink-400)]">
        No context retrieval knowledge base articles triggered for this transaction.
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <span className="text-[11px] text-[var(--color-ink-500)]">
          Retrieved domain intelligence for triggered risk features
        </span>
        <button
          onClick={() => setShowTechnical((v) => !v)}
          className="text-[11px] font-medium text-[var(--color-accent-600)] hover:underline flex items-center gap-1"
        >
          {showTechnical ? 'Hide Technical Details' : 'Show Technical Details'}
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
        {items.map((item, idx) => (
          <div
            key={idx}
            className="p-3.5 rounded-[3px] border border-[var(--color-line-100)] bg-[var(--color-surface-1)] hover:border-[var(--color-line-200)] transition-colors flex flex-col justify-between"
          >
            <div>
              <div className="flex items-start justify-between gap-2 mb-1.5">
                <h4 className="text-[12.5px] font-semibold text-[var(--color-ink-900)] leading-snug">
                  {item.title}
                </h4>
                {item.feature && (
                  <span className="px-1.5 py-0.5 rounded-[2px] bg-[var(--color-surface-2)] text-[10px] font-mono text-[var(--color-ink-600)] shrink-0 border border-[var(--color-line-100)]">
                    {item.feature}
                  </span>
                )}
              </div>
              <p className="text-[12px] text-[var(--color-ink-700)] leading-relaxed">{item.content}</p>
            </div>

            {showTechnical && item.similarity !== undefined && (
              <div className="mt-3 pt-2 border-t border-[var(--color-line-100)] flex items-center justify-between text-[10.5px] text-[var(--color-ink-400)]">
                <span>Vector Semantic Retrieval</span>
                <span className="font-mono font-medium text-[var(--color-ink-700)]">
                  Cosine Similarity: {(item.similarity * 100).toFixed(1)}%
                </span>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
