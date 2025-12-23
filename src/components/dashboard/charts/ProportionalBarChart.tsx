import { useMemo } from 'react'
import { motion } from 'motion/react'
import { ChartProps } from '../dashboardConfig'
import { Badge } from '../../ui/Badge'
import { Stage } from '../../../types'

// --- Types ---
export interface ProportionalBarItem {
  id: string
  name: string
  value: number
  color?: string
  limit?: number // Capacity/Limit for this specific bar
}

export interface ProportionalBarChartProps extends ChartProps {
  items: ProportionalBarItem[]
  maxVal?: number // Optional override for scale calculation
  showLabels?: boolean
}

export function ProportionalBarChart({
  items,
  maxVal,
  showLabels = true,
  onDrilldown,
}: ProportionalBarChartProps) {
  // Calculate max if not provided, for scaling
  const maxValue = useMemo(() => {
    if (maxVal) return maxVal
    return Math.max(...items.map((i) => i.limit || i.value)) * 1.1 // 10% buffering
  }, [items, maxVal])

  return (
    <div className="flex flex-col gap-4 w-full h-full overflow-y-auto pr-2 custom-scrollbar">
      {items.map((item, idx) => {
        const percentage = Math.min(
          100,
          (item.value / (item.limit || maxValue)) * 100
        )
        const isOverLimit = item.limit && item.value > item.limit

        return (
          <div key={item.id} className="group">
            <div className="flex justify-between items-end mb-1">
              <span className="text-sm font-medium text-foreground/80 group-hover:text-cyan-400 transition-colors">
                {item.name}
              </span>
              <div className="flex items-center gap-2">
                <span className="text-xs font-mono text-muted-foreground">
                  {item.value} {item.limit ? `/ ${item.limit}` : ''}
                </span>
                {showLabels && (
                  <Badge
                    variant={isOverLimit ? 'destructive' : 'outline'}
                    className="text-[10px] h-5 px-1"
                  >
                    {percentage.toFixed(0)}%
                  </Badge>
                )}
              </div>
            </div>

            <div
              className="h-3 w-full bg-secondary/50 rounded-full overflow-hidden cursor-pointer relative"
              onClick={() =>
                onDrilldown && onDrilldown({ stage: item.name as Stage })
              }
            >
              {/* Limit Marker if applicable */}
              {item.limit && (
                <div
                  className="absolute top-0 bottom-0 w-0.5 bg-white/20 z-10"
                  style={{ left: `${(item.limit / maxValue) * 100}%` }}
                />
              )}

              <motion.div
                className={`h-full rounded-full ${
                  isOverLimit ? 'bg-red-500' : 'bg-cyan-500'
                }`}
                initial={{ width: 0 }}
                animate={{ width: `${(item.value / maxValue) * 100}%` }}
                transition={{ duration: 1, delay: idx * 0.1 }}
                style={
                  item.color && !isOverLimit
                    ? { backgroundColor: item.color }
                    : {}
                }
              />
            </div>
          </div>
        )
      })}

      {items.length === 0 && (
        <div className="flex items-center justify-center h-full text-muted-foreground text-sm">
          No data available
        </div>
      )}
    </div>
  )
}
