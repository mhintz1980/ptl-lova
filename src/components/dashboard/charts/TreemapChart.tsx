import React, { useMemo, useState } from 'react'
import { ResponsiveContainer, Treemap, Tooltip } from 'recharts'
import { motion, AnimatePresence } from 'motion/react'
import { ChartProps } from '../dashboardConfig'
import { useApp } from '../../../store'
import { applyDashboardFilters } from '../utils'
import { Pump } from '../../../types'
import { Badge } from '../../ui/Badge'

// --- Types ---
type ViewMode = 'customer' | 'model'
type TimeFilter = 'all' | 'week' | 'quarter' | 'year'

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

// Custom Content
const AnimatedTreemapContent = (props: any) => {
  const { x, y, width, height, index, name, value, colors, onClick } = props

  if (!width || !height) return null

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
        onClick={() => onClick(props)}
      />
      {width > 60 && height > 30 && (
        <text
          x={x + width / 2}
          y={y + height / 2 - 8}
          textAnchor="middle"
          fill="#fff"
          fontSize={13}
          fontWeight="bold"
          style={{
            pointerEvents: 'none',
            textShadow: '0 1px 2px rgba(0,0,0,0.5)',
          }}
        >
          {name}
        </text>
      )}
      {width > 60 && height > 50 && (
        <text
          x={x + width / 2}
          y={y + height / 2 + 10}
          textAnchor="middle"
          fill="rgba(255,255,255,0.9)"
          fontSize={11}
          style={{
            pointerEvents: 'none',
            textShadow: '0 1px 2px rgba(0,0,0,0.5)',
          }}
        >
          {new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'USD',
            maximumFractionDigits: 0,
          }).format(value)}
        </text>
      )}
    </g>
  )
}

const CustomTooltip = ({ active, payload }: any) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload
    return (
      <div className="bg-popover border border-border p-3 rounded-xl shadow-xl backdrop-blur-md">
        <p className="font-bold text-base">{data.name}</p>
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
  const [viewMode, setViewMode] = useState<ViewMode>('customer')
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
      // Use promiseDate for filtering if available
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

    filteredPumps.forEach((p: Pump) => {
      // Treat CLOSED as valid for "All time value" charts usually, but if "Active Wip" maybe no.
      // Current design: This is "Production Treemap" or "Value". Often implies history or active load.
      // If we filter by 'year', we definitely want CLOSED items in that year.
      // If 'all', maybe active?
      // Let's assume this chart shows EVERYTHING matching filters (including closed) unless filters.stage says otherwise.

      // Removed status check, using implicit stage filter from filteredPumps if set.
      // If no stage filter, it shows all stages.

      const key = viewMode === 'customer' ? p.customer : p.model
      // Assuming p.value is the price.
      const val = (p as any).value || 0

      if (!groups[key]) groups[key] = { value: 0, count: 0 }
      groups[key].value += val
      groups[key].count += 1
    })

    // Transform to array
    return Object.entries(groups)
      .map(([name, stats]) => ({
        name,
        value: stats.value,
        count: stats.count,
      }))
      .sort((a, b) => b.value - a.value)
  }, [filteredPumps, viewMode])

  const totalValue = data.reduce((acc, d) => acc + d.value, 0)

  const handleNodeClick = (node: any) => {
    const update: any = {}
    if (viewMode === 'customer') update.customerId = node.name
    else update.modelId = node.name
    onDrilldown(update)
  }

  return (
    <div className="flex flex-col h-full w-full">
      {/* Controls Header */}
      <div className="flex flex-wrap items-center justify-between mb-4 gap-2">
        {/* View Switcher */}
        <div className="flex bg-muted/30 p-1 rounded-lg">
          {(['customer', 'model'] as const).map((m) => (
            <button
              key={m}
              onClick={() => setViewMode(m)}
              className={`px-3 py-1 text-xs font-medium rounded-md transition-all ${
                viewMode === m
                  ? 'bg-background text-foreground shadow-sm'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              By {m.charAt(0).toUpperCase() + m.slice(1)}
            </button>
          ))}
        </div>

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
      </div>

      {/* Total Indicator in corner */}
      <div className="absolute top-4 right-4 text-right pointer-events-none hidden md:block">
        <p className="text-xs text-muted-foreground">Total Value</p>
        <p className="text-lg font-bold text-cyan-400">
          {new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'USD',
            maximumFractionDigits: 0,
          }).format(totalValue)}
        </p>
      </div>

      {/* Chart */}
      <div className="flex-1 min-h-0">
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
      </div>

      {data.length === 0 && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <p className="text-muted-foreground">No data for selected period</p>
        </div>
      )}
    </div>
  )
}
