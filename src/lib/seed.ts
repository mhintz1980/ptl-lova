import { Pump, Stage, Priority } from '../types'
import { nanoid } from 'nanoid'
import catalogData from '../data/pumptracker-data.json'
import {
  type DomainEvent,
  createEvent,
} from '../domain/production/events/DomainEvent'
import { pumpStageMoved } from '../domain/production/events/PumpStageMoved'

// Type definitions for catalog data
interface CatalogModel {
  model: string
  description: string
  price: number | null
  bom: {
    engine: string | null
    gearbox: string | null
    control_panel: string | null
  }
  lead_times: {
    fabrication: number
    powder_coat: number
    assembly: number
    testing: number
    total_days: number
  }
  work_hours?: {
    fabrication: number
    assembly: number
    testing: number
    shipping: number
  }
}

interface CatalogData {
  models: CatalogModel[]
  customers: string[]
  productionStages: string[]
}

// Constitution §2.1: Transform legacy lead_times to canonical format
export function getModelLeadTimes(
  modelCode: string
):
  | { fabrication: number; powder_coat: number; assembly: number; ship: number }
  | undefined {
  const model = CATALOG_MODELS.find((m) => m.model === modelCode)
  if (!model) return undefined
  return {
    fabrication: model.lead_times.fabrication,
    powder_coat: model.lead_times.powder_coat,
    assembly: model.lead_times.assembly,
    ship: model.lead_times.testing, // testing is the primary duration
  }
}

// Get model price from catalog (for AddPoModal value auto-population)
export function getModelPrice(modelCode: string): number {
  const model = CATALOG_MODELS.find((m) => m.model === modelCode)
  if (!model) return 0
  return getEffectivePrice(model.price, model.model)
}

// Get model BOM components (engine/gearbox) for AddPoModal auto-population
export function getModelBom(modelCode: string): {
  engine: string | null
  gearbox: string | null
} {
  const model = CATALOG_MODELS.find((m) => m.model === modelCode)
  if (!model) return { engine: null, gearbox: null }
  return {
    engine: getBomComponent(model.bom.engine, 'engine'),
    gearbox: getBomComponent(model.bom.gearbox, 'gearbox'),
  }
}

// Constitution §2.1: Transform legacy work_hours to canonical format
export function getModelWorkHours(
  modelCode: string
): { fabrication: number; assembly: number; ship: number } | undefined {
  const model = CATALOG_MODELS.find((m) => m.model === modelCode)
  if (!model?.work_hours) return undefined
  return {
    fabrication: model.work_hours.fabrication,
    assembly: model.work_hours.assembly,
    ship: (model.work_hours.testing ?? 0) + (model.work_hours.shipping ?? 0),
  }
}

// Stage name conversion: Title Case → Canonical IDs
function convertStageName(stageName: string): Stage {
  const stageMap: Record<string, Stage> = {
    'Not Started': 'QUEUE',
    Fabrication: 'FABRICATION',
    'Powder Coat': 'POWDER_COAT', // Constitution §2.2: underscore
    Assembly: 'ASSEMBLY',
    Testing: 'SHIP', // Constitution §2.2: merged
    Shipping: 'SHIP', // Constitution §2.2: merged
    CLOSED: 'CLOSED',
  }
  return stageMap[stageName] || 'QUEUE'
}

// Get production stages from catalog and add CLOSED
const CATALOG_STAGES: Stage[] = [
  ...(catalogData as CatalogData).productionStages.map(convertStageName),
  'CLOSED',
]

// Models from catalog
const CATALOG_MODELS = (catalogData as CatalogData).models

// Colors for powder coating
const COLORS = [
  'Red',
  'Blue',
  'Green',
  'Yellow',
  'Black',
  'White',
  'Orange',
  'Gray',
]

// Price fallback logic
function getEffectivePrice(basePrice: number | null, model: string): number {
  if (basePrice !== null) return basePrice

  // Fallback prices for models with null prices
  if (model.includes('SAFE')) return model.includes('4') ? 32000 : 52000
  if (model.includes('RL')) return 48000 // Rotary Lobe
  if (model.includes('HC')) return 38000 // High Capacity

  // Default fallback
  return 28000
}

// BOM component fallback logic
function getBomComponent(
  component: string | null,
  type: string
): string | null {
  if (component !== null) return component

  // Standard fallbacks
  const fallbacks: Record<string, string> = {
    engine: 'STANDARD ENGINE',
    gearbox: 'STANDARD GEARBOX',
    control_panel: 'STANDARD CONTROL',
  }

  return fallbacks[type] || null
}

// Serial number management
const usedSerials = new Set<number>()
let nextSerial = 1000

function genSerial(): number {
  let serial: number
  do {
    serial = nextSerial++
  } while (usedSerials.has(serial))
  usedSerials.add(serial)
  return serial
}

// Business day calculation (excludes weekends)
function addBusinessDays(startDate: Date, days: number): Date {
  const result = new Date(startDate)

  // Handle negative days (going backwards)
  if (days < 0) {
    let businessDays = 0
    while (businessDays > days) {
      result.setDate(result.getDate() - 1)
      const dayOfWeek = result.getDay()
      if (dayOfWeek !== 0 && dayOfWeek !== 6) {
        businessDays--
      }
    }
    return result
  }

  // Handle positive days (going forward)
  let businessDays = 0
  while (businessDays < days) {
    result.setDate(result.getDate() + 1)
    const dayOfWeek = result.getDay()
    if (dayOfWeek !== 0 && dayOfWeek !== 6) {
      businessDays++
    }
  }
  return result
}

// PO number generation
let poCounter = 1
function genPONumber(): string {
  return `PO2026-${String(poCounter++).padStart(4, '0')}`
}

// Priority assignment logic
function assignPriority(model: CatalogModel): Priority {
  if (model.model.includes('SAFE')) return 'High'
  if (model.model.includes('HP')) return 'Normal'
  if (model.model.includes('RL')) return 'Normal'
  return 'Normal' // Default priority
}

// Use mapped type instead of any for type safety
interface GeneratedDates {
  poDate: Date
  fabricationStart: Date
  fabricationEnd: Date
  powderCoatEnd: Date
  assemblyEnd: Date
  testingEnd: Date
}

// Helper to generate events for stage history
function generateStageEvents(pump: Pump, dates: GeneratedDates): DomainEvent[] {
  const events: DomainEvent[] = []

  // Only generate events if we've moved past QUEUE
  if (pump.stage === 'QUEUE') return events

  const context = {
    serial: pump.serial,
    model: pump.model,
    customer: pump.customer,
    po: pump.po,
  }

  // 1. Created -> QUEUE (at Date Received/PO Date)
  // 2. QUEUE -> FABRICATION
  if (dates.fabricationStart) {
    events.push(
      createEvent({
        ...pumpStageMoved(pump.id, 'QUEUE', 'FABRICATION', context),
        occurredAt: dates.fabricationStart,
      })
    )
  }

  // 3. FABRICATION -> STAGED_FOR_POWDER
  if (
    dates.fabricationEnd &&
    ['STAGED_FOR_POWDER', 'POWDER_COAT', 'ASSEMBLY', 'SHIP', 'CLOSED'].includes(
      pump.stage
    )
  ) {
    events.push(
      createEvent({
        ...pumpStageMoved(pump.id, 'FABRICATION', 'STAGED_FOR_POWDER', context),
        occurredAt: dates.fabricationEnd,
      })
    )
  }

  // 4. STAGED_FOR_POWDER -> POWDER_COAT
  // Note: Powder Coat End is when it LEAVES powder coat, so start is approximate or based on stage duration
  // For simplicity using a calculated start based on fabrication end + buffer
  if (['POWDER_COAT', 'ASSEMBLY', 'SHIP', 'CLOSED'].includes(pump.stage)) {
    // If we are PAST powder coat, we must have entered it.
    // We trigger this event at fabricationEnd + random buffer (1-3 days) or immediately if expedited
    const enterPowder = addBusinessDays(dates.fabricationEnd, 1)
    events.push(
      createEvent({
        ...pumpStageMoved(pump.id, 'STAGED_FOR_POWDER', 'POWDER_COAT', context),
        occurredAt: enterPowder,
      })
    )
  }

  // 5. POWDER_COAT -> ASSEMBLY
  if (
    dates.powderCoatEnd &&
    ['ASSEMBLY', 'SHIP', 'CLOSED'].includes(pump.stage)
  ) {
    events.push(
      createEvent({
        ...pumpStageMoved(pump.id, 'POWDER_COAT', 'ASSEMBLY', context),
        occurredAt: dates.powderCoatEnd,
      })
    )
  }

  // 6. ASSEMBLY -> SHIP (Testing/Shipping)
  if (dates.assemblyEnd && ['SHIP', 'CLOSED'].includes(pump.stage)) {
    events.push(
      createEvent({
        ...pumpStageMoved(pump.id, 'ASSEMBLY', 'SHIP', context),
        occurredAt: dates.assemblyEnd,
      })
    )
  }

  // 7. SHIP -> CLOSED
  if (dates.testingEnd && pump.stage === 'CLOSED') {
    events.push(
      createEvent({
        ...pumpStageMoved(pump.id, 'SHIP', 'CLOSED', context),
        occurredAt: dates.testingEnd,
      })
    )
  }

  return events
}

// ─────────────────────────────────────────────────────────────────────────────
// Curated seed: 5 POs with current dates (anchored 2026-02-24)
// Model mix per PO: ~30% RL200, 30% RL300, 10% DD-4S, 10% DD-6 SAFE,
//                   10% RL200-SAFE, 10% RL300-SAFE
// ─────────────────────────────────────────────────────────────────────────────

// PO definitions: each entry describes one purchase order.
interface PODefinition {
  customer: string
  /** Business days before today the PO was placed (controls stage spread) */
  daysAgoStart: number
  /** Ordered list of model codes for each pump in this PO */
  modelCodes: string[]
}

const PO_DEFINITIONS: PODefinition[] = [
  // PO-01 — 12 pumps, started ~28 biz-days ago (pumps deep in—or past—assembly)
  {
    customer: 'Herc Rentals',
    daysAgoStart: 28,
    modelCodes: [
      'RL200',
      'RL200',
      'RL200',
      'RL200',
      'RL300',
      'RL300',
      'RL300',
      'RL300',
      'DD-4S',
      'DD-6 SAFE',
      'RL200-SAFE',
      'RL300-SAFE',
    ],
  },
  // PO-02 — 13 pumps, started ~18 biz-days ago (pumps mostly in powder-coat / assembly)
  {
    customer: 'United Rentals',
    daysAgoStart: 18,
    modelCodes: [
      'RL200',
      'RL200',
      'RL200',
      'RL200',
      'RL300',
      'RL300',
      'RL300',
      'RL300',
      'DD-4S',
      'DD-6 SAFE',
      'RL200-SAFE',
      'RL200-SAFE',
      'RL300-SAFE',
    ],
  },
  // PO-03 — 10 pumps, started ~12 biz-days ago (pumps in fabrication / staged-for-powder)
  {
    customer: 'Rain For Rent',
    daysAgoStart: 12,
    modelCodes: [
      'RL200',
      'RL200',
      'RL200',
      'RL300',
      'RL300',
      'RL300',
      'DD-4S',
      'DD-6 SAFE',
      'RL200-SAFE',
      'RL300-SAFE',
    ],
  },
  // PO-04 — 12 pumps, started ~7 biz-days ago (pumps in queue / early fabrication)
  {
    customer: 'Sunbelt Rentals',
    daysAgoStart: 7,
    modelCodes: [
      'RL200',
      'RL200',
      'RL200',
      'RL200',
      'RL300',
      'RL300',
      'RL300',
      'RL300',
      'DD-4S',
      'DD-6 SAFE',
      'RL200-SAFE',
      'RL300-SAFE',
    ],
  },
  // PO-05 — 11 pumps, started ~3 biz-days ago (pumps just received / in queue)
  {
    customer: 'Equipment Share',
    daysAgoStart: 3,
    modelCodes: [
      'RL200',
      'RL200',
      'RL200',
      'RL300',
      'RL300',
      'RL300',
      'DD-4S',
      'DD-6 SAFE',
      'RL200-SAFE',
      'RL200-SAFE',
      'RL300-SAFE',
    ],
  },
]

// Main seed function
export function seed(_count?: number): {
  pumps: Pump[]
  events: DomainEvent[]
} {
  // Reset state for deterministic results
  usedSerials.clear()
  nextSerial = 1000
  poCounter = 1

  const pumps: Pump[] = []
  const events: DomainEvent[] = []

  const now = new Date() // 2026-02-24 or current runtime date

  PO_DEFINITIONS.forEach((poDef) => {
    const poBase = genPONumber()
    const poDate = addBusinessDays(now, -poDef.daysAgoStart)

    poDef.modelCodes.forEach((modelCode, idx) => {
      const catalogModel = CATALOG_MODELS.find((m) => m.model === modelCode)
      if (!catalogModel) {
        console.warn(`[seed] Unknown model code: ${modelCode} — skipping`)
        return
      }

      const globalIndex = pumps.length

      const serial = genSerial()
      const basePrice = getEffectivePrice(
        catalogModel.price,
        catalogModel.model
      )
      const priority = assignPriority(catalogModel)
      const hasColor = idx % 10 !== 9 // 90% get a powder-coat colour

      // ── Schedule arithmetic ────────────────────────────────────────────────
      const fabricationStart = addBusinessDays(poDate, 1)
      const fabricationEnd = addBusinessDays(
        fabricationStart,
        catalogModel.lead_times.fabrication
      )
      const powderCoatEnd = addBusinessDays(
        fabricationEnd,
        catalogModel.lead_times.powder_coat
      )
      const assemblyEnd = addBusinessDays(
        powderCoatEnd,
        catalogModel.lead_times.assembly
      )
      const testingEnd = addBusinessDays(
        assemblyEnd,
        catalogModel.lead_times.testing
      )

      const dates: GeneratedDates = {
        poDate,
        fabricationStart,
        fabricationEnd,
        powderCoatEnd,
        assemblyEnd,
        testingEnd,
      }

      // ── Promise date distribution (75% on-track / 20% at-risk / 5% late) ──
      let promiseDate: Date
      const riskSlot = globalIndex % 20
      if (riskSlot === 0) {
        promiseDate = addBusinessDays(
          now,
          -(Math.floor(Math.random() * 14) + 1)
        )
      } else if (riskSlot < 5) {
        promiseDate = addBusinessDays(now, Math.floor(Math.random() * 7) + 1)
      } else {
        promiseDate = addBusinessDays(now, Math.floor(Math.random() * 30) + 8)
      }

      // ── Stage determination based on elapsed time since PO ────────────────
      // Compare today to the calculated milestone dates for this pump.
      let currentStage: Stage = 'QUEUE'
      let lastUpdate = poDate.toISOString()

      if (now >= testingEnd) {
        // Fully through the pipeline — randomly mark some as CLOSED vs SHIP
        currentStage = globalIndex % 3 === 0 ? 'CLOSED' : 'SHIP'
        lastUpdate = addBusinessDays(
          now,
          -Math.floor(Math.random() * 3)
        ).toISOString()
      } else if (now >= assemblyEnd) {
        currentStage = 'SHIP'
        lastUpdate = addBusinessDays(
          now,
          -(Math.floor(Math.random() * 2) + 1)
        ).toISOString()
      } else if (now >= powderCoatEnd) {
        currentStage = 'ASSEMBLY'
        lastUpdate = addBusinessDays(
          now,
          -(Math.floor(Math.random() * 3) + 1)
        ).toISOString()
      } else if (now >= fabricationEnd) {
        // In or waiting for powder coat
        currentStage =
          globalIndex % 2 === 0 ? 'POWDER_COAT' : 'STAGED_FOR_POWDER'
        lastUpdate = addBusinessDays(
          now,
          -(Math.floor(Math.random() * 4) + 1)
        ).toISOString()
      } else if (now >= fabricationStart) {
        currentStage = 'FABRICATION'
        lastUpdate = addBusinessDays(
          now,
          -(Math.floor(Math.random() * 3) + 1)
        ).toISOString()
      } else {
        currentStage = 'QUEUE'
        lastUpdate = poDate.toISOString()
      }

      const pump: Pump = {
        id: nanoid(),
        serial,
        po: poBase,
        customer: poDef.customer,
        model: catalogModel.model,
        stage: currentStage,
        priority,
        powder_color: hasColor
          ? COLORS[Math.floor(Math.random() * COLORS.length)]
          : undefined,
        last_update: lastUpdate,
        value: basePrice,
        forecastEnd: testingEnd.toISOString(),
        promiseDate: promiseDate.toISOString(),
        engine: getBomComponent(catalogModel.bom.engine, 'engine') ?? undefined,
        gearbox:
          getBomComponent(catalogModel.bom.gearbox, 'gearbox') ?? undefined,
        work_hours: getModelWorkHours(catalogModel.model),
      }

      pumps.push(pump)

      const pumpEvents = generateStageEvents(pump, dates)
      events.push(...pumpEvents)
    })
  })

  // Sort events chronologically
  events.sort((a, b) => a.occurredAt.getTime() - b.occurredAt.getTime())

  return { pumps, events }
}

// Export catalog data for store integration
export function getCatalogData() {
  return catalogData as CatalogData
}

// Export production stages for UI components
export function getProductionStages(): Stage[] {
  return CATALOG_STAGES
}
