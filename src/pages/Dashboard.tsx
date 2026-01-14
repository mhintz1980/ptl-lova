// src/pages/Dashboard.tsx
import React from 'react'
import { Pump } from '../types'
import { DashboardEngine } from '../components/dashboard/DashboardEngine'
import { DashboardSkeleton } from '../components/dashboard/DashboardSkeleton'
import { useApp } from '../store'

interface DashboardProps {
  pumps: Pump[]
  onSelectPump: (pump: Pump) => void
}

export const Dashboard: React.FC<DashboardProps> = ({ onSelectPump }) => {
  // DashboardEngine handles data connection from store.
  // We pass onSelectPump so charts/tables can trigger the main app's selection/modal logic.

  const { loading } = useApp()

  if (loading) {
    return <DashboardSkeleton />
  }

  return (
    <div className="space-y-6" data-testid="dashboard-view">
      {/* DashboardEngine now includes Data mode which renders the PumpTable */}
      <DashboardEngine onSelectPump={onSelectPump} />
    </div>
  )
}
