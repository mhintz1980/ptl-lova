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

export function ModeKpis({ pumps, mode, onKpiClick }: ModeKpisProps) {
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
