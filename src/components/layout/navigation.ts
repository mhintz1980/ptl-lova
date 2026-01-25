import type { ComponentType } from 'react'
import { Activity, BarChart3, Calendar, Layout } from 'lucide-react'

export type AppView = 'dashboard' | 'kanban' | 'scheduling' | 'orders'

export const NAV_ITEMS: Array<{
  id: AppView
  label: string
  icon: ComponentType<{ className?: string; strokeWidth?: number }>
}> = [
  { id: 'dashboard', label: 'Dashboard', icon: BarChart3 },
  { id: 'kanban', label: 'Kanban', icon: Layout },
  { id: 'scheduling', label: 'Scheduling', icon: Calendar },
  { id: 'orders', label: 'Orders', icon: Activity },
]
