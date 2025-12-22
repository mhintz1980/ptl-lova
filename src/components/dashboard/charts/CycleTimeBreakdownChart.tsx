import { useMemo } from 'react'
import { motion } from 'framer-motion'
import { ChartProps } from '../dashboardConfig'
import { useApp } from '../../../store'
import { getAverageStageAge } from '../kpiCalculators'
import { ArrowRight } from 'lucide-react'
import { Stage } from '../../../types'

export function CycleTimeBreakdownChart({ onDrilldown }: ChartProps) {
  const { pumps } = useApp()

  const data = useMemo(() => {
    return getAverageStageAge(pumps)
  }, [pumps])

  const maxDays = Math.max(...data.map((d) => d.age), 1)

  return (
    <div className="w-full h-full p-4 overflow-y-auto custom-scrollbar">
      <div className="flex flex-col gap-4">
        {data.map((item, idx) => {
          const isBottleneck = item.age === maxDays && item.age > 0
          const widthPercent = (item.age / maxDays) * 100

          return (
            <div key={item.stage} className="relative group">
              <div className="flex justify-between text-sm mb-1 px-1">
                <span className="font-medium text-foreground/80 group-hover:text-cyan-400 transition-colors">
                  {item.stage}
                </span>
                <span className="font-mono text-xs text-muted-foreground">
                  {item.age.toFixed(1)} days avg
                </span>
              </div>

              <div
                className="h-8 w-full bg-secondary/30 rounded-md relative overflow-hidden flex items-center"
                onClick={() =>
                  onDrilldown && onDrilldown({ stage: item.stage as Stage })
                }
              >
                {/* Background Bar */}
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${widthPercent}%` }}
                  transition={{ duration: 0.8, delay: idx * 0.1 }}
                  className={`h-full absolute left-0 top-0 ${isBottleneck ? 'bg-red-500/60' : 'bg-cyan-500/40'}`}
                />

                {/* Overlay Content */}
                <div className="relative z-10 pl-2 flex items-center gap-2">
                  {isBottleneck && (
                    <span className="text-[10px] font-bold text-white bg-red-600 px-1.5 py-0.5 rounded uppercase tracking-wider animate-pulse">
                      Bottleneck
                    </span>
                  )}
                </div>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
