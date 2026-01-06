/**
 * ModeKpis - Mode-aware KPI strip that displays KPIs based on active dashboard mode.
 */

import { useMemo } from 'react'
import type { Pump } from '../../types'
import type { DashboardMode, KpiId, DashboardFilters } from './dashboardConfig'
import { MODE_CONFIGS } from './dashboardConfig'
import { KpiCard, KPI_LABELS } from './KpiCard'
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
        {kpiValues.map((kpi) => (
          <button
            key={kpi.id}
            onClick={
              onKpiClick
                ? () => onKpiClick(kpi.id, getKpiDrilldownFilter(kpi.id))
                : undefined
            }
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-card/50 border border-border/40 hover:bg-card/80 transition-colors"
          >
            <span className="text-xs font-medium text-muted-foreground">
              {KPI_LABELS[kpi.id]}
            </span>
            <span className="text-sm font-bold">{kpi.formatted}</span>
          </button>
        ))}
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
