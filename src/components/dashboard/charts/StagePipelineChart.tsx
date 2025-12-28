import { useState, useMemo } from 'react'
import { motion, AnimatePresence } from 'motion/react'
import { ChartProps } from '../dashboardConfig'
import { useApp } from '../../../store'
import { getWorkloadByStage } from '../kpiCalculators'
import { ArrowRight } from 'lucide-react'
import { DrilldownChart3D, DrilldownSegment } from './DrilldownChart3D'

export function StagePipelineChart(_props: ChartProps) {
  const { pumps } = useApp()
  const [selectedStage, setSelectedStage] = useState<string | null>(null)

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

  // Get pumps in selected stage for drill-down
  const drilldownData = useMemo((): DrilldownSegment[] => {
    if (!selectedStage) return []

    const pumpsInStage = pumps.filter((p) => p.stage === selectedStage)

    // Group by customer
    const customerMap = new Map<string, { count: number; totalAge: number }>()
    pumpsInStage.forEach((pump) => {
      if (!customerMap.has(pump.customer)) {
        customerMap.set(pump.customer, { count: 0, totalAge: 0 })
      }
      const data = customerMap.get(pump.customer)!
      data.count += 1
      // Calculate age in days using last_update
      if (pump.last_update) {
        const ageInMs = Date.now() - new Date(pump.last_update).getTime()
        const ageInDays = ageInMs / (1000 * 60 * 60 * 24)
        data.totalAge += ageInDays
      }
    })

    return Array.from(customerMap.entries())
      .map(([customer, data]) => ({
        id: customer,
        label: customer,
        value: data.count,
        color: getStageColor(selectedStage),
        sublabel: `Avg: ${data.count > 0 ? (data.totalAge / data.count).toFixed(1) : 0} days`,
      }))
      .sort((a, b) => b.value - a.value)
  }, [selectedStage, pumps])

  const handleStageClick = (stageId: string) => {
    setSelectedStage(stageId)
  }

  const handleBreadcrumbClick = () => {
    setSelectedStage(null)
  }

  const getTitle = () => {
    if (!selectedStage) return 'Production Pipeline'
    return `Pumps in ${selectedStage.replace(/_/g, ' ')}`
  }

  return (
    <div className="w-full h-full flex flex-col min-h-[300px]">
      <AnimatePresence mode="wait">
        {selectedStage ? (
          <motion.div
            key="drilldown"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="w-full h-full"
          >
            <DrilldownChart3D
              data={drilldownData}
              title={getTitle()}
              breadcrumbs={[selectedStage.replace(/_/g, ' ')]}
              onBreadcrumbClick={handleBreadcrumbClick}
              valueFormatter={(v) => `${v} pump${v === 1 ? '' : 's'}`}
            />
          </motion.div>
        ) : (
          <motion.div
            key="pipeline"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="w-full h-full flex flex-col"
          >
            {/* Title */}
            <div className="mb-4">
              <h3 className="text-lg font-semibold text-foreground">{getTitle()}</h3>
            </div>

            {/* Pipeline Visualization */}
            <div className="flex-1 flex items-center justify-center p-4 overflow-hidden relative">
              <div className="flex items-center gap-2 md:gap-4">
                {mappedData.map((stage, idx) => (
                  <div key={stage.id} className="flex items-center">
                    {/* Stage Box */}
                    <motion.div
                      initial={{ opacity: 0, y: 20, rotateX: -10 }}
                      animate={{ opacity: 1, y: 0, rotateX: 0 }}
                      transition={{ delay: idx * 0.1, duration: 0.5 }}
                      whileHover={{ scale: 1.05, y: -5, rotateX: 5 }}
                      onClick={() => handleStageClick(stage.id)}
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
                        boxShadow: `0 8px 32px 0 rgba(0, 0, 0, 0.37), inset 0 0 0 1px ${
                          stage.value > 0 ? stage.color + '40' : 'transparent'
                        }`,
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
          </motion.div>
        )}
      </AnimatePresence>
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
