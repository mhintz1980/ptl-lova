import { useMemo } from 'react'
import { ChartProps } from './dashboardConfig'
import { useApp } from '../../store'
import { Badge } from '../ui/Badge'
import { differenceInCalendarDays, parseISO, isAfter } from 'date-fns'
import { AlertCircle } from 'lucide-react'

export function LateOrdersList({ onDrilldown }: ChartProps) {
  const { pumps } = useApp()

  const latePumps = useMemo(() => {
    const now = new Date()
    return pumps
      .filter((p) => {
        if (p.stage === 'CLOSED' || !p.promiseDate) return false
        return isAfter(now, parseISO(p.promiseDate))
      })
      .map((p) => ({
        ...p,
        daysLate: differenceInCalendarDays(now, parseISO(p.promiseDate!)),
      }))
      .sort((a, b) => b.daysLate - a.daysLate) // Most late first
  }, [pumps])

  if (latePumps.length === 0) {
    return (
      <div className="w-full h-full flex flex-col items-center justify-center text-muted-foreground">
        <div className="w-12 h-12 rounded-full bg-green-500/10 flex items-center justify-center mb-2">
          <span className="text-green-500 text-xl">✓</span>
        </div>
        <p className="text-sm">All orders on time</p>
      </div>
    )
  }

  return (
    <div className="w-full h-full overflow-y-auto pr-1 custom-scrollbar">
      <div className="space-y-2">
        {latePumps.map((pump) => (
          <div
            key={pump.id}
            className="p-3 rounded-lg border border-border/50 bg-secondary/10 hover:bg-secondary/20 transition-colors cursor-pointer group flex items-start justify-between gap-3"
            onClick={() =>
              onDrilldown && onDrilldown({ customerId: pump.customer })
            } // Or maybe active filter?
          >
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <span className="font-semibold text-sm text-foreground truncate">
                  {pump.po}
                </span>
                <Badge variant="outline" className="text-[10px] h-4 px-1">
                  {pump.model}
                </Badge>
              </div>
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <span className="font-medium text-cyan-400">
                  {pump.customer}
                </span>
                <span>•</span>
                <span>{pump.stage}</span>
              </div>
            </div>

            <div className="flex flex-col items-end shrink-0">
              <div className="flex items-center gap-1 text-red-500 font-bold text-xs bg-red-500/10 px-2 py-1 rounded">
                <AlertCircle className="w-3 h-3" />
                <span>{pump.daysLate}d Late</span>
              </div>
              <span className="text-[10px] text-muted-foreground mt-1">
                Due {pump.promiseDate}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
