import type { Pump, Stage } from '../types'

/**
 * Represents a single segment in the Digital DNA strand.
 * Corresponds to a production stage (e.g., Fabrication, Assembly).
 */
export interface DnaSegment {
  id: string // Unique ID for keying
  stage: Stage
  label: string // Short label (e.g. "FAB", "ASM")

  // Aggregate stats for this stage within the PO
  totalCount: number // Total pumps in this PO
  completedCount: number // Pumps that have passed this stage
  activeCount: number // Pumps currently IN this stage

  // Display properties
  completionRatio: number // 0.0 to 1.0
  activeRatio: number // 0.0 to 1.0
  colorClass: string // CSS class for the stage color

  // Status flags
  hasIssues: boolean // If any pump in this stage has issues (e.g., paused, late)
  isBlocked: boolean // If the stage is blocked
}

/**
 * Represents the Digital DNA strand for a Purchase Order.
 * Contains the sequence of segments representing the PO's lifecycle.
 */
export interface DigitalDnaStrand {
  id: string // Usually the PO number
  poNumber: string
  customer: string

  // Timeline stats
  startDate?: string // Earliest forecast start or actual start
  endDate?: string // Latest forecast end or promise date

  // Segments
  segments: DnaSegment[]

  // Data
  pumps: Pump[]

  // Aggregate status
  overallProgress: number // 0.0 to 1.0
  totalValue: number
  isLate: boolean
}
