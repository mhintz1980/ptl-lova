import React, { useMemo, useState } from 'react'
import { ResponsiveContainer, Treemap, Tooltip } from 'recharts'
import { motion, AnimatePresence } from 'motion/react'
import { ChartProps } from '../dashboardConfig'
import { useApp } from '../../../store'
import { applyDashboardFilters } from '../utils'
import { Pump } from '../../../types'
import { Badge } from '../../ui/Badge'

// --- Types ---
type ViewMode = 'stage' | 'customer' | 'model' | 'value'
type TimeFilter = 'all' | 'week' | 'quarter' | 'year'

const VIEW_MODE_LABELS: Record<ViewMode, string> = {
  stage: 'Stage',
  customer: 'Cust.',
  model: 'Model',
  value: 'Value',
}

const COLORS = [
  '#06b6d4', // cyan
  '#3b82f6', // blue
  '#8b5cf6', // violet
  '#d946ef', // magenta
  '#f97316', // orange
  '#f59e0b', // amber
  '#10b981', // green
  '#ec4899', // pink
]

// Helper to truncate text to fit within a given width
const truncateText = (text: string, maxChars: number): string => {
  if (text.length <= maxChars) return text
  return text.slice(0, maxChars - 1) + '…'
}

// Custom Content with smart text orientation
interface TreemapContentProps {
  x: number
  y: number
  width: number
  height: number
  index: number
  name: string
  value: number
  count?: number
  colors: string[]
  onClick: (node: { name: string; value: number; count: number }) => void
}

const AnimatedTreemapContent = (props: TreemapContentProps) => {
  const { x, y, width, height, index, name, value, colors, onClick } = props

  if (!width || !height) return null

  // Calculate if we should show text, and in what orientation
  const minSizeForText = 30
  const canShowText = width >= minSizeForText && height >= minSizeForText

  // Determine if text should be vertical (when cell is taller than wide)
  const isVertical = height > width * 1.5

  // Calculate available space for text
  const availableSpace = isVertical ? height - 20 : width - 10
  const fontSize = 10 // Match donut legend: text-[10px]
  const valueFontSize = 9 // Match donut legend sublabel: text-[9px]
  const charsPerPixel = 0.14 // Adjusted for 10px font
  const maxChars = Math.floor(availableSpace * charsPerPixel)

  const displayName = truncateText(name, Math.max(3, maxChars))

  // For value text
  const canShowValue = isVertical ? height > 80 : width > 60 && height > 50
  const formattedValue = new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0,
  }).format(value)

  return (
    <g>
      <motion.rect
        x={x}
        y={y}
        width={width}
        height={height}
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        whileHover={{
          scale: 0.98,
          opacity: 0.9,
          transition: { duration: 0.2 },
        }}
        style={{
          fill: colors[index % colors.length],
          stroke: 'rgba(255,255,255,0.1)',
          strokeWidth: 2,
          cursor: 'pointer',
          transformBox: 'fill-box',
          transformOrigin: 'center',
        }}
        onClick={() =>
          onClick({ name, value, count: (props as any).count ?? 1 })
        }
      />
      {canShowText && (
        <text
          x={x + width / 2}
          y={y + height / 2 - (canShowValue ? 8 : 0)}
          textAnchor="middle"
          dominantBaseline="middle"
          fill="#fff"
          fontSize={fontSize}
          fontWeight="normal"
          style={{
            pointerEvents: 'none',
            textShadow: '0 1px 2px rgba(0,0,0,0.5)',
          }}
          transform={
            isVertical
              ? `rotate(-90, ${x + width / 2}, ${
                  y + height / 2 - (canShowValue ? 8 : 0)
                })`
              : undefined
          }
        >
          {displayName}
        </text>
      )}
      {canShowValue && (
        <text
          x={x + width / 2}
          y={y + height / 2 + (isVertical ? 20 : 10)}
          textAnchor="middle"
          dominantBaseline="middle"
          fill="rgba(255,255,255,0.7)"
          fontSize={valueFontSize}
          fontWeight="normal"
          style={{
            pointerEvents: 'none',
            textShadow: '0 1px 2px rgba(0,0,0,0.5)',
          }}
          transform={
            isVertical
              ? `rotate(-90, ${x + width / 2}, ${y + height / 2 + 20})`
              : undefined
          }
        >
          {formattedValue}
        </text>
      )}
    </g>
  )
}

interface CustomTooltipProps {
  active?: boolean
  payload?: Array<{ payload: { name: string; value: number; count: number } }>
}

const CustomTooltip = (props: CustomTooltipProps) => {
  const { active, payload: tooltipPayload } = props
  if (active && tooltipPayload && tooltipPayload.length) {
    const data = tooltipPayload[0].payload as {
      name: string
      value: number
      count: number
    }
    return (
      <div className="bg-popover border border-border p-3 rounded-xl shadow-xl backdrop-blur-md">
        <p className="font-medium text-base">{data.name}</p>
        <div className="mt-1 space-y-0.5">
          <p className="text-sm text-cyan-400 font-mono">
            Value:{' '}
            {new Intl.NumberFormat('en-US', {
              style: 'currency',
              currency: 'USD',
            }).format(data.value)}
          </p>
          <p className="text-xs text-muted-foreground">
            Count: {data.count} pumps
          </p>
        </div>
      </div>
    )
  }
  return null
}

export const TreemapChart: React.FC<ChartProps> = ({
  filters,
  onDrilldown,
}) => {
  const { pumps } = useApp()
  const [viewMode, setViewMode] = useState<ViewMode>('stage')
  const [timeFilter, setTimeFilter] = useState<TimeFilter>('all')

  // 1. Filter Logic
  const filteredPumps = useMemo(() => {
    const baseFiltered = applyDashboardFilters(pumps, filters)

    const now = new Date()
    const startOfWeek = new Date(now)
    startOfWeek.setDate(now.getDate() - now.getDay())
    const startOfQuarter = new Date(
      now.getFullYear(),
      Math.floor(now.getMonth() / 3) * 3,
      1
    )
    const startOfYear = new Date(now.getFullYear(), 0, 1)

    return baseFiltered.filter((p: Pump) => {
      if (!p.promiseDate) return true
      const d = new Date(p.promiseDate)

      if (timeFilter === 'week') return d >= startOfWeek
      if (timeFilter === 'quarter') return d >= startOfQuarter
      if (timeFilter === 'year') return d >= startOfYear
      return true
    })
  }, [pumps, filters, timeFilter])

  // 2. Group Logic
  const data = useMemo(() => {
    const groups: Record<string, { value: number; count: number }> = {}

    if (viewMode === 'value') {
      // Value mode: show individual pumps by value
      return filteredPumps
        .filter((p: Pump) => p.value > 0)
        .map((p: Pump) => ({
          name: `${p.po} - ${p.model}`,
          value: p.value,
          count: 1,
        }))
        .sort((a, b) => b.value - a.value)
        .slice(0, 20)
    }

    filteredPumps.forEach((p: Pump) => {
      let key: string
      if (viewMode === 'stage') {
        key = p.stage.replace(/_/g, ' ')
      } else if (viewMode === 'customer') {
        key = p.customer
      } else {
        key = p.model
      }
      const val = (p as any).value || 0

      if (!groups[key]) groups[key] = { value: 0, count: 0 }
      groups[key].value += val
      groups[key].count += 1
    })

    return Object.entries(groups)
      .map(([name, stats]) => ({
        name,
        value: stats.value,
        count: stats.count,
      }))
      .sort((a, b) => b.value - a.value)
  }, [filteredPumps, viewMode])

  const totalValue = data.reduce((acc, d) => acc + d.value, 0)

  const handleNodeClick = (node: {
    name: string
    value: number
    count: number
  }) => {
    const update: Partial<Record<string, string>> = {}
    if (viewMode === 'stage') update.stage = node.name.replace(/ /g, '_')
    else if (viewMode === 'customer') update.customerId = node.name
    else if (viewMode === 'model') update.modelId = node.name
    // Value mode doesn't drill down further
    if (Object.keys(update).length > 0) onDrilldown(update)
  }

  return (
    <div className="flex flex-col h-full w-full overflow-hidden">
      {/* Controls Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 mb-2 flex-shrink-0">
        {/* Left: View Switcher */}
        <div className="flex bg-muted/30 p-1 rounded-lg">
          {(['stage', 'customer', 'model', 'value'] as const).map((m) => (
            <button
              key={m}
              onClick={() => setViewMode(m)}
              className={`px-3 py-1 text-xs font-medium rounded-md transition-all ${
                viewMode === m
                  ? 'bg-background text-foreground shadow-sm'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              {VIEW_MODE_LABELS[m]}
            </button>
          ))}
        </div>

        {/* Right: Time Filters + Total Value */}
        <div className="flex items-center gap-3">
          {/* Time Filters */}
          <div className="flex gap-1">
            {(['all', 'year', 'quarter', 'week'] as const).map((t) => (
              <Badge
                key={t}
                variant={timeFilter === t ? 'default' : 'outline'}
                className="cursor-pointer hover:bg-primary/20 transition-colors"
                onClick={() => setTimeFilter(t)}
              >
                {t === 'all'
                  ? 'All Time'
                  : `This ${t.charAt(0).toUpperCase() + t.slice(1)}`}
              </Badge>
            ))}
          </div>

          {/* Total Value */}
          <div className="text-right pl-3 border-l border-border/50">
            <p className="text-xs text-muted-foreground">Total Value</p>
            <p className="text-sm font-medium text-cyan-400">
              {new Intl.NumberFormat('en-US', {
                style: 'currency',
                currency: 'USD',
                maximumFractionDigits: 0,
              }).format(totalValue)}
            </p>
          </div>
        </div>
      </div>

      {/* Chart container - fills remaining space */}
      <div className="relative flex-1 min-h-0">
        <AnimatePresence mode="wait">
          <motion.div
            key={`${viewMode}-${timeFilter}`}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="w-full h-full"
          >
            <ResponsiveContainer width="100%" height="100%">
              <Treemap
                data={data}
                dataKey="value"
                aspectRatio={16 / 9}
                stroke="#fff"
                fill="#8884d8"
                content={
                  <AnimatedTreemapContent
                    x={0}
                    y={0}
                    width={0}
                    height={0}
                    index={0}
                    name=""
                    value={0}
                    colors={COLORS}
                    onClick={handleNodeClick}
                  />
                }
              >
                <Tooltip content={<CustomTooltip />} />
              </Treemap>
            </ResponsiveContainer>
          </motion.div>
        </AnimatePresence>

        {data.length === 0 && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <p className="text-muted-foreground">No data for selected period</p>
          </div>
        )}
      </div>
    </div>
  )
}
