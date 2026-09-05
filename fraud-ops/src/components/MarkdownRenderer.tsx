import { Fragment, type ReactNode } from 'react'

interface MarkdownRendererProps {
  content?: string | null
  className?: string
}

// Parses inline bold, italics, inline code, and clean formatting
function renderInline(text: string): ReactNode[] {
  // Regex to match **bold**, *italic*, `code`
  const parts: ReactNode[] = []
  const regex = /(\*\*.*?\*\*|\*.*?\*|`.*?`)/g
  let lastIndex = 0
  let match: RegExpExecArray | null

  while ((match = regex.exec(text)) !== null) {
    if (match.index > lastIndex) {
      parts.push(text.substring(lastIndex, match.index))
    }

    const token = match[0]
    if (token.startsWith('**') && token.endsWith('**')) {
      parts.push(
        <strong key={`b-${match.index}`} className="font-semibold text-[var(--color-ink-900)]">
          {token.slice(2, -2)}
        </strong>
      )
    } else if (token.startsWith('*') && token.endsWith('*')) {
      parts.push(
        <em key={`i-${match.index}`} className="italic">
          {token.slice(1, -1)}
        </em>
      )
    } else if (token.startsWith('`') && token.endsWith('`')) {
      parts.push(
        <code
          key={`c-${match.index}`}
          className="px-1 py-0.5 rounded bg-[var(--color-surface-2)] text-[11px] font-mono text-[var(--color-ink-900)] border border-[var(--color-line-100)]"
        >
          {token.slice(1, -1)}
        </code>
      )
    }

    lastIndex = regex.lastIndex
  }

  if (lastIndex < text.length) {
    parts.push(text.substring(lastIndex))
  }

  return parts
}

export default function MarkdownRenderer({ content, className = '' }: MarkdownRendererProps) {
  if (!content || !content.trim()) {
    return <p className="text-[12px] text-[var(--color-ink-400)] italic">No narrative content available.</p>
  }

  const lines = content.split('\n')
  const elements: ReactNode[] = []

  let inList: 'ul' | 'ol' | null = null
  let listItems: ReactNode[] = []

  let inTable = false
  let tableHeaders: string[] = []
  let tableRows: string[][] = []

  const flushList = () => {
    if (!inList) return
    if (inList === 'ul') {
      elements.push(
        <ul key={`ul-${elements.length}`} className="space-y-1.5 my-2 pl-4 list-disc text-[12.5px] text-[var(--color-ink-800)] marker:text-[var(--color-accent-600)]">
          {listItems}
        </ul>
      )
    } else if (inList === 'ol') {
      elements.push(
        <ol key={`ol-${elements.length}`} className="space-y-1.5 my-2 pl-4 list-decimal text-[12.5px] text-[var(--color-ink-800)] marker:text-[var(--color-ink-500)]">
          {listItems}
        </ol>
      )
    }
    inList = null
    listItems = []
  }

  const flushTable = () => {
    if (!inTable) return
    elements.push(
      <div key={`table-${elements.length}`} className="overflow-x-auto my-3 border border-[var(--color-line-100)] rounded-[3px]">
        <table className="w-full text-left text-[12px]">
          {tableHeaders.length > 0 && (
            <thead className="bg-[var(--color-surface-2)] border-b border-[var(--color-line-100)]">
              <tr>
                {tableHeaders.map((h, i) => (
                  <th key={i} className="px-3 py-2 font-medium text-[var(--color-ink-700)]">
                    {renderInline(h)}
                  </th>
                ))}
              </tr>
            </thead>
          )}
          <tbody className="divide-y divide-[var(--color-line-100)]">
            {tableRows.map((row, rIdx) => (
              <tr key={rIdx} className="hover:bg-[var(--color-surface-2)] transition-colors">
                {row.map((cell, cIdx) => (
                  <td key={cIdx} className="px-3 py-2 text-[var(--color-ink-800)]">
                    {renderInline(cell)}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    )
    inTable = false
    tableHeaders = []
    tableRows = []
  }

  for (let i = 0; i < lines.length; i++) {
    const rawLine = lines[i]
    const trimmed = rawLine.trim()

    if (!trimmed) {
      flushList()
      flushTable()
      continue
    }

    // Markdown Tables
    if (trimmed.startsWith('|') && trimmed.endsWith('|')) {
      flushList()
      const cells = trimmed
        .slice(1, -1)
        .split('|')
        .map((c) => c.trim())

      // Skip separator rows like |---|---|
      if (cells.every((c) => /^[-:\s]+$/.test(c))) {
        continue
      }

      if (!inTable) {
        inTable = true
        tableHeaders = cells
      } else {
        tableRows.push(cells)
      }
      continue
    } else {
      flushTable()
    }

    // Headings
    if (trimmed.startsWith('# ')) {
      flushList()
      elements.push(
        <h1 key={`h1-${i}`} className="text-[14px] font-semibold text-[var(--color-ink-900)] mt-4 mb-2 pb-1 border-b border-[var(--color-line-100)]">
          {renderInline(trimmed.slice(2))}
        </h1>
      )
      continue
    }
    if (trimmed.startsWith('## ')) {
      flushList()
      elements.push(
        <h2 key={`h2-${i}`} className="text-[13px] font-semibold text-[var(--color-ink-900)] mt-3.5 mb-1.5 flex items-center gap-1.5">
          <span className="h-1.5 w-1.5 rounded-full bg-[var(--color-accent-600)]" />
          {renderInline(trimmed.slice(3))}
        </h2>
      )
      continue
    }
    if (trimmed.startsWith('### ')) {
      flushList()
      elements.push(
        <h3 key={`h3-${i}`} className="text-[12px] uppercase tracking-wide font-semibold text-[var(--color-accent-600)] mt-3 mb-1">
          {renderInline(trimmed.slice(4))}
        </h3>
      )
      continue
    }

    // Unordered List
    if (/^[-*•]\s+/.test(trimmed)) {
      if (inList !== 'ul') {
        flushList()
        inList = 'ul'
      }
      const itemText = trimmed.replace(/^[-*•]\s+/, '')
      listItems.push(<li key={`li-${i}`}>{renderInline(itemText)}</li>)
      continue
    }

    // Ordered List
    if (/^\d+\.\s+/.test(trimmed)) {
      if (inList !== 'ol') {
        flushList()
        inList = 'ol'
      }
      const itemText = trimmed.replace(/^\d+\.\s+/, '')
      listItems.push(<li key={`li-${i}`}>{renderInline(itemText)}</li>)
      continue
    }

    // Regular Paragraph
    flushList()
    elements.push(
      <p key={`p-${i}`} className="text-[12.5px] text-[var(--color-ink-800)] leading-relaxed my-1.5">
        {renderInline(trimmed)}
      </p>
    )
  }

  flushList()
  flushTable()

  return <div className={`space-y-1 ${className}`}>{elements.map((el, i) => <Fragment key={i}>{el}</Fragment>)}</div>
}
