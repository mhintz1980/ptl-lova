import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { Stage } from '../types'
import type { SortField, SortDirection } from '../lib/sort'

export interface UIState {
  // Filters
  filters: Record<string, unknown>

  // Collapse state
  collapsedStages: Record<Stage, boolean>
  collapsedCards: boolean
  collapsedSwimlanes: Record<string, boolean>

  // WIP limits
  wipLimits: Record<Stage, number | null>

  // Sort
  sortField: SortField
  sortDirection: SortDirection

  // Scheduling filters
  schedulingStageFilters: Stage[]

  // Schedule swimlane grouping
  scheduleGroupBy: 'model' | 'customer' | 'po' | 'risk'
  scheduleSortBy: string

  // Actions
  setFilters: (f: Partial<Record<string, unknown>>) => void
  clearFilters: () => void
  toggleStageCollapse: (stage: Stage) => void
  toggleCollapsedCards: () => void
  setWipLimit: (stage: Stage, limit: number | null) => void
  setSort: (field: SortField, direction: SortDirection) => void
  toggleSchedulingStageFilter: (stage: Stage) => void
  clearSchedulingStageFilters: () => void
  setScheduleGroupBy: (groupBy: 'model' | 'customer' | 'po' | 'risk') => void
  setScheduleSortBy: (sortBy: string) => void
  toggleSwimlaneCollapse: (swimlaneId: string) => void
  collapseAllSwimlanes: () => void
  expandAllSwimlanes: () => void
}

export const useUIStore = create<UIState>()(
  persist(
    (set, get) => ({
      // Initial state
      filters: {},
      collapsedStages: {
        QUEUE: false,
        FABRICATION: false,
        STAGED_FOR_POWDER: false,
        POWDER_COAT: false,
        ASSEMBLY: false,
        SHIP: false,
        CLOSED: false,
      } as Record<Stage, boolean>,
      collapsedCards: false,
      collapsedSwimlanes: {},
      wipLimits: {
        QUEUE: null,
        FABRICATION: 8,
        STAGED_FOR_POWDER: null,
        POWDER_COAT: 6,
        ASSEMBLY: 8,
        SHIP: 5,
        CLOSED: null,
      },
      sortField: 'default',
      sortDirection: 'desc',
      schedulingStageFilters: [],
      scheduleGroupBy: 'model',
      scheduleSortBy: 'startDate',

      // Actions
      setFilters: (f) =>
        set((state) => ({
          filters: { ...state.filters, ...f },
        })),

      clearFilters: () => set({ filters: {} }),

      toggleStageCollapse: (stage) =>
        set((state) => ({
          collapsedStages: {
            ...state.collapsedStages,
            [stage]: !state.collapsedStages[stage],
          },
        })),

      toggleCollapsedCards: () =>
        set((state) => ({ collapsedCards: !state.collapsedCards })),

      setWipLimit: (stage, limit) =>
        set((state) => ({
          wipLimits: { ...state.wipLimits, [stage]: limit },
        })),

      setSort: (field, direction) =>
        set({ sortField: field, sortDirection: direction }),

      toggleSchedulingStageFilter: (stage) =>
        set((state) => {
          const current = state.schedulingStageFilters
          const next = current.includes(stage)
            ? current.filter((s) => s !== stage)
            : [...current, stage]
          return { schedulingStageFilters: next }
        }),

      clearSchedulingStageFilters: () =>
        set({ schedulingStageFilters: [] }),

      setScheduleGroupBy: (groupBy) => {
        const defaultSorts: Record<string, string> = {
          model: 'customer',
          customer: 'model',
          po: 'model',
          risk: 'model',
        }
        set({
          scheduleGroupBy: groupBy,
          scheduleSortBy: defaultSorts[groupBy] || 'startDate',
        })
      },

      setScheduleSortBy: (sortBy) => set({ scheduleSortBy: sortBy }),

      toggleSwimlaneCollapse: (swimlaneId) =>
        set((state) => ({
          collapsedSwimlanes: {
            ...state.collapsedSwimlanes,
            [swimlaneId]: !state.collapsedSwimlanes[swimlaneId],
          },
        })),

      collapseAllSwimlanes: () =>
        set((state) => {
          const collapsed: Record<string, boolean> = {}
          Object.keys(state.collapsedSwimlanes).forEach(
            (id) => (collapsed[id] = true)
          )
          return { collapsedSwimlanes: collapsed }
        }),

      expandAllSwimlanes: () => set({ collapsedSwimlanes: {} }),
    }),
    {
      name: 'pumptracker-ui-storage',
    }
  )
)
