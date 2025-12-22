import { useMemo } from 'react'
import { motion } from 'framer-motion'
import { ChartProps } from '../dashboardConfig'
import { useApp } from '../../../store'
import { getWorkloadByStage } from '../kpiCalculators'
import { ArrowRight } from 'lucide-react'

export function StagePipelineChart({ onDrilldown }: ChartProps) {
  const { pumps } = useApp()

  const stageData = useMemo(() => {
    // getWorkloadByStage returns { name: 'Fabrication', value: 12, id: 'FABRICATION' }
    return getWorkloadByStage(pumps)
  }, [pumps])

  // Define relevant stages for the pipeline view (exclude Closed, maybe Queue if unused)
  // Usually pipeline visualizes active production flow
  // "QUEUE" -> "FABRICATION" -> "STAGED_FOR_POWDER" -> "POWDER_COAT" -> "ASSEMBLY" -> "SHIP"
  const pipelineStages = [
    'QUEUE',
    'FABRICATION',
    'STAGED_FOR_POWDER',
    'POWDER_COAT',
    'ASSEMBLY',
    'SHIP',
  ]

  const mappedData = pipelineStages.map((stageId) => {
    const found = stageData.find((d) => d.id === stageId)
    return {
      id: stageId,
      name: found?.name || stageId,
      value: found?.value || 0,
      color: getStageColor(stageId),
    }
  })

  return (
    <div className="w-full h-full flex flex-col items-center justify-center p-4 overflow-x-auto relative z-10">
      <div className="flex items-center gap-2 md:gap-4 perspective-1000">
        {mappedData.map((stage, idx) => (
          <div key={stage.id} className="flex items-center">
            {/* Stage Box */}
            <motion.div
              initial={{ opacity: 0, y: 20, rotateX: -10 }}
              animate={{ opacity: 1, y: 0, rotateX: 0 }}
              transition={{ delay: idx * 0.1, duration: 0.5 }}
              whileHover={{ scale: 1.05, y: -5, rotateX: 5 }}
              onClick={() =>
                onDrilldown && onDrilldown({ stage: stage.id as any })
              }
              className={`
                 relative group cursor-pointer
                 w-24 h-24 md:w-32 md:h-32 
                 rounded-xl border border-white/10
                 bg-gradient-to-br from-white/5 to-white/0
                 backdrop-blur-md shadow-lg
                 flex flex-col items-center justify-center
                 text-center p-2
               `}
              style={{
                boxShadow: `0 8px 32px 0 rgba(0, 0, 0, 0.37), inset 0 0 0 1px ${stage.value > 0 ? stage.color + '40' : 'transparent'}`,
              }}
            >
              {/* Neon Glow on hover */}
              <div
                className="absolute inset-0 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                style={{
                  boxShadow: `0 0 20px ${stage.color}60`,
                  border: `1px solid ${stage.color}80`,
                }}
              />

              <span className="text-3xl md:text-4xl font-bold tracking-tighter text-white drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)]">
                {stage.value}
              </span>

              <span className="text-[10px] md:text-xs font-medium uppercase tracking-wider text-muted-foreground mt-1 group-hover:text-white transition-colors line-clamp-2">
                {stage.name.replace('_', ' ')}
              </span>

              {/* Bottom Reflection Effect */}
              <div className="absolute -bottom-2 md:-bottom-4 left-2 right-2 h-1 md:h-2 bg-gradient-to-b from-white/20 to-transparent blur-sm rounded-full opacity-30" />
            </motion.div>

            {/* Arrow Connector (not after last item) */}
            {idx < mappedData.length - 1 && (
              <motion.div
                initial={{ opacity: 0, scale: 0 }}
                animate={{ opacity: 0.5, scale: 1 }}
                transition={{ delay: idx * 0.1 + 0.1 }}
                className="flex items-center justify-center w-6 md:w-10 text-muted-foreground/30"
              >
                <ArrowRight className="w-4 h-4 md:w-6 md:h-6" />
              </motion.div>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}

function getStageColor(stageId: string): string {
  switch (stageId) {
    case 'QUEUE':
      return '#94a3b8' // Slate
    case 'FABRICATION':
      return '#06b6d4' // Cyan
    case 'STAGED_FOR_POWDER':
      return '#a855f7' // Purple
    case 'POWDER_COAT':
      return '#f97316' // Orange
    case 'ASSEMBLY':
      return '#22c55e' // Green
    case 'SHIP':
      return '#3b82f6' // Blue
    default:
      return '#64748b'
  }
}
