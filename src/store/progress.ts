import { create } from 'zustand'
import type { Milestone, MicroTask } from '../types'

interface ProgressState {
  milestones: Milestone[]
  microTasks: MicroTask[]

  // Milestone actions
  addMilestone: (m: Milestone) => void
  updateMilestone: (id: string, patch: Partial<Milestone>) => void
  deleteMilestone: (id: string) => void

  // MicroTask actions
  addMicroTask: (t: MicroTask) => void
  toggleMicroTask: (id: string) => void
  deleteMicroTask: (id: string) => void
}

export const useProgressStore = create<ProgressState>((set) => ({
  milestones: [],
  microTasks: [],

  addMilestone: (m) =>
    set((state) => ({ milestones: [...state.milestones, m] })),

  updateMilestone: (id, patch) =>
    set((state) => ({
      milestones: state.milestones.map((m) =>
        m.id === id ? { ...m, ...patch } : m
      ),
    })),

  deleteMilestone: (id) =>
    set((state) => ({
      milestones: state.milestones.filter((m) => m.id !== id),
      microTasks: state.microTasks.filter((t) => t.milestoneId !== id),
    })),

  addMicroTask: (t) =>
    set((state) => ({ microTasks: [...state.microTasks, t] })),

  toggleMicroTask: (id) =>
    set((state) => ({
      microTasks: state.microTasks.map((t) =>
        t.id === id
          ? {
              ...t,
              isComplete: !t.isComplete,
              completedAt: !t.isComplete
                ? new Date().toISOString()
                : undefined,
            }
          : t
      ),
    })),

  deleteMicroTask: (id) =>
    set((state) => ({
      microTasks: state.microTasks.filter((t) => t.id !== id),
    })),
}))
