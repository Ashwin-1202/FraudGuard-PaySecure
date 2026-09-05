import { Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { EmptyState } from './EmptyState'

interface Point {
  time: string
  score: number
}

export default function RiskTrendChart({ data, height = 160 }: { data: Point[]; height?: number }) {
  if (!data || data.length === 0) return <EmptyState message="No recent risk activity." />

  return (
    <div style={{ width: '100%', height }}>
      <ResponsiveContainer>
        <LineChart data={data} margin={{ top: 6, right: 8, bottom: 0, left: -18 }}>
          <XAxis
            dataKey="time"
            tick={{ fontSize: 10, fill: 'var(--color-ink-400)' }}
            axisLine={{ stroke: 'var(--color-line-100)' }}
            tickLine={false}
          />
          <YAxis
            domain={[0, 100]}
            tick={{ fontSize: 10, fill: 'var(--color-ink-400)' }}
            axisLine={false}
            tickLine={false}
            width={30}
          />
          <Tooltip
            contentStyle={{
              fontSize: 11,
              borderRadius: 3,
              border: '1px solid var(--color-line-200)',
              boxShadow: 'none',
            }}
            labelStyle={{ color: 'var(--color-ink-500)' }}
          />
          <Line
            type="monotone"
            dataKey="score"
            stroke="var(--color-accent-600)"
            strokeWidth={1.75}
            dot={false}
            activeDot={{ r: 3 }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  )
}
