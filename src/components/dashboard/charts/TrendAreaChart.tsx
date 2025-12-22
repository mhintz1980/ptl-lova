import { useMemo } from 'react'
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts'
import { ChartProps } from '../dashboardConfig'

// --- Types ---
export interface TrendDataPoint {
  label: string // e.g. "W1", "Jan"
  value: number
  [key: string]: any
}

interface TrendAreaChartProps extends ChartProps {
  data: TrendDataPoint[]
  color?: string // Gradient base color
  valueFormatter?: (val: number) => string
}

export function TrendAreaChart({
  data,
  color = '#06b6d4', // Cyan default
  valueFormatter = (val) => val.toString(),
}: TrendAreaChartProps) {
  const chartData = useMemo(() => {
    // We can apply further filtering here if needed, or assume parent did it.
    return data
  }, [data])

  const gradientId = `colorGradient-${color.replace('#', '')}`

  return (
    <div className="w-full h-full relative">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart
          data={chartData}
          margin={{ top: 10, right: 10, left: 0, bottom: 0 }}
        >
          <defs>
            <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor={color} stopOpacity={0.3} />
              <stop offset="95%" stopColor={color} stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid
            strokeDasharray="3 3"
            stroke="rgba(255,255,255,0.05)"
            vertical={false}
          />
          <XAxis
            dataKey="label"
            stroke="#6b7280"
            fontSize={12}
            tickLine={false}
            axisLine={false}
          />
          <YAxis
            stroke="#6b7280"
            fontSize={12}
            tickLine={false}
            axisLine={false}
            tickFormatter={(value) =>
              value >= 1000 ? `${(value / 1000).toFixed(1)}k` : value.toString()
            }
          />
          <Tooltip
            content={({ active, payload, label }) => {
              if (active && payload && payload.length) {
                return (
                  <div className="bg-popover border border-border p-2 rounded-lg shadow-lg backdrop-blur-md">
                    <p className="text-muted-foreground text-xs mb-1">
                      {label}
                    </p>
                    <p className="font-bold text-lg" style={{ color }}>
                      {valueFormatter(payload[0].value as number)}
                    </p>
                  </div>
                )
              }
              return null
            }}
          />
          <Area
            type="monotone"
            dataKey="value"
            stroke={color}
            strokeWidth={3}
            fillOpacity={1}
            fill={`url(#${gradientId})`}
            animationDuration={1500}
            // Add dots or active dot styles?
            activeDot={{ r: 6, strokeWidth: 0, fill: '#fff' }}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  )
}
