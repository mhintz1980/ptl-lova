import { useMemo } from 'react'
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  YAxis,
  XAxis,
  Tooltip,
} from 'recharts'
import { ChartProps } from './dashboardConfig'
import { ArrowUpRight, ArrowDownRight, Minus } from 'lucide-react'

// Mock data generator for sparklines
const generateSparklineData = (points = 20, trend: 'up' | 'down' | 'flat') => {
  const data = []
  let value = 50
  for (let i = 0; i < points; i++) {
    const noise = Math.random() * 20 - 10
    if (trend === 'up') value += Math.random() * 5
    else if (trend === 'down') value -= Math.random() * 5
    else value += noise

    // Keep within logical bounds
    value = Math.max(10, Math.min(100, value))
    data.push({ i, value })
  }
  return data
}

interface HeroKpiCardProps extends ChartProps {
  title: string
  value: string
  change?: string
  trend?: 'up' | 'down' | 'neutral'
  color?: string
}

export function HeroKpiCard({
  title,
  value,
  change = '+12%',
  trend = 'up',
  color = '#8884d8',
}: HeroKpiCardProps) {
  // In a real app, we'd use 'filters' to fetch real historical data
  const data = useMemo(
    () =>
      generateSparklineData(
        20,
        trend === 'neutral' ? 'flat' : (trend as 'up' | 'down' | 'flat')
      ),
    [trend]
  )

  const TrendIcon =
    trend === 'up' ? ArrowUpRight : trend === 'down' ? ArrowDownRight : Minus

  const trendColor =
    trend === 'up'
      ? 'text-emerald-400'
      : trend === 'down'
        ? 'text-rose-400'
        : 'text-muted-foreground'

  return (
    <div className="flex flex-col h-full justify-between">
      <div className="flex justify-between items-start z-10">
        <div>
          <p className="text-sm font-medium text-muted-foreground uppercase tracking-wider">
            {title}
          </p>
          <div className="mt-2 flex items-baseline gap-2">
            <h3 className="text-4xl font-bold tracking-tight text-foreground">
              {value}
            </h3>
            <span
              className={`flex items-center text-sm font-medium ${trendColor}`}
            >
              <TrendIcon className="h-4 w-4 mr-0.5" />
              {change}
            </span>
          </div>
        </div>
      </div>

      <div className="h-[60px] w-full mt-4 -mb-2 opacity-50 hover:opacity-100 transition-opacity duration-500">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data}>
            <defs>
              <linearGradient
                id={`gradient-${title}`}
                x1="0"
                y1="0"
                x2="0"
                y2="1"
              >
                <stop offset="5%" stopColor={color} stopOpacity={0.5} />
                <stop offset="95%" stopColor={color} stopOpacity={0} />
              </linearGradient>
            </defs>
            <XAxis dataKey="i" hide />
            <YAxis hide domain={['dataMin - 10', 'dataMax + 10']} />
            <Tooltip cursor={false} content={() => null} />
            <Area
              type="monotone"
              dataKey="value"
              stroke={color}
              strokeWidth={3}
              fill={`url(#gradient-${title})`}
              isAnimationActive={true}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}
