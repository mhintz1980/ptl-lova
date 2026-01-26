import type { Pump, Stage } from '../types'

/**
 * Represents a single pump visualization item in the DNA strand.
 */
export interface DnaPumpItem {
  id: string
  stage: Stage
  colorClass: string
  sortOrder: number // For grouping: Fabrication=1, Powder=2, Assembly=3, Queue=4, etc.
  isCompleted: boolean
  hasIssues: boolean
}

/**
 * Represents the Digital DNA strand for a Purchase Order.
 * Contains the sequence of pumps representing the PO's lifecycle.
 */
export interface DigitalDnaStrand {
  id: string // Usually the PO number
  poNumber: string
  customer: string

  // Timeline stats
  startDate?: string // Earliest forecast start or actual start
  endDate?: string // Latest forecast end or promise date

  // Data
  pumps: Pump[]

  // Visualization Data (Pre-calculated sort/color)
  dnaItems: DnaPumpItem[]

  // Aggregate status
  overallProgress: number // 0.0 to 1.0
  totalValue: number
  isLate: boolean
}

export const STAGE_ORDER: Record<Stage, number> = {
  // Reread user request: "The first two are orange and represent the two in 'Fabrication'... The last three pumps are black and represent the 3 pumps that are in 'Queue'."
  // This implies visual order: Fab -> Powder -> Asm -> Queue?
  // Usually Queue is *start*. If visualization is "What's in progress", Queue might be inactive/waiting.
  // I will follow the user's explicit example order: Fab -> Powder -> Asm -> Queue.
  // So Active Stages First, then Queue.
  FABRICATION: 10,
  STAGED_FOR_POWDER: 20,
  POWDER_COAT: 30,
  ASSEMBLY: 40,
  SHIP: 50,
  CLOSED: 60,
  // 'QUEUE' is at the end as per user request
  QUEUE: 90,
}

/**
 * Maps a stage to its visualization color class.
 */
export function getStageColor(stage: Stage): string {
  switch (stage) {
    case 'FABRICATION':
      return 'bg-amber-700' // Amber/Red
    case 'STAGED_FOR_POWDER':
      return 'bg-orange-500' // Orange
    case 'POWDER_COAT':
      return 'bg-yellow-500' // Yellow
    case 'ASSEMBLY':
      return 'bg-emerald-500' // Green
    case 'SHIP':
    case 'CLOSED':
      return 'bg-blue-600' // Completed / Shipped
    case 'QUEUE':
    default:
      return 'bg-neutral-800' // Dark Grey / Black
  }
}
