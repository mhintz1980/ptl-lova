// src/pages/Dashboard.tsx
import React from "react";
import { Pump } from "../types";
import { DashboardEngine } from "../components/dashboard/DashboardEngine";

interface DashboardProps {
  pumps: Pump[];
  onSelectPump: (pump: Pump) => void;
}

export const Dashboard: React.FC<DashboardProps> = ({
  pumps,
  onSelectPump,
}) => {
  // DashboardEngine handles its own state and data connection.
  // We might want to pass onSelectPump if we want charts to be able to select a pump?
  // For now, the engine focuses on aggregated views.
  // If we need the table, we should add it as a "chart" or a separate section in the engine.

  // The original dashboard had KpiStrip, Charts, and PumpTable.
  // The Engine covers Charts.
  // KpiStrip and PumpTable should probably be integrated into the Engine or kept alongside.
  // The plan said "Refactor Dashboard to 'Dashboard Engine' Architecture".
  // It didn't explicitly say to remove the Table.
  // But the Engine is "a library of charts + topics".
  // I'll render the Engine.
  // I should probably add the Table as a component in the Engine or render it below.
  // Let's render it below for now to preserve functionality.

  // Wait, the Engine has its own layout.
  // If I put the table below, it might look disconnected.
  // But for now, let's just render the Engine.
  // I'll add the PumpTable back if requested or if I can fit it in.
  // Actually, the user said "Implement the 'categories' concept...".
  // I'll keep the PumpTable below the engine for now so the user doesn't lose it.

  // Also KpiStrip. The plan said "KpiStrip (Maybe treat as a special chart or keep separate?)".
  // I'll keep it separate above the engine for now, or let the engine handle it if I added it to registry.
  // I didn't add KpiStrip to registry.
  // So I'll render:
  // <KpiStrip />
  // <DashboardEngine />
  // <PumpTable />

  // But DashboardEngine has its own header and topic switching.
  // Maybe KpiStrip should be part of the "Production" topic?
  // For now, I'll place it above.

  // Re-import components needed for the "legacy" parts I'm keeping outside the engine
  // actually, I'll just import them.

  return (
    <div className="space-y-6" data-testid="dashboard-view">
      {/* We can keep the KPI strip at the top as a global summary */}
      {/* Or we can move it into the engine. Let's keep it here for now. */}
      {/* Actually, let's import it. */}
      <GlobalKpiWrapper pumps={pumps} />

      <DashboardEngine />

      {/* Table is useful, let's keep it */}
      <PumpTableWrapper pumps={pumps} onSelectPump={onSelectPump} />
    </div>
  );
};

// Wrappers to lazy load or just keep imports clean
import { KpiStrip } from "../components/dashboard/KpiStrip";
import { PumpTable } from "../components/dashboard/PumpTable";


const GlobalKpiWrapper = ({ pumps }: { pumps: Pump[] }) => {
  return <KpiStrip pumps={pumps} />;
}

const PumpTableWrapper = ({ pumps, onSelectPump }: { pumps: Pump[], onSelectPump: (p: Pump) => void }) => {
  return <PumpTable pumps={pumps} onSelectPump={onSelectPump} />;
}
