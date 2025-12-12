// src/store.ts
import { create } from "zustand";
import { persist } from "zustand/middleware";
import { Pump, Filters, AddPoPayload, Stage, DataAdapter } from "./types";
import { nanoid } from "nanoid";
import { LocalAdapter } from "./adapters/local";
import { getModelLeadTimes as getCatalogLeadTimes } from "./lib/seed";
import { startOfDay } from "date-fns";
import type { StageDurations } from "./lib/schedule";
import { applyFilters, genSerial } from "./lib/utils";
import { sortPumps, SortDirection, SortField } from "./lib/sort";
import {
  CapacityTracker,
  computeDurationSummary,
  seedCapacityWithExistingJobs,
  scheduleJobsWithCapacity,
  toISODate,
  addDaysToISODate,
} from "./lib/capacity-scheduler";

// --- Store Definition ---

interface AppState {
  pumps: Pump[];
  filters: Filters;
  collapsedStages: Record<Stage, boolean>;
  collapsedCards: boolean;
  wipLimits: Record<Stage, number | null>;
  adapter: DataAdapter;
  loading: boolean;
  sortField: SortField;
  sortDirection: SortDirection;
  schedulingStageFilters: Stage[];

  // actions
  setAdapter: (a: DataAdapter) => void;
  load: () => Promise<void>;
  setFilters: (f: Partial<Filters>) => void;
  clearFilters: () => void;
  addPO: (payload: AddPoPayload) => void;
  moveStage: (id: string, to: Stage) => void;
  updatePump: (id: string, patch: Partial<Pump>) => void;
  schedulePump: (id: string, dropDate: string) => void;
  clearSchedule: (id: string) => void;
  clearNotStartedSchedules: () => number;
  levelNotStartedSchedules: () => number;
  replaceDataset: (rows: Pump[]) => void;
  toggleStageCollapse: (stage: Stage) => void;
  toggleCollapsedCards: () => void;
  setWipLimit: (stage: Stage, limit: number | null) => void;
  setSort: (field: SortField, direction: SortDirection) => void;
  toggleSchedulingStageFilter: (stage: Stage) => void;
  clearSchedulingStageFilters: () => void;

  // selectors
  filtered: () => Pump[];
  getModelLeadTimes: (model: string) => StageDurations | undefined;
}

export const useApp = create<AppState>()(
  persist(
    (set, get) => ({
      pumps: [],
      filters: {},
      collapsedStages: {
        "UNSCHEDULED": false,
        "NOT STARTED": false, FABRICATION: false, "POWDER COAT": false,
        ASSEMBLY: false, TESTING: false, SHIPPING: false, CLOSED: false
      } as Record<Stage, boolean>,
      collapsedCards: false,
      wipLimits: {
        "UNSCHEDULED": null, // No limit for unscheduled queue
        "NOT STARTED": 12,
        FABRICATION: 8,
        "POWDER COAT": 6,
        ASSEMBLY: 8,
        TESTING: 5,
        SHIPPING: 4,
        CLOSED: null,
      },
      adapter: LocalAdapter, // Default to LocalAdapter
      loading: true,
      sortField: "default",
      sortDirection: "desc",
      schedulingStageFilters: [],
      
      setAdapter: (a) => set({ adapter: a }),

      load: async () => {
        set({ loading: true });
        const rows = await get().adapter.load();
        set({ pumps: rows, loading: false });
      },
      
      setFilters: (f) => set({ filters: { ...get().filters, ...f } }),
      clearFilters: () => set({ filters: {} }),

      addPO: ({ po, customer, lines, dateReceived, promiseDate }) => {
        const expanded: Pump[] = lines.flatMap((line) =>
          Array.from({ length: line.quantity || 1 }).map(() => ({
            id: nanoid(),
            serial: genSerial(get().pumps),
            po,
            customer,
            model: line.model,
            stage: "UNSCHEDULED",
            priority: line.priority ?? "Normal",
            powder_color: line.color,
            last_update: dateReceived || new Date().toISOString(),
            value: line.valueEach ?? 0,
            scheduledEnd: line.promiseDate || promiseDate,
          }))
        );

        const next = [...get().pumps, ...expanded];
        set({ pumps: next });
        get().adapter.upsertMany(expanded);
      },

      moveStage: (id, to) => {
        const now = new Date().toISOString();
        const next = get().pumps.map(p =>
          p.id === id ? { ...p, stage: to, last_update: now } : p
        );
        set({ pumps: next });
        get().adapter.update(id, { stage: to, last_update: now });
      },

      updatePump: async (id, patch) => {
        const now = new Date().toISOString();
        const next = get().pumps.map(p =>
          p.id === id ? { ...p, ...patch, last_update: now } : p
        );
        set({ pumps: next });
        try {
          await get().adapter.update(id, { ...patch, last_update: now });
        } catch (error) {
          console.error(`[store] Failed to update pump ${id}:`, error);
          // Here you could add logic to revert the state change or show a UI notification
        }
      },

      replaceDataset: (rows) => {
        set({ pumps: rows });
        get().adapter.replaceAll(rows);
      },

      toggleStageCollapse: (stage) => {
        set(state => ({
          collapsedStages: {
            ...state.collapsedStages,
            [stage]: !state.collapsedStages[stage],
          }
        }));
      },
      toggleCollapsedCards: () => {
        set((state) => ({
          collapsedCards: !state.collapsedCards,
        }));
      },
      setWipLimit: (stage, limit) => {
        set((state) => ({
          wipLimits: {
            ...state.wipLimits,
            [stage]: limit,
          }
        }));
      },
      setSort: (field, direction) => set({ sortField: field, sortDirection: direction }),

      toggleSchedulingStageFilter: (stage) => {
        set((state) => {
          const active = new Set(state.schedulingStageFilters);
          if (active.has(stage)) {
            active.delete(stage);
          } else {
            active.add(stage);
          }
          return { schedulingStageFilters: Array.from(active) };
        });
      },

      clearSchedulingStageFilters: () => set({ schedulingStageFilters: [] }),

      schedulePump: (id: string, dropDate: string) => {
        const { pumps, getModelLeadTimes } = get();
        const pump = pumps.find(p => p.id === id);

        if (!pump) return;

        // Get lead times for this model
        const leadTimes = getModelLeadTimes(pump.model);
        if (!leadTimes) return;

        const { totalDays } = computeDurationSummary(leadTimes);
        const scheduledStart = dropDate;
        const scheduledEnd = addDaysToISODate(dropDate, totalDays);

        // Update pump with schedule and advance stage
        get().updatePump(id, {
          scheduledStart,
          scheduledEnd,
          stage: "NOT STARTED",
          last_update: new Date().toISOString(),
        });
      },

      clearSchedule: (id: string) => {
        get().updatePump(id, {
          scheduledStart: undefined,
          scheduledEnd: undefined,
          stage: "UNSCHEDULED",
          last_update: new Date().toISOString(),
        });
      },
      clearNotStartedSchedules: () => {
        const now = new Date().toISOString();
        const updates: Pump[] = [];
        const next = get().pumps.map((pump) => {
          if (!pump.scheduledStart) {
            return pump;
          }
          const shouldResetStage = pump.stage === "NOT STARTED";
          const updated: Pump = {
            ...pump,
            stage: shouldResetStage ? "UNSCHEDULED" : pump.stage,
            scheduledStart: undefined,
            scheduledEnd: undefined,
            last_update: now,
          };
          updates.push(updated);
          return updated;
        });
        if (!updates.length) return 0;
        set({ pumps: next });
        updates.forEach((pump) => {
          get().adapter.update(pump.id, {
            stage: pump.stage,
            scheduledStart: pump.scheduledStart,
            scheduledEnd: pump.scheduledEnd,
            last_update: pump.last_update,
          });
        });
        return updates.length;
      },
      levelNotStartedSchedules: () => {
        const state = get();

        // Filter for NOT STARTED pumps with scheduled dates
        const notStarted = state.pumps.filter(
          (pump) => pump.stage === "NOT STARTED" && pump.scheduledStart
        );

        if (!notStarted.length) return 0;

        // Setup capacity tracking
        const limitSetting = state.wipLimits?.FABRICATION;
        const capacity = typeof limitSetting === "number" && limitSetting > 0
          ? limitSetting
          : Infinity;
        const tracker = new CapacityTracker(capacity);
        const minDateISO = toISODate(startOfDay(new Date()));

        // Seed tracker with existing fabrication jobs to prevent overbooking
        seedCapacityWithExistingJobs(tracker, state.pumps, state.getModelLeadTimes);

        // Schedule jobs with capacity constraints
        const patches = scheduleJobsWithCapacity(
          notStarted,
          tracker,
          minDateISO,
          state.getModelLeadTimes
        );

        if (!patches.length) return 0;

        // Apply schedule updates to state
        const now = new Date().toISOString();
        const next = state.pumps.map((pump) => {
          const patch = patches.find((p) => p.id === pump.id);
          if (!patch) return pump;
          return { ...pump, ...patch, last_update: now };
        });
        set({ pumps: next });

        // Persist changes
        patches.forEach((patch) => {
          state.adapter.update(patch.id, { ...patch, last_update: now });
        });

        return patches.length;
      },

      filtered: () => {
        const rows = applyFilters(get().pumps, get().filters);
        return sortPumps(rows, get().sortField, get().sortDirection);
      },

      getModelLeadTimes: (model: string) => {
        // Use real catalog data instead of hardcoded values
        return getCatalogLeadTimes(model);
      },
    }),
    {
      name: "pumptracker-lite-v3-catalog",
      // Only persist filters and collapsed stages, not the pumps array itself 
      // since the adapter handles persistence.
      partialize: (state) => ({
        filters: state.filters,
        collapsedStages: state.collapsedStages,
        collapsedCards: state.collapsedCards,
        wipLimits: state.wipLimits,
        sortField: state.sortField,
        sortDirection: state.sortDirection,
        schedulingStageFilters: state.schedulingStageFilters,
      }),
    }
  )
);
