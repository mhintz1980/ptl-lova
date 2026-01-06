import { ChartProps } from './dashboardConfig'
import { ArrowUp, ArrowDown, Minus, LucideIcon } from 'lucide-react'

interface InsightTileProps extends ChartProps {
  title: string
  value: string
  icon: LucideIcon
  change?: string
  trend?: 'up' | 'down' | 'neutral'
}

export function InsightTile({
  title,
  value,
  icon: Icon,
  change = '+2%',
  trend = 'neutral',
}: InsightTileProps) {
  const trendColor =
    trend === 'up'
      ? 'text-emerald-400'
      : trend === 'down'
      ? 'text-rose-400'
      : 'text-muted-foreground'

  const TrendIcon =
    trend === 'up' ? ArrowUp : trend === 'down' ? ArrowDown : Minus

  return (
    <div className="flex flex-col h-full justify-between">
      <div className="flex justify-between items-start">
        <div className="p-2 rounded-lg bg-primary/10 text-primary ring-1 ring-primary/20">
          <Icon className="h-5 w-5" />
        </div>
        {change && (
          <div
            className={`flex items-center text-xs font-medium ${trendColor} bg-muted/30 px-1.5 py-0.5 rounded`}
          >
            {trend !== 'neutral' && <TrendIcon className="h-3 w-3 mr-0.5" />}
            {change}
          </div>
        )}
      </div>

      <div className="mt-2">
        <h4 className="text-2xl font-bold tracking-tight">{value}</h4>
        <p className="text-xs font-medium text-muted-foreground uppercase opacity-70">
          {title}
        </p>
      </div>
    </div>
  )
}
