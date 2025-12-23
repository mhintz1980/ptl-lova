import { useState, useEffect, useMemo } from 'react'
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip,
  Sector,
} from 'recharts'
import { motion, AnimatePresence } from 'motion/react'
import { ChartProps } from '../dashboardConfig'
import { Pause, Play } from 'lucide-react'

// --- Types ---
export interface PerspectiveData {
  name: string
  value: number
  id: string // used for filtering/drilldown
  color?: string
  [key: string]: any // Add index signature for Recharts
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

const renderActiveShape = (props: any) => {
  const {
    cx,
    cy,
    innerRadius,
    outerRadius,
    startAngle,
    endAngle,
    fill,
    payload,
    percent,
  } = props

  return (
    <g>
      <Sector
        cx={cx}
        cy={cy}
        innerRadius={innerRadius}
        outerRadius={outerRadius + 6}
        startAngle={startAngle}
        endAngle={endAngle}
        fill={fill}
      />
      <Sector
        cx={cx}
        cy={cy}
        startAngle={startAngle}
        endAngle={endAngle}
        innerRadius={innerRadius - 4}
        outerRadius={outerRadius + 8}
        fill={fill}
        fillOpacity={0.2}
      />
      <text
        x={cx}
        y={cy - 10}
        dy={0}
        textAnchor="middle"
        fill="#ffffff"
        className="text-lg font-bold"
      >
        {payload.value}
      </text>
      <text
        x={cx}
        y={cy + 12}
        dy={0}
        textAnchor="middle"
        fill="#9ca3af"
        className="text-xs"
      >
        {(percent * 100).toFixed(0)}%
      </text>
    </g>
  )
}

export function CyclingDonutChart({
  perspectives,
  cycleInterval = 8000,
  onDrilldown,
}: CyclingDonutChartProps) {
  const [activeIndex, setActiveIndex] = useState(0)
  const [activeShapeIndex, setActiveShapeIndex] = useState<number | undefined>(
    undefined
  )
  const [isPaused, setIsPaused] = useState(false)

  // Auto-cycle logic
  useEffect(() => {
    if (isPaused || perspectives.length <= 1) return

    const timer = setInterval(() => {
      setActiveIndex((prev) => (prev + 1) % perspectives.length)
    }, cycleInterval)

    return () => clearInterval(timer)
  }, [isPaused, perspectives.length, cycleInterval])

  const currentPerspective = perspectives[activeIndex]

  const totalValue = useMemo(
    () => currentPerspective.data.reduce((acc, curr) => acc + curr.value, 0),
    [currentPerspective]
  )

  const handleSliceClick = (entry: PerspectiveData) => {
    let filterUpdate: any = {}
    if (currentPerspective.id.toLowerCase().includes('customer')) {
      filterUpdate.customerId = entry.id || entry.name
    } else if (currentPerspective.id.toLowerCase().includes('model')) {
      filterUpdate.modelId = entry.id || entry.name
    } else if (currentPerspective.id.toLowerCase().includes('stage')) {
      filterUpdate.stage = entry.id || entry.name
    }

    onDrilldown(filterUpdate)
  }

  return (
    <div
      className="flex flex-col h-full w-full"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
    >
      <div className="flex-1 min-h-0 relative">
        <AnimatePresence mode="wait">
          <motion.div
            key={currentPerspective.id}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            transition={{ duration: 0.4, ease: 'easeInOut' }}
            className="w-full h-full"
          >
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  // @ts-ignore
                  activeIndex={activeShapeIndex}
                  activeShape={renderActiveShape}
                  data={currentPerspective.data}
                  cx="50%"
                  cy="50%"
                  innerRadius="55%"
                  outerRadius="75%"
                  paddingAngle={4}
                  dataKey="value"
                  onMouseEnter={(_, index) => setActiveShapeIndex(index)}
                  onMouseLeave={() => setActiveShapeIndex(undefined)}
                  onClick={(_, index) =>
                    handleSliceClick(currentPerspective.data[index])
                  }
                  cursor="pointer"
                >
                  {/* Recharts Pie children mapping */}
                  {currentPerspective.data.map((entry, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={entry.color || COLORS[index % COLORS.length]}
                      stroke="rgba(0,0,0,0.2)"
                      strokeWidth={1}
                    />
                  ))}
                </Pie>
                <Tooltip
                  content={({ active, payload }) => {
                    if (active && payload && payload.length) {
                      const data = payload[0].payload
                      return (
                        <div className="bg-popover/95 backdrop-blur-md border border-border p-3 rounded-xl shadow-xl">
                          <p className="font-semibold text-foreground">
                            {data.name}
                          </p>
                          <p className="text-sm text-cyan-400 font-mono">
                            {data.value} Units
                          </p>
                          <p className="text-xs text-muted-foreground mt-1">
                            {((data.value / totalValue) * 100).toFixed(1)}% of
                            total
                          </p>
                        </div>
                      )
                    }
                    return null
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          </motion.div>
        </AnimatePresence>

        {/* Center Text (Absolute) - Shows current total or title */}
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className="text-center opacity-30 mt-16 scale-75 md:scale-100">
            <span className="text-xs uppercase tracking-wider block">
              {currentPerspective.label}
            </span>
          </div>
        </div>
      </div>

      {/* Controls */}
      <div className="flex items-center justify-center gap-2 mt-2">
        {perspectives.map((p, idx) => (
          <button
            key={p.id}
            onClick={() => setActiveIndex(idx)}
            className={`
              h-2 rounded-full transition-all duration-300
              ${
                idx === activeIndex
                  ? 'w-8 bg-cyan-500 shadow-[0_0_10px_rgba(6,182,212,0.5)]'
                  : 'w-2 bg-muted-foreground/30 hover:bg-muted-foreground/50'
              }
            `}
            title={p.label}
          />
        ))}

        <div className="ml-2 pl-2 border-l border-border/20">
          <button
            onClick={() => setIsPaused((prev) => !prev)}
            className="text-muted-foreground/50 hover:text-cyan-400 transition-colors p-1"
          >
            {isPaused ? (
              <Play className="h-3 w-3" />
            ) : (
              <Pause className="h-3 w-3" />
            )}
          </button>
        </div>
      </div>
    </div>
  )
}
