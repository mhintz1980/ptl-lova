// src/pages/Dashboard.tsx
import React from "react";
import { Pump } from "../types";
import { KpiStrip } from "../components/dashboard/KpiStrip";
import { WorkloadChart } from "../components/dashboard/WorkloadChart";
import { ValueChart } from "../components/dashboard/ValueChart";
import { CapacityChart } from "../components/dashboard/CapacityChart";
import { PumpTable } from "../components/dashboard/PumpTable";
import { useApp } from "../store";

interface DashboardProps {
  pumps: Pump[];
  onSelectPump: (pump: Pump) => void;
}



export const Dashboard: React.FC<DashboardProps> = ({
  pumps,
  onSelectPump,
}) => {
  const collapsed = useApp((state) => state.collapsedCards);

  return (
    <div className="space-y-6" data-testid="dashboard-view">
      <KpiStrip pumps={pumps} compact={collapsed} />

      {!collapsed && (
        <>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
            <WorkloadChart pumps={pumps} type="customer" />
            <WorkloadChart pumps={pumps} type="model" />
            <ValueChart pumps={pumps} type="customer" />
          </div>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <ValueChart pumps={pumps} type="model" />
            <CapacityChart pumps={pumps} />
          </div>
        </>
      )}

      <PumpTable pumps={pumps} onSelectPump={onSelectPump} />
    </div>
  );
};
