import { useMemo } from 'react'
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from 'recharts'
import { ChartProps } from '../dashboardConfig'
import { useApp } from '../../../store'
import { formatCurrency } from '../../../lib/utils'
import { Card, CardContent, CardHeader, CardTitle } from '../../ui/Card'
import { Pump } from '../../../types'

// Neon palette for cycling
const COLORS = [
  '#06b6d4', // Cyan
  '#d946ef', // Magenta
  '#f97316', // Orange
  '#22c55e', // Green
  '#3b82f6', // Blue
  '#eab308', // Yellow
  '#ec4899', // Pink
  '#8b5cf6', // Violet
]

const getPumpColor = (po: string) => {
  let hash = 0
  for (let i = 0; i < po.length; i++) {
    hash = po.charCodeAt(i) + ((hash << 5) - hash)
  }
  const index = Math.abs(hash) % COLORS.length
  return COLORS[index]
}

export function TotalValueTrendChart({ filters }: ChartProps) {
  const { pumps } = useApp()

  // Prepare data: Stacked Bars by Pump
  // Optimization: Use "Slotting" to avoid creating 1000 <Bar> components for unique pumps.
  // We determine the max number of pumps in any single week (e.g., 10), creates 10 <Bar>s.
  const { chartData, maxSlots } = useMemo(() => {
    const weeksMap: Record<string, Pump[]> = {}

    // 1. Initialize last 12 weeks
    for (let i = 11; i >= 0; i--) {
      const d = new Date()
      d.setDate(d.getDate() - i * 7)
      const k = `W${getWeekNum(d)}`
      weeksMap[k] = []
    }

    // 2. Bucket pumps
    pumps.forEach((p) => {
      // Logic: Use promiseDate for timeline projection
      if (!p.promiseDate || p.stage === 'CLOSED' || p.stage === 'QUEUE') return // Filter check?
      // Wait, user just said "value trend".
      // Usually "Trend" implies history or future.
      // If we track "Active Value Trend", maybe we assume promiseDate is the target week.

      const d = new Date(p.promiseDate)
      const k = `W${getWeekNum(d)}`

      // Filter by dashboard filters (Customer/Model) if needed?
      // The wrapper usually handles filters, but `filters` prop is passed here.
      // Assuming 'pumps' from useApp is raw, we should strictly respect passed-in filtered pumps?
      // Actually, DashboardEngine passes *filtered* pumps?
      // No, DashboardEngine passes filters object, component grabs global pumps.
      // We must apply filters manually!
      // CHECK: Previous impl didn't apply filters inside useMemo explicitly?
      // Wait, `TrendAreaChartWrapper` did.
      // `TotalValueTrendChart` is used directly in `dashboardConfig.ts`.
      // Previous code: `const { pumps } = useApp()`.
      // It ignored `filters` in `useMemo` but passed them to `TrendAreaChart`?
      // Ah, `TrendAreaChart` uses `dashboardConfig` props but maybe doesn't filter data?
      // We should filter here.

      if (filters.customerId && p.customer !== filters.customerId) return
      if (filters.modelId && p.model !== filters.modelId) return

      if (weeksMap[k]) {
        weeksMap[k].push(p)
      }
    })

    // 3. Flatten to Slots
    let maxStackHeight = 0
    const data = Object.entries(weeksMap).map(([weekLabel, bucketPumps]) => {
      // Sort pumps by value (largest at bottom usually, or top)
      bucketPumps.sort((a, b) => (b.value || 0) - (a.value || 0))

      const row: any = { name: weekLabel }

      bucketPumps.forEach((p, idx) => {
        const val = p.value || 0
        row[`slot_${idx}`] = val
        row[`slot_${idx}_meta`] = p
      })

      if (bucketPumps.length > maxStackHeight)
        maxStackHeight = bucketPumps.length
      return row
    })

    return { chartData: data, maxSlots: maxStackHeight }
  }, [pumps, filters])

  return (
    <Card className="h-full border-none shadow-none bg-transparent">
      <CardHeader className="px-0 pt-0 pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground flex justify-between">
          <span>Projected Value by Week</span>
          <span className="text-xs font-normal opacity-70">
            Breakdown by Pump
          </span>
        </CardTitle>
      </CardHeader>
      <CardContent className="h-[200px] w-full px-0 pb-0">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={chartData}
            margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
          >
            <CartesianGrid
              strokeDasharray="3 3"
              vertical={false}
              stroke="rgba(255,255,255,0.1)"
            />
            <XAxis
              dataKey="name"
              tick={{ fontSize: 10, fill: '#9ca3af' }}
              axisLine={false}
              tickLine={false}
              dy={5}
            />
            <YAxis
              tick={{ fontSize: 10, fill: '#9ca3af' }}
              axisLine={false}
              tickLine={false}
              tickFormatter={(v) => `$${v / 1000}k`}
            />
            <Tooltip
              content={<CustomTooltip />}
              cursor={{ fill: 'rgba(255,255,255,0.05)' }}
            />

            {/* Dynamically generate Bars for slots */}
            {Array.from({ length: maxSlots }).map((_, idx) => (
              <Bar
                key={`slot_${idx}`}
                dataKey={`slot_${idx}`}
                stackId="a"
                maxBarSize={50}
              >
                {chartData.map((entry, index) => {
                  const pump = entry[`slot_${idx}_meta`] as Pump | undefined
                  return (
                    <Cell
                      key={`cell-${index}`}
                      fill={pump ? getPumpColor(pump.po) : 'transparent'}
                      stroke="rgba(0,0,0,0.2)"
                    />
                  )
                })}
              </Bar>
            ))}
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  )
}

function CustomTooltip({ active, payload, label }: any) {
  if (active && payload && payload.length) {
    // Payload contains all slots. We only want the ones active or hovered?
    // The default behavior for stacked bar tooltip is to show EVERYTHING in the stack.
    // This might be too much.
    // User said "represent which pumps".
    // Let's show the content sorted by value, referencing the `payload[i].payload.slot_X_meta`

    // Wait, standard tooltip payload is array of all bars for that category.
    // We can iterate and render valid ones.

    // Extract valid items
    const items = payload
      .map((p: any) => {
        const key = p.dataKey
        const metaKey = `${key}_meta`
        return p.payload[metaKey]
      })
      .filter(Boolean) as Pump[]

    const total = items.reduce(
      (sum: number, p: Pump) => sum + (p.value || 0),
      0
    )

    return (
      <div className="bg-popover/95 border border-border rounded-lg shadow-xl p-3 backdrop-blur-md max-h-[300px] overflow-y-auto custom-scrollbar w-64">
        <p className="font-bold text-foreground mb-2 pb-2 border-b border-white/10 flex justify-between">
          <span>Week {label}</span>
          <span>{formatCurrency(total)}</span>
        </p>
        <div className="space-y-1.5">
          {items.map((pump: Pump) => (
            <div
              key={pump.id}
              className="flex justify-between items-center text-xs"
            >
              <div className="flex items-center gap-2 overflow-hidden">
                <div
                  className="w-2 h-2 rounded-full shrink-0"
                  style={{ backgroundColor: getPumpColor(pump.po) }}
                />
                <div className="truncate flex flex-col">
                  <span className="text-foreground font-medium">{pump.po}</span>
                  <span className="text-muted-foreground text-[10px]">
                    {pump.customer}
                  </span>
                </div>
              </div>
              <span className="font-mono text-cyan-400 ml-2">
                {formatCurrency(pump.value || 0)}
              </span>
            </div>
          ))}
        </div>
      </div>
    )
  }
  return null
}

function getWeekNum(d: Date) {
  const date = new Date(d.getTime())
  date.setHours(0, 0, 0, 0)
  date.setDate(date.getDate() + 3 - ((date.getDay() + 6) % 7))
  const week1 = new Date(date.getFullYear(), 0, 4)
  return (
    1 +
    Math.round(
      ((date.getTime() - week1.getTime()) / 86400000 -
        3 +
        ((week1.getDay() + 6) % 7)) /
        7
    )
  )
}
