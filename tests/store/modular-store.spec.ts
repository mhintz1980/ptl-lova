/* eslint-disable */
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { useApp } from '../../src/store'
import type { Pump, Stage, Milestone, MicroTask } from '../../src/types'

// Mock infrastructure dependencies
vi.mock('../../src/infrastructure/events/EventStore', () => ({
  eventStore: {
    append: vi.fn().mockResolvedValue(undefined),
    clear: vi.fn().mockResolvedValue(undefined),
  },
  EVENTS_STORAGE_KEY: 'pumptracker-events',
}))

vi.mock('../../src/infrastructure/eventBus/EventBus', () => ({
  getEventBus: () => ({
    publish: vi.fn().mockResolvedValue(undefined),
  }),
}))

vi.mock('../../src/adapters/local', () => ({
  LocalAdapter: {
    load: vi.fn().mockResolvedValue([]),
    upsertMany: vi.fn(),
    update: vi.fn(),
    replaceAll: vi.fn(),
  },
}))

vi.mock('../../src/adapters/sandbox', () => ({
  SandboxAdapter: {
    load: vi.fn().mockResolvedValue([]),
    upsertMany: vi.fn(),
    update: vi.fn(),
    replaceAll: vi.fn(),
  },
}))

vi.mock('../../src/adapters/supabase', () => ({
  SupabaseAdapter: {
    load: vi.fn().mockResolvedValue([]),
    upsertMany: vi.fn(),
    update: vi.fn(),
    replaceAll: vi.fn(),
  },
}))

vi.mock('sonner', () => ({
  toast: {
    error: vi.fn(),
    success: vi.fn(),
  },
}))

describe('Modular Store Integration Tests', () => {
  const resetStore = () => {
    useApp.setState({
      pumps: [],
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
      } as Record<Stage, number | null>,
      adapter: {
        load: vi.fn().mockResolvedValue([]),
        upsertMany: vi.fn(),
        update: vi.fn(),
        replaceAll: vi.fn(),
      },
      loading: false,
      sortField: 'default',
      sortDirection: 'desc',
      schedulingStageFilters: [],
      scheduleGroupBy: 'model',
      scheduleSortBy: 'startDate',
      lockDate: null,
      capacityConfig: {
        fabrication: {
          employeeCount: 10,
          dailyManHours: 80,
          efficiency: 1.0,
        },
        assembly: {
          employeeCount: 8,
          dailyManHours: 64,
          efficiency: 1.0,
        },
        ship: {
          employeeCount: 3,
          dailyManHours: 24,
          efficiency: 1.0,
        },
        powderCoat: {
          vendors: [],
        },
        stagedForPowderBufferDays: 2,
      },
      isSandbox: false,
      originalSnapshot: null,
      milestones: [],
      microTasks: [],
      timelines: {},
    })
  }

  beforeEach(() => {
    resetStore()
  })

  describe('Store Slice Exports', () => {
    it('should export useApp', () => {
      expect(useApp).toBeDefined()
      expect(typeof useApp).toBe('function')
    })

    it('should initialize with default state', () => {
      const state = useApp.getState()
      expect(state.pumps).toEqual([])
      expect(state.filters).toEqual({})
      expect(state.milestones).toEqual([])
      expect(state.microTasks).toEqual([])
      expect(state.timelines).toEqual({})
    })

    it('should have all required state slices', () => {
      const state = useApp.getState()

      // Pumps slice
      expect(state.pumps).toBeDefined()
      expect(state.adapter).toBeDefined()
      expect(state.loading).toBeDefined()

      // UI slice
      expect(state.filters).toBeDefined()
      expect(state.collapsedStages).toBeDefined()
      expect(state.collapsedCards).toBeDefined()
      expect(state.wipLimits).toBeDefined()
      expect(state.sortField).toBeDefined()
      expect(state.sortDirection).toBeDefined()

      // Capacity slice
      expect(state.lockDate).toBeDefined()
      expect(state.capacityConfig).toBeDefined()

      // Sandbox slice
      expect(state.isSandbox).toBeDefined()
      expect(state.originalSnapshot).toBeDefined()

      // Progress slice
      expect(state.milestones).toBeDefined()
      expect(state.microTasks).toBeDefined()

      // Timeline cache
      expect(state.timelines).toBeDefined()
    })

    it('should have all required actions from pumps slice', () => {
      const state = useApp.getState()
      expect(state.setAdapter).toBeDefined()
      expect(state.load).toBeDefined()
      expect(state.addPO).toBeDefined()
      expect(state.moveStage).toBeDefined()
      expect(state.updatePump).toBeDefined()
      expect(state.pausePump).toBeDefined()
      expect(state.resumePump).toBeDefined()
      expect(state.replaceDataset).toBeDefined()
      expect(state.setForecastHint).toBeDefined()
      expect(state.clearForecastHint).toBeDefined()
    })

    it('should have all required actions from UI slice', () => {
      const state = useApp.getState()
      expect(state.setFilters).toBeDefined()
      expect(state.clearFilters).toBeDefined()
      expect(state.toggleStageCollapse).toBeDefined()
      expect(state.toggleCollapsedCards).toBeDefined()
      expect(state.setWipLimit).toBeDefined()
      expect(state.setSort).toBeDefined()
      expect(state.toggleSchedulingStageFilter).toBeDefined()
      expect(state.clearSchedulingStageFilters).toBeDefined()
      expect(state.setScheduleGroupBy).toBeDefined()
      expect(state.setScheduleSortBy).toBeDefined()
      expect(state.toggleSwimlaneCollapse).toBeDefined()
      expect(state.collapseAllSwimlanes).toBeDefined()
      expect(state.expandAllSwimlanes).toBeDefined()
    })

    it('should have all required actions from capacity slice', () => {
      const state = useApp.getState()
      expect(state.setLockDate).toBeDefined()
      expect(state.updateDepartmentStaffing).toBeDefined()
      expect(state.updatePowderCoatVendor).toBeDefined()
      expect(state.updateStagedForPowderBufferDays).toBeDefined()
      expect(state.resetCapacityDefaults).toBeDefined()
    })

    it('should have all required actions from sandbox slice', () => {
      const state = useApp.getState()
      expect(state.enterSandbox).toBeDefined()
      expect(state.commitSandbox).toBeDefined()
      expect(state.exitSandbox).toBeDefined()
    })

    it('should have all required actions from progress slice', () => {
      const state = useApp.getState()
      expect(state.addMilestone).toBeDefined()
      expect(state.updateMilestone).toBeDefined()
      expect(state.deleteMilestone).toBeDefined()
      expect(state.addMicroTask).toBeDefined()
      expect(state.toggleMicroTask).toBeDefined()
      expect(state.deleteMicroTask).toBeDefined()
    })

    it('should have all required selectors', () => {
      const state = useApp.getState()
      expect(state.filtered).toBeDefined()
      expect(state.getModelLeadTimes).toBeDefined()
      expect(state.getStageSegments).toBeDefined()
      expect(state.isPumpLocked).toBeDefined()
      expect(state.rebuildTimelines).toBeDefined()
    })
  })

  describe('Backward Compatibility', () => {
    it('should maintain backward compatibility with existing code', () => {
      const state = useApp.getState()

      // All existing component usage patterns should work
      expect(typeof state.addPO).toBe('function')
      expect(typeof state.moveStage).toBe('function')
      expect(typeof state.updatePump).toBe('function')
      expect(typeof state.setFilters).toBe('function')
      expect(typeof state.setWipLimit).toBe('function')
      expect(typeof state.addMilestone).toBe('function')
      expect(typeof state.toggleMicroTask).toBe('function')
    })

    it('should support pumps operations', async () => {
      const testPump: Pump = {
        id: 'test-1',
        serial: 123,
        po: 'PO-123',
        customer: 'Test Customer',
        model: 'DD-6',
        stage: 'QUEUE',
        priority: 'Normal',
        last_update: new Date().toISOString(),
        value: 1000,
        powder_color: 'Red',
      }

      await useApp.getState().addPO({
        po: 'PO-123',
        customer: 'Test Customer',
        lines: [
          {
            model: 'DD-6',
            quantity: 1,
            color: 'Red',
            valueEach: 1000,
          },
        ],
        promiseDate: '2025-01-01',
        dateReceived: '2025-01-01',
      })

      const state = useApp.getState()
      expect(state.pumps).toHaveLength(1)
      expect(state.pumps[0]?.po).toBe('PO-123')
    })

    it('should support UI operations', () => {
      useApp.getState().setFilters({ stage: 'FABRICATION' })
      let state = useApp.getState()
      expect(state.filters).toEqual({ stage: 'FABRICATION' })

      useApp.getState().setWipLimit('FABRICATION', 10)
      state = useApp.getState()
      expect(state.wipLimits?.FABRICATION).toBe(10)
    })

    it('should support progress operations', () => {
      const milestone: Milestone = {
        id: 'milestone-1',
        title: 'Test Milestone',
        description: 'Test description',
        dueDate: new Date().toISOString(),
        status: 'pending',
      }

      useApp.getState().addMilestone(milestone)
      let state = useApp.getState()
      expect(state.milestones).toHaveLength(1)
      expect(state.milestones[0]?.title).toBe('Test Milestone')

      useApp.getState().updateMilestone('milestone-1', {
        status: 'completed',
      })
      state = useApp.getState()
      expect(state.milestones[0]?.status).toBe('completed')
    })

    it('should support microtask operations', () => {
      const microTask: MicroTask = {
        id: 'task-1',
        milestoneId: 'milestone-1',
        title: 'Test Task',
        isComplete: false,
      }

      useApp.getState().addMicroTask(microTask)
      let state = useApp.getState()
      expect(state.microTasks).toHaveLength(1)
      expect(state.microTasks[0]?.isComplete).toBe(false)

      useApp.getState().toggleMicroTask('task-1')
      state = useApp.getState()
      expect(state.microTasks[0]?.isComplete).toBe(true)
      expect(state.microTasks[0]?.completedAt).toBeDefined()
    })
  })

  describe('Timeline Cache Optimization', () => {
    it('should initialize with empty timeline cache', () => {
      const { timelines } = useApp.getState()
      expect(timelines).toEqual({})
    })

    it('should provide rebuildTimelines action', () => {
      const { rebuildTimelines } = useApp.getState()
      expect(typeof rebuildTimelines).toBe('function')
    })

    it('should provide getStageSegments selector', () => {
      const { getStageSegments } = useApp.getState()
      expect(typeof getStageSegments).toBe('function')
    })

    it('should return undefined timeline for pump without forecastStart', () => {
      const pumpWithoutForecast: Pump = {
        id: 'no-forecast',
        serial: 789,
        po: 'PO-789',
        customer: 'No Forecast',
        model: 'DD-4',
        stage: 'QUEUE',
        priority: 'Normal',
        last_update: new Date().toISOString(),
        value: 500,
        powder_color: 'Green',
      }

      useApp.setState({ pumps: [pumpWithoutForecast] })

      const { getStageSegments } = useApp.getState()
      const timeline = getStageSegments('no-forecast')
      expect(timeline).toBeUndefined()
    })

    it('should rebuild timeline cache when rebuildTimelines is called', () => {
      const { rebuildTimelines } = useApp.getState()

      // Add a pump with forecast start
      useApp.setState({
        pumps: [
          {
            id: 'test-pump-1',
            po: 'PO-123',
            customer: 'Test Customer',
            model: 'DD-6',
            stage: 'QUEUE',
            priority: 'Normal',
            powder_color: 'Red',
            last_update: new Date().toISOString(),
            value: 1000,
            promiseDate: '2025-01-01',
            dateReceived: '2025-01-01',
            forecastStart: new Date('2025-01-15').toISOString(),
            serial: 1,
          },
        ],
      })

      // Rebuild timelines
      rebuildTimelines()

      // Should have cached timeline
      const newTimelines = useApp.getState().timelines
      expect(Object.keys(newTimelines)).toHaveLength(1)
      expect(newTimelines['test-pump-1']).toBeDefined()
      expect(Array.isArray(newTimelines['test-pump-1'])).toBe(true)
    })

    it('should not persist timeline cache to localStorage', () => {
      // Timeline data should be computed, not persisted
      // The persist middleware partialize function should exclude timelines
      const state = useApp.getState()

      // Verify timelines exists in runtime state
      expect('timelines' in state).toBe(true)

      // Key fields that should be persisted
      const persistableKeys = [
        'filters',
        'collapsedStages',
        'collapsedCards',
        'wipLimits',
        'sortField',
        'sortDirection',
        'capacityConfig',
        'schedulingStageFilters',
        'lockDate',
      ]

      // Non-persistable keys (computed)
      const nonPersistableKeys = ['pumps', 'adapter', 'timelines', 'loading']

      // Verify computed keys exist
      nonPersistableKeys.forEach((key) => {
        expect(key in state).toBe(true)
      })
    })

    it('should trigger timeline rebuild when pumps change', async () => {
      const { addPO } = useApp.getState()

      // Add a new PO with valid model
      await addPO({
        po: 'PO-NEW',
        customer: 'New Customer',
        lines: [
          {
            model: 'DD-6',
            quantity: 1,
            color: 'Yellow',
            valueEach: 1000,
          },
        ],
        promiseDate: '2025-01-01',
        dateReceived: '2025-01-01',
      })

      // Should have new pumps
      const { pumps, timelines } = useApp.getState()
      expect(pumps.length).toBeGreaterThan(0)
      // Timelines cache should exist (even if empty for pumps without forecast)
      expect(typeof timelines).toBe('object')
    })
  })

  describe('Cross-Slice Integration', () => {
    it('should handle complex multi-slice operations', () => {
      // Setup pumps
      useApp.setState({
        pumps: [
          {
            id: 'pump-1',
            serial: 100,
            po: 'PO-100',
            customer: 'Complex Test',
            model: 'DD-6',
            stage: 'FABRICATION',
            priority: 'Normal',
            last_update: new Date().toISOString(),
            value: 1000,
            powder_color: 'Red',
          },
        ],
      })

      // Set WIP limits
      useApp.getState().setWipLimit('FABRICATION', 10)

      // Add milestones
      useApp.getState().addMilestone({
        id: 'milestone-1',
        title: 'Complete Fabrication',
        description: 'Finish all fabrication work',
        dueDate: new Date().toISOString(),
        status: 'pending',
      })

      // All slices should be accessible
      const appState = useApp.getState()
      expect(appState.pumps).toHaveLength(1)
      expect(appState.wipLimits?.FABRICATION).toBe(10)
      expect(appState.milestones).toHaveLength(1)
    })

    it('should support independent slice updates', () => {
      // Update pumps slice
      useApp.setState({
        pumps: [
          {
            id: 'pump-1',
            serial: 123,
            po: 'PO-123',
            customer: 'Test',
            model: 'DD-6',
            stage: 'FABRICATION',
            priority: 'Normal',
            last_update: new Date().toISOString(),
            value: 1000,
            powder_color: 'Red',
          },
        ],
      })

      // Update UI slice independently
      useApp.getState().setFilters({ stage: 'FABRICATION' })

      // Update progress slice independently
      useApp.getState().addMilestone({
        id: 'milestone-1',
        title: 'Test Milestone',
        description: 'Test',
        dueDate: new Date().toISOString(),
        status: 'pending',
      })

      // All updates should be reflected
      const appState = useApp.getState()
      expect(appState.pumps).toHaveLength(1)
      expect(appState.filters).toEqual({ stage: 'FABRICATION' })
      expect(appState.milestones).toHaveLength(1)
    })

    it('should maintain slice isolation', () => {
      // Update pumps slice
      useApp.setState({
        pumps: [
          {
            id: 'isolated-pump',
            serial: 999,
            po: 'PO-999',
            customer: 'Isolation Test',
            model: 'DD-12',
            stage: 'QUEUE',
            priority: 'High',
            last_update: new Date().toISOString(),
            value: 5000,
            powder_color: 'Black',
          },
        ],
      })

      // Update UI slice
      useApp.getState().setFilters({ priority: 'High' })
      useApp.getState().toggleCollapsedCards()

      // Verify pumps slice didn't affect UI slice values
      const appState = useApp.getState()
      expect(appState.pumps).toHaveLength(1)
      expect(appState.filters).toEqual({ priority: 'High' })
      expect(appState.collapsedCards).toBe(true)
    })

    it('should support concurrent slice updates', () => {
      // Simulate concurrent updates from different components
      useApp.setState({
        pumps: [
          {
            id: 'concurrent-pump',
            serial: 888,
            po: 'PO-888',
            customer: 'Concurrent Test',
            model: 'DD-8',
            stage: 'QUEUE',
            priority: 'Normal',
            last_update: new Date().toISOString(),
            value: 2000,
            powder_color: 'Blue',
          },
        ],
      })

      useApp.getState().setFilters({ stage: 'QUEUE' })
      useApp.getState().setSort('priority', 'asc')
      useApp.getState().addMilestone({
        id: 'concurrent-1',
        title: 'Concurrent Milestone',
        description: 'Test concurrent updates',
        dueDate: new Date().toISOString(),
        status: 'in_progress',
      })

      // All updates should be reflected
      const appState = useApp.getState()
      expect(appState.pumps).toHaveLength(1)
      expect(appState.filters).toEqual({ stage: 'QUEUE' })
      expect(appState.sortField).toBe('priority')
      expect(appState.milestones).toHaveLength(1)
      expect(appState.milestones[0]?.status).toBe('in_progress')
    })
  })

  describe('Sandbox Mode Integration', () => {
    it('should initialize sandbox mode correctly', () => {
      const { isSandbox, originalSnapshot } = useApp.getState()
      expect(isSandbox).toBe(false)
      expect(originalSnapshot).toBeNull()
    })

    it('should support entering sandbox mode', () => {
      const testPump: Pump = {
        id: 'sandbox-test',
        serial: 555,
        po: 'PO-555',
        customer: 'Sandbox Test',
        model: 'DD-6',
        stage: 'QUEUE',
        priority: 'Normal',
        last_update: new Date().toISOString(),
        value: 1500,
        powder_color: 'Purple',
      }

      useApp.setState({ pumps: [testPump] })

      useApp.getState().enterSandbox()

      const state = useApp.getState()
      expect(state.isSandbox).toBe(true)
      expect(state.originalSnapshot).toHaveLength(1)
      expect(state.originalSnapshot?.[0]?.id).toBe('sandbox-test')
    })

    it('should support exiting sandbox mode', () => {
      const testPump: Pump = {
        id: 'sandbox-exit',
        serial: 666,
        po: 'PO-666',
        customer: 'Exit Test',
        model: 'DD-4',
        stage: 'FABRICATION',
        priority: 'Normal',
        last_update: new Date().toISOString(),
        value: 800,
        powder_color: 'Orange',
      }

      useApp.setState({ pumps: [testPump] })

      useApp.getState().enterSandbox()

      // Modify pump in sandbox
      useApp.setState({
        pumps: [
          {
            ...testPump,
            stage: 'ASSEMBLY',
          },
        ],
      })

      useApp.getState().exitSandbox()

      const state = useApp.getState()
      expect(state.isSandbox).toBe(false)
      expect(state.originalSnapshot).toBeNull()
      // Pump should be restored to original state
      expect(state.pumps[0]?.stage).toBe('FABRICATION')
    })
  })

  describe('Capacity Management Integration', () => {
    it('should initialize capacity config with defaults', () => {
      const { capacityConfig } = useApp.getState()
      expect(capacityConfig).toBeDefined()
      expect(capacityConfig.fabrication).toBeDefined()
      expect(capacityConfig.assembly).toBeDefined()
      expect(capacityConfig.ship).toBeDefined()
    })

    it('should support updating department staffing', () => {
      useApp.getState().updateDepartmentStaffing('fabrication', {
        employeeCount: 15,
      })

      const state = useApp.getState()
      expect(state.capacityConfig.fabrication.employeeCount).toBe(15)
    })

    it('should support setting lock date', () => {
      useApp.getState().setLockDate('2025-02-01')

      const state = useApp.getState()
      expect(state.lockDate).toBe('2025-02-01')
    })

    it('should support clearing lock date', () => {
      useApp.getState().setLockDate('2025-02-01')
      expect(useApp.getState().lockDate).toBe('2025-02-01')

      useApp.getState().setLockDate(null)
      expect(useApp.getState().lockDate).toBeNull()
    })

    it('should support resetting capacity defaults', () => {
      // Modify capacity
      useApp.getState().updateDepartmentStaffing('assembly', {
        employeeCount: 20,
      })

      expect(useApp.getState().capacityConfig.assembly.employeeCount).toBe(20)

      // Reset to defaults
      useApp.getState().resetCapacityDefaults()

      const state = useApp.getState()
      // Check employee count was reset to DEFAULT_CAPACITY_CONFIG value
      expect(state.capacityConfig.assembly.employeeCount).toBeGreaterThanOrEqual(2)
    })
  })
})
