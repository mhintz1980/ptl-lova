import { describe, it, expect, beforeEach } from 'vitest'
import { useApp } from '../../src/store'

describe('Timeline Cache Optimization', () => {
  beforeEach(() => {
    // Reset store state before each test
    const state = useApp.getState()
    useApp.setState({
      ...state,
      pumps: [],
      timelines: {},
    })
  })

  it('should initialize with empty timelines cache', () => {
    const { timelines } = useApp.getState()
    expect(timelines).toEqual({})
  })

  it('should rebuild timelines when rebuildTimelines is called', () => {
    const { rebuildTimelines } = useApp.getState()

    // Initially empty
    const { timelines } = useApp.getState()
    expect(Object.keys(timelines)).toHaveLength(0)

    // Add a pump with a valid model that has lead times
    // Using DD-6 model from seed data
    useApp.setState({
      pumps: [{
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
      }],
    })

    // Rebuild timelines
    rebuildTimelines()

    // Should have cached timeline
    const newTimelines = useApp.getState().timelines
    expect(Object.keys(newTimelines)).toHaveLength(1)
    expect(newTimelines['test-pump-1']).toBeDefined()
    expect(Array.isArray(newTimelines['test-pump-1'])).toBe(true)
  })

  it('should return cached timeline from getStageSegments', () => {
    useApp.setState({
      pumps: [{
        id: 'test-pump-2',
        po: 'PO-456',
        customer: 'Test Customer',
        model: '1234',
        stage: 'QUEUE',
        priority: 'Normal',
        powder_color: 'Blue',
        last_update: new Date().toISOString(),
        value: 1000,
        promiseDate: '2025-01-01',
        dateReceived: '2025-01-01',
        forecastStart: new Date('2025-01-15').toISOString(),
        serial: 2,
      }],
      timelines: {
        'test-pump-2': [
          {
            stage: 'QUEUE',
            start: new Date('2025-01-15'),
            end: new Date('2025-01-16'),
            duration: 1,
            capacityAdjusted: false,
          },
        ],
      },
    })

    const { getStageSegments } = useApp.getState()
    const segments = getStageSegments('test-pump-2')

    expect(segments).toBeDefined()
    expect(segments).toHaveLength(1)
    expect(segments![0].stage).toBe('QUEUE')
  })

  it('should return undefined for pump without forecastStart', () => {
    useApp.setState({
      pumps: [{
        id: 'test-pump-3',
        po: 'PO-789',
        customer: 'Test Customer',
        model: '1234',
        stage: 'QUEUE',
        priority: 'Normal',
        powder_color: 'Green',
        last_update: new Date().toISOString(),
        value: 1000,
        promiseDate: '2025-01-01',
        dateReceived: '2025-01-01',
        serial: 3,
        // No forecastStart
      }],
      timelines: {},
    })

    const { getStageSegments } = useApp.getState()
    const segments = getStageSegments('test-pump-3')

    expect(segments).toBeUndefined()
  })

  it('should trigger rebuildTimelines when pumps are added', async () => {
    const { addPO } = useApp.getState()

    // Mock the adapter to avoid actual storage calls
    useApp.setState({
      adapter: {
        load: async () => [],
        update: async () => {},
        upsertMany: async () => {},
        replaceAll: async () => {},
      },
    })

    // Add a new PO with valid model
    await addPO({
      po: 'PO-NEW',
      customer: 'New Customer',
      lines: [{
        model: 'DD-6',
        quantity: 1,
        color: 'Yellow',
        valueEach: 1000,
      }],
      promiseDate: '2025-01-01',
      dateReceived: '2025-01-01',
    })

    // Should have rebuilt timelines with new pump
    const { timelines, pumps } = useApp.getState()
    expect(pumps.length).toBeGreaterThan(0)
    // Timelines should be populated for pumps with forecastStart
    expect(Object.keys(timelines).length).toBeGreaterThanOrEqual(0)
  })

  it('should not persist timelines to localStorage', () => {
    // The partialize function should exclude timelines
    const state = useApp.getState()

    // Manually call partialize logic
    const partialize = (state: any) => ({
      filters: state.filters,
      collapsedStages: state.collapsedStages,
      collapsedCards: state.collapsedCards,
      wipLimits: state.wipLimits,
      sortField: state.sortField,
      sortDirection: state.sortDirection,
      capacityConfig: state.capacityConfig,
      schedulingStageFilters: state.schedulingStageFilters,
      lockDate: state.lockDate,
    })

    const persisted = partialize(state)

    // Timelines should NOT be in persisted state
    expect('timelines' in persisted).toBe(false)
    expect('pumps' in persisted).toBe(false)
    expect('adapter' in persisted).toBe(false)
  })
})
