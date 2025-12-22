/**
 * KpiCard - Enhanced KPI card with trend indicator and drill-down support.
 */

import { useMemo } from 'react'
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

interface KpiCardProps {
  id: KpiId
  label: string
  value: string
  subtitle?: string
  trend?: 'up' | 'down' | 'flat'
  trendValue?: string
  onClick?: () => void
  highlighted?: boolean
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

const KPI_LABELS: Record<KpiId, string> = {
  activeWip: 'Active WIP',
  lateOrders: 'Late Orders',
  capacityUtil: 'Capacity',
  totalValue: 'Total Value',
  avgOrderValue: 'Avg Order',
  topCustomer: 'Top Customer',
  avgLeadTime: 'Lead Time',
  throughput: 'Throughput',
  onTimeRate: 'On-Time Rate',
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
    <Card
      className={cn(
        'relative overflow-hidden border border-white/10 bg-gradient-to-br from-card/80 via-card/50 to-card/90 transition-all duration-200',
        onClick &&
          'cursor-pointer hover:border-primary/50 hover:shadow-lg hover:scale-[1.02]',
        highlighted && 'ring-2 ring-primary/50'
      )}
      onClick={onClick}
    >
      <CardContent className="p-5">
        <div className="flex items-start justify-between">
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-xs uppercase tracking-widest text-muted-foreground">
              <Icon className="h-3.5 w-3.5" />
              {displayLabel}
            </div>
            <div className="text-3xl font-bold tracking-tight text-foreground">
              {value}
            </div>
            {subtitle && (
              <div className="text-xs text-muted-foreground">{subtitle}</div>
            )}
          </div>

          {trend && (
            <div className={cn('flex items-center gap-1', trendColor)}>
              <TrendIcon className="h-4 w-4" />
              {trendValue && (
                <span className="text-xs font-medium">{trendValue}</span>
              )}
            </div>
          )}
        </div>
      </CardContent>

      {/* Subtle gradient accent based on KPI type */}
      <div
        className={cn(
          'absolute inset-x-0 bottom-0 h-1 opacity-60',
          id === 'lateOrders' && 'bg-gradient-to-r from-rose-500 to-orange-500',
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
      />
    </Card>
  )
}

export { KPI_LABELS }
