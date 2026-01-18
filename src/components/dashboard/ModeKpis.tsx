/**
 * ModeKpis - Mode-aware KPI strip that displays KPIs based on active dashboard mode.
 */

import { useMemo } from 'react'
import type { Pump } from '../../types'
import type { DashboardMode, KpiId, DashboardFilters } from './dashboardConfig'
import { MODE_CONFIGS } from './dashboardConfig'
import { KPI_LABELS } from './dashboardConfig'
import { KpiCard } from './KpiCard'
import { calculateKpi } from './kpiCalculators'

interface ModeKpisProps {
  pumps: Pump[]
  mode: DashboardMode
  onKpiClick?: (kpiId: KpiId, filter: Partial<DashboardFilters>) => void
  compact?: boolean // When true, renders inline for header placement
}

/**
 * Map KPI IDs to their drill-down filter configurations
 */
function getKpiDrilldownFilter(kpiId: KpiId): Partial<DashboardFilters> {
  switch (kpiId) {
    case 'lateOrders':
      // Could add a filter for late orders specifically
      return {}
    case 'activeWip':
      // Filter to show active stages only
      return {}
    default:
      return {}
  }
}

export function ModeKpis({
  pumps,
  mode,
  onKpiClick,
  compact = false,
}: ModeKpisProps) {
  const modeConfig = useMemo(
    () => MODE_CONFIGS.find((m) => m.id === mode) || MODE_CONFIGS[0],
    [mode]
  )

  const kpiValues = useMemo(() => {
    return modeConfig.kpis.map((kpiId) => ({
      id: kpiId,
      ...calculateKpi(kpiId, pumps),
    }))
  }, [modeConfig.kpis, pumps])

  // Compact mode: inline badges for header placement
  if (compact) {
    return (
      <div className="flex items-center gap-2">
        {kpiValues.map((kpi) => {
          const isNegative = kpi.health === 'negative'
          const isPositive = kpi.health === 'positive'
          return (
            <button
              key={kpi.id}
              onClick={
                onKpiClick
                  ? () => onKpiClick(kpi.id, getKpiDrilldownFilter(kpi.id))
                  : undefined
              }
              className={`
                flex items-center gap-2 px-4 py-2 rounded-lg border transition-all duration-300
                ${
                  isNegative
                    ? 'bg-rose-500/10 border-rose-500/40 text-rose-400 animate-glow-slow'
                    : isPositive
                      ? 'bg-emerald-500/10 border-emerald-500/40 text-emerald-400'
                      : 'bg-card/80 border-border/60 hover:bg-card text-muted-foreground hover:text-foreground'
                }
              `}
            >
              <span
                className={`text-xs font-semibold uppercase tracking-wider ${
                  isNegative || isPositive ? 'opacity-90' : 'opacity-70'
                }`}
              >
                {KPI_LABELS[kpi.id]}
              </span>
              <span className="text-sm font-bold tracking-tight">
                {kpi.formatted}
              </span>
            </button>
          )
        })}
      </div>
    )
  }

  // Standard mode: grid of cards
  return (
    <div className="grid gap-4 grid-cols-1 sm:grid-cols-3">
      {kpiValues.map((kpi) => (
        <KpiCard
          key={kpi.id}
          id={kpi.id}
          label={KPI_LABELS[kpi.id]}
          value={kpi.formatted}
          subtitle={kpi.subtitle}
          onClick={
            onKpiClick
              ? () => onKpiClick(kpi.id, getKpiDrilldownFilter(kpi.id))
              : undefined
          }
        />
      ))}
    </div>
  )
}
