import { useState, useEffect, useMemo } from 'react'
import { motion, AnimatePresence } from 'motion/react'
import { ChartProps } from '../dashboardConfig'
import { Pause, Play } from 'lucide-react'
import { DrilldownChart3D, DrilldownSegment } from './DrilldownChart3D'
import { DrilldownDonutChart, DonutSegment } from './DrilldownDonutChart'
import { useApp } from '../../../store'

// --- Types ---
export interface PerspectiveData {
  name: string
  value: number
  id: string // used for filtering/drilldown
  color?: string
  [key: string]: unknown
}

export interface DonutPerspective {
  id: string
  label: string
  data: PerspectiveData[]
}

export interface CyclingDonutChartProps extends ChartProps {
  perspectives: DonutPerspective[]
  cycleInterval?: number // ms, default 8000
}

// --- Constants ---
const COLORS = [
  '#06b6d4', // Cyan
  '#d946ef', // Magenta
  '#f97316', // Orange
  '#22c55e', // Green
  '#8b5cf6', // Violet
  '#ec4899', // Pink
  '#eab308', // Yellow
  '#3b82f6', // Blue
]

export function CyclingDonutChart({
  perspectives,
  cycleInterval = 8000,
}: CyclingDonutChartProps) {
  const [activeIndex, setActiveIndex] = useState(0)
  const [isPaused, setIsPaused] = useState(false)
  const [drilldownState, setDrilldownState] = useState<{
    perspectiveId: string
    segmentId: string
    segmentLabel: string
  } | null>(null)

  const currentPerspective = perspectives[activeIndex]

  // Auto-cycle logic
  useEffect(() => {
    // Force pause if drilled down
    if (isPaused || drilldownState || perspectives.length <= 1) return

    const timer = setInterval(() => {
      setActiveIndex((prev) => (prev + 1) % perspectives.length)
    }, cycleInterval)

    return () => clearInterval(timer)
  }, [isPaused, drilldownState, perspectives.length, cycleInterval])

  const donutData = useMemo((): DonutSegment[] => {
    return currentPerspective.data.map((d, i) => ({
      id: d.id || d.name,
      label: d.name,
      value: d.value,
      color: d.color || COLORS[i % COLORS.length],
    }))
  }, [currentPerspective])

  const handleSegmentClick = (segment: DonutSegment) => {
    setDrilldownState({
      perspectiveId: currentPerspective.id,
      segmentId: segment.id,
      segmentLabel: segment.label,
    })
  }

  return (
    <div
      className="flex flex-col h-full w-full relative overflow-hidden"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
    >
      <AnimatePresence mode="wait">
        {!drilldownState ? (
          <motion.div
            key="donut"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.3 }}
            className="w-full h-full relative"
          >
            <DrilldownDonutChart
              data={donutData}
              title={currentPerspective.label}
              onSegmentClick={handleSegmentClick}
              className="h-full"
              valueFormatter={(v) => `${v}`}
            />

            {/* Controls Overlay - Absolute Top Right */}
            <div className="absolute top-2 right-2 flex items-center gap-2 z-30">
              {perspectives.map((p, idx) => (
                <button
                  key={p.id}
                  onClick={() => setActiveIndex(idx)}
                  className={`
                      h-1.5 rounded-full transition-all duration-300
                      ${
                        idx === activeIndex
                          ? 'w-6 bg-cyan-500 shadow-[0_0_10px_rgba(6,182,212,0.5)]'
                          : 'w-1.5 bg-muted-foreground/30 hover:bg-muted-foreground/50'
                      }
                    `}
                  title={p.label}
                />
              ))}
              <div className="w-px h-3 bg-border/50 mx-1" />
              <button
                onClick={() => setIsPaused((prev) => !prev)}
                className="text-muted-foreground/50 hover:text-cyan-400 transition-colors"
              >
                {isPaused ? (
                  <Play className="h-3 w-3" />
                ) : (
                  <Pause className="h-3 w-3" />
                )}
              </button>
            </div>
          </motion.div>
        ) : (
          <motion.div
            key="drilldown"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="w-full h-full"
          >
            <DrilldownView
              perspective={currentPerspective.id}
              segmentId={drilldownState.segmentId}
              segmentLabel={drilldownState.segmentLabel}
              onBack={() => setDrilldownState(null)}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

function DrilldownView({
  perspective,
  segmentId,
  segmentLabel,
  onBack,
}: {
  perspective: string
  segmentId: string
  segmentLabel: string
  onBack: () => void
}) {
  const { pumps } = useApp()

  const drilldownData = useMemo((): DrilldownSegment[] => {
    const matches = pumps.filter((p) => {
      if (p.stage === 'CLOSED') return false

      if (perspective === 'stage') return p.stage === segmentId
      if (perspective === 'customer') return p.customer === segmentId
      if (perspective === 'model') return p.model === segmentId
      return false
    })

    const map = new Map<string, number>()
    matches.forEach((p) => {
      let key = ''
      if (perspective === 'stage') key = p.customer
      else if (perspective === 'customer') key = p.po
      else key = p.customer

      map.set(key, (map.get(key) || 0) + 1)
    })

    return Array.from(map.entries())
      .map(([label, val], idx) => ({
        id: label,
        label: label,
        value: val,
        color: COLORS[idx % COLORS.length],
        sublabel: `${val} units`,
      }))
      .sort((a, b) => b.value - a.value)
  }, [pumps, perspective, segmentId])

  return (
    <DrilldownChart3D
      data={drilldownData}
      title=""
      breadcrumbs={[segmentLabel]}
      onBreadcrumbClick={onBack}
      valueFormatter={(v) => `${v}`}
      className="h-full flex flex-col overflow-y-auto"
    />
  )
}
