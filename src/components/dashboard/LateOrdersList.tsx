import { useMemo } from 'react'
import { motion, AnimatePresence } from 'motion/react'
import { ChartProps } from './dashboardConfig'
import { useApp } from '../../store'
import { Badge } from '../ui/Badge'
import { differenceInCalendarDays, parseISO, isAfter } from 'date-fns'
import { AlertCircle, CheckCircle } from 'lucide-react'
import { formatDate } from '../../lib/format'

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
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="w-full h-full flex flex-col items-center justify-center text-muted-foreground"
      >
        <motion.div
          className="w-12 h-12 rounded-full bg-green-500/10 flex items-center justify-center mb-2"
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: 'spring', stiffness: 200, delay: 0.2 }}
        >
          <CheckCircle className="text-green-500 w-6 h-6" />
        </motion.div>
        <motion.p
          className="text-sm"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
        >
          All orders on time
        </motion.p>
      </motion.div>
    )
  }

  return (
    <div className="w-full h-full overflow-y-auto pr-1 custom-scrollbar">
      <div className="space-y-1">
        <AnimatePresence>
          {latePumps.map((pump, idx) => (
            <motion.div
              key={pump.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              transition={{ delay: idx * 0.05, duration: 0.3 }}
              whileHover={{
                scale: 1.02,
                backgroundColor: 'rgba(255,255,255,0.05)',
                transition: { duration: 0.15 },
              }}
              className="p-2 rounded-lg border border-border/50 bg-secondary/10 cursor-pointer group flex items-start justify-between gap-2"
              onClick={() =>
                onDrilldown && onDrilldown({ customerId: pump.customer })
              }
            >
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5 mb-0.5">
                  <span className="font-semibold text-xs text-foreground truncate">
                    {pump.po}
                  </span>
                  <Badge variant="outline" className="text-[9px] h-3.5 px-1">
                    {pump.model}
                  </Badge>
                </div>
                <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground">
                  <span className="font-medium text-cyan-400">
                    {pump.customer}
                  </span>
                  <span>•</span>
                  <span>{pump.stage}</span>
                </div>
              </div>

              <motion.div
                className="flex flex-col items-end shrink-0"
                initial={{ scale: 0.8 }}
                animate={{ scale: 1 }}
                transition={{ delay: idx * 0.05 + 0.2, type: 'spring' }}
              >
                <div className="flex items-center gap-1 text-red-500 font-bold text-xs bg-red-500/10 px-2 py-1 rounded">
                  <motion.div
                    animate={{ rotate: [0, -10, 10, 0] }}
                    transition={{
                      repeat: Infinity,
                      duration: 2,
                      delay: idx * 0.1,
                    }}
                  >
                    <AlertCircle className="w-3 h-3" />
                  </motion.div>
                  <span>{pump.daysLate}d Late</span>
                </div>
                <span className="text-[10px] text-muted-foreground mt-1">
                  Due {formatDate(pump.promiseDate)}
                </span>
              </motion.div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </div>
  )
}
