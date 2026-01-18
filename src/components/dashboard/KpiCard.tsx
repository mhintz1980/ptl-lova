/**
 * KpiCard - Enhanced KPI card with trend indicator, drill-down support, and Motion animations.
 */

import { useMemo } from 'react'
import { motion } from 'motion/react'
import { Card, CardContent } from '../ui/Card'
import { cn } from '../../lib/utils'
import {
  TrendingUp,
  TrendingDown,
  Minus,
  Activity,
  DollarSign,
  Clock,
  Package,
  Users,
  Gauge,
  CheckCircle,
  AlertTriangle,
} from 'lucide-react'
import type { KpiId } from './dashboardConfig'
import { KPI_LABELS } from './dashboardConfig'

interface KpiCardProps {
  id: KpiId
  label: string
  value: string
  subtitle?: string
  trend?: 'up' | 'down' | 'flat'
  trendValue?: string
  onClick?: () => void
  highlighted?: boolean
  index?: number // For staggered animation
}

const KPI_ICONS: Record<KpiId, React.ElementType> = {
  activeWip: Activity,
  lateOrders: AlertTriangle,
  capacityUtil: Gauge,
  totalValue: DollarSign,
  avgOrderValue: DollarSign,
  topCustomer: Users,
  avgLeadTime: Clock,
  throughput: Package,
  onTimeRate: CheckCircle,
}

export function KpiCard({
  id,
  label,
  value,
  subtitle,
  trend,
  trendValue,
  onClick,
  highlighted = false,
  index = 0,
}: KpiCardProps) {
  const Icon = KPI_ICONS[id] || Activity
  const displayLabel = label || KPI_LABELS[id] || id

  const TrendIcon = useMemo(() => {
    switch (trend) {
      case 'up':
        return TrendingUp
      case 'down':
        return TrendingDown
      default:
        return Minus
    }
  }, [trend])

  const trendColor = useMemo(() => {
    // For most KPIs, up is good. For lateOrders, down is good.
    const upIsGood = id !== 'lateOrders'
    if (trend === 'up') {
      return upIsGood ? 'text-emerald-500' : 'text-rose-500'
    }
    if (trend === 'down') {
      return upIsGood ? 'text-rose-500' : 'text-emerald-500'
    }
    return 'text-muted-foreground'
  }, [trend, id])

  return (
    <motion.div
      initial={{ opacity: 0, y: 20, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{
        duration: 0.4,
        delay: index * 0.1,
        ease: 'easeOut',
      }}
      whileHover={{
        scale: onClick ? 1.03 : 1,
        rotateX: onClick ? 2 : 0,
        y: onClick ? -2 : 0,
      }}
      style={{ perspective: '1000px' }}
    >
      <Card
        className={cn(
          'relative overflow-hidden border border-white/10 bg-gradient-to-br from-card/80 via-card/50 to-card/90 transition-all duration-200',
          onClick && 'cursor-pointer hover:border-primary/50 hover:shadow-lg',
          highlighted && 'ring-2 ring-primary/50'
        )}
        onClick={onClick}
      >
        <CardContent className="p-4">
          <div className="flex items-start justify-between">
            <div className="space-y-1">
              <motion.div
                className="flex items-center gap-2 text-xs uppercase tracking-widest text-muted-foreground"
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.1 + 0.2 }}
              >
                <Icon className="h-3.5 w-3.5" />
                {displayLabel}
              </motion.div>
              <motion.div
                className="text-3xl font-bold tracking-tight text-foreground"
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{
                  delay: index * 0.1 + 0.3,
                  type: 'spring',
                  stiffness: 200,
                }}
              >
                {value}
              </motion.div>
              {subtitle && (
                <motion.div
                  className="text-xs text-muted-foreground"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: index * 0.1 + 0.4 }}
                >
                  {subtitle}
                </motion.div>
              )}
            </div>

            {trend && (
              <motion.div
                className={cn('flex items-center gap-1', trendColor)}
                initial={{ opacity: 0, scale: 0 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: index * 0.1 + 0.3, type: 'spring' }}
              >
                <TrendIcon className="h-4 w-4" />
                {trendValue && (
                  <span className="text-xs font-medium">{trendValue}</span>
                )}
              </motion.div>
            )}
          </div>
        </CardContent>

        {/* Subtle gradient accent based on KPI type */}
        <motion.div
          className={cn(
            'absolute inset-x-0 bottom-0 h-1 opacity-60',
            id === 'lateOrders' &&
              'bg-gradient-to-r from-rose-500 to-orange-500',
            id === 'totalValue' &&
              'bg-gradient-to-r from-emerald-500 to-teal-500',
            id === 'activeWip' && 'bg-gradient-to-r from-blue-500 to-cyan-500',
            id === 'onTimeRate' &&
              'bg-gradient-to-r from-emerald-500 to-green-500',
            id === 'throughput' &&
              'bg-gradient-to-r from-violet-500 to-purple-500',
            ![
              'lateOrders',
              'totalValue',
              'activeWip',
              'onTimeRate',
              'throughput',
            ].includes(id) && 'bg-gradient-to-r from-primary/50 to-primary/30'
          )}
          initial={{ scaleX: 0 }}
          animate={{ scaleX: 1 }}
          transition={{ delay: index * 0.1 + 0.4, duration: 0.5 }}
          style={{ transformOrigin: 'left' }}
        />

        {/* Shimmer effect overlay */}
        <motion.div
          className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent pointer-events-none"
          initial={{ x: '-100%' }}
          animate={{ x: '100%' }}
          transition={{
            delay: index * 0.1 + 0.5,
            duration: 0.8,
            ease: 'easeInOut',
          }}
        />
      </Card>
    </motion.div>
  )
}
