// src/lib/seed.ts
import { Pump, Stage, Priority } from '../types'
import { nanoid } from 'nanoid'
import catalogData from '../data/pumptracker-data.json'

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

// Customers from catalog
const CUSTOMERS = (catalogData as CatalogData).customers

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
  return `PO2025-${String(poCounter++).padStart(4, '0')}`
}

// Priority assignment logic
function assignPriority(model: CatalogModel): Priority {
  if (model.model.includes('SAFE')) return 'High'
  if (model.model.includes('HP')) return 'Normal'
  if (model.model.includes('RL')) return 'Normal'
  return 'Normal' // Default priority
}

// Generate deterministic pump from catalog model
function generatePumpFromCatalog(
  model: CatalogModel,
  customer: string,
  poBase: string,
  quantity: number,
  startIndex: number
): Pump[] {
  const pumps: Pump[] = []
  const basePrice = getEffectivePrice(model.price, model.model)
  const priority = assignPriority(model)
  const hasColor = Math.random() > 0.3 // 70% have powder coat

  for (let i = 0; i < quantity; i++) {
    const serial = genSerial()
    // FIX: Do not append line item to PO string, or grouping fails
    const po = poBase

    // Generate realistic schedule based on lead times
    // Spread POs across past 60 days to ensure variety in stages
    const now = new Date()
    const daysBack = Math.floor(Math.random() * 60) // 0-60 days ago
    const poDate = addBusinessDays(now, -daysBack)
    const fabricationStart = addBusinessDays(
      poDate,
      Math.floor(Math.random() * 5)
    ) // Start within 5 days
    const fabricationEnd = addBusinessDays(
      fabricationStart,
      model.lead_times.fabrication
    )
    const powderCoatEnd = addBusinessDays(
      fabricationEnd,
      model.lead_times.powder_coat
    )
    const assemblyEnd = addBusinessDays(
      powderCoatEnd,
      model.lead_times.assembly
    )
    const testingEnd = addBusinessDays(assemblyEnd, model.lead_times.testing)

    // Generate promise date distribution for On-Time Risk chart visualization:
    // - 75% On Track: promise date > 7 days in future
    // - 20% At Risk: promise date 1-7 days in future
    // - 5% Late: promise date in the past
    let promiseDate: Date
    const globalIndex = startIndex + i
    const riskSlot = globalIndex % 20

    if (riskSlot === 0) {
      // 5% LATE: promise date 1-30 days in the past
      const daysLate = Math.floor(Math.random() * 30) + 1
      promiseDate = addBusinessDays(now, -daysLate)
    } else if (riskSlot < 5) {
      // 20% AT RISK: promise date 1-7 days in the future
      const daysUntilDue = Math.floor(Math.random() * 7) + 1
      promiseDate = addBusinessDays(now, daysUntilDue)
    } else {
      // 75% ON TRACK: promise date 8-45 days in the future
      const daysUntilDue = Math.floor(Math.random() * 38) + 8
      promiseDate = addBusinessDays(now, daysUntilDue)
    }

    // Determine current stage using deterministic index-based distribution
    // This ensures pumps are spread across all stages for dashboard visualization
    let currentStage: Stage = 'QUEUE'
    let lastUpdate = poDate.toISOString()
    const forecastEnd = testingEnd.toISOString()

    // Use pattern index (globalIndex) to distribute across stages deterministically
    // Target distribution (mod 20):
    // 0 = ASSEMBLY (5% -> 4 jobs)
    // 1 = SHIP (5% -> 4 jobs)
    // 2 = CLOSED (5% -> 4 jobs)
    // 3-5 = QUEUE (15% -> 6 jobs)
    // 6-12 = FABRICATION (35% -> 14 jobs)
    // 13-19 = POWDER_COAT (35% -> 14 jobs)
    const stageSlot = globalIndex % 20

    if (stageSlot === 0) {
      // 5% in ASSEMBLY (approx 4 jobs)
      currentStage = 'ASSEMBLY'
      const daysInStage = Math.floor(Math.random() * 3) + 1
      lastUpdate = addBusinessDays(now, -daysInStage).toISOString()
    } else if (stageSlot === 1) {
      // 5% in SHIP (approx 4 jobs)
      currentStage = 'SHIP'
      const daysInStage = Math.floor(Math.random() * 2) + 1
      lastUpdate = addBusinessDays(now, -daysInStage).toISOString()
    } else if (stageSlot === 2) {
      // 5% CLOSED (approx 4 jobs)
      currentStage = 'CLOSED'
      const daysAgo = Math.floor(Math.random() * 14) + 1
      lastUpdate = addBusinessDays(now, -daysAgo).toISOString()
    } else if (stageSlot <= 5) {
      // 15% in QUEUE (approx 6 jobs)
      currentStage = 'QUEUE'
      lastUpdate = poDate.toISOString()
    } else if (stageSlot <= 12) {
      // 35% in FABRICATION (approx 14 jobs)
      currentStage = 'FABRICATION'
      const daysInStage = Math.floor(Math.random() * 5) + 1
      lastUpdate = addBusinessDays(now, -daysInStage).toISOString()
    } else {
      // 35% in POWDER_COAT (approx 14 jobs) - includes STAGED roughly half/half
      currentStage = globalIndex % 2 === 0 ? 'POWDER_COAT' : 'STAGED_FOR_POWDER'
      const daysInStage = Math.floor(Math.random() * 4) + 1
      lastUpdate = addBusinessDays(now, -daysInStage).toISOString()
    }

    pumps.push({
      id: nanoid(),
      serial,
      po,
      customer,
      model: model.model,
      stage: currentStage,
      priority,
      powder_color: hasColor
        ? COLORS[Math.floor(Math.random() * COLORS.length)]
        : undefined,
      last_update: lastUpdate,
      value: basePrice,
      forecastEnd,
      promiseDate: promiseDate.toISOString(),
      // BOM details (for future UI visibility)
      engine_model: getBomComponent(model.bom.engine, 'engine'),
      gearbox_model: getBomComponent(model.bom.gearbox, 'gearbox'),
      control_panel_model: getBomComponent(
        model.bom.control_panel,
        'control_panel'
      ),
      // Additional metadata
      description: model.description,
      total_lead_days: model.lead_times.total_days,
      work_hours: model.work_hours,
    } as Pump & {
      engine_model?: string | null
      gearbox_model?: string | null
      control_panel_model?: string | null
      description?: string
      total_lead_days?: number
    })
  }

  return pumps
}

// Main seed function
export function seed(count: number = 80): Pump[] {
  // Reset state for deterministic results
  usedSerials.clear()
  nextSerial = 1000
  poCounter = 1

  const pumps: Pump[] = []

  // Create realistic orders based on catalog models
  let generated = 0

  // Generate orders for each model
  for (const model of CATALOG_MODELS) {
    if (generated >= count) break

    // Determine order quantity
    // FORCE LARGE ORDERS for the first 20 generated pumps to show off Digital DNA
    const isLargeOrder = generated < 20
    const minQ = isLargeOrder ? 5 : 1
    const maxQ = isLargeOrder ? 12 : 5

    const orderQuantity = Math.min(
      Math.floor(Math.random() * (maxQ - minQ + 1)) + minQ,
      count - generated
    )
    const customer = CUSTOMERS[generated % CUSTOMERS.length]
    const poBase = genPONumber()

    const modelPumps = generatePumpFromCatalog(
      model,
      customer,
      poBase,
      orderQuantity,
      generated
    )

    pumps.push(...modelPumps)
    generated += orderQuantity
  }

  // If we still need more pumps, create additional orders
  while (generated < count) {
    const model = CATALOG_MODELS[generated % CATALOG_MODELS.length]
    const customer = CUSTOMERS[generated % CUSTOMERS.length]
    const poBase = genPONumber()
    const remainingQuantity = Math.min(3, count - generated) // Small batches

    const additionalPumps = generatePumpFromCatalog(
      model,
      customer,
      poBase,
      remainingQuantity,
      generated
    )

    pumps.push(...additionalPumps)
    generated += remainingQuantity
  }

  // Ensure we have exactly the requested count
  const finalPumps = pumps.slice(0, count)

  // POST-PROCESSING: Ensure some unscheduled QUEUE pumps (without forecastStart)
  const unscheduledCount = finalPumps.filter(
    (p) => p.stage === 'QUEUE' && !p.forecastStart
  ).length
  if (unscheduledCount < 5) {
    // Force at least 5 unscheduled QUEUE pumps
    const queuePumps = finalPumps.filter((p) => p.stage === 'QUEUE')
    const needed = Math.min(5 - unscheduledCount, queuePumps.length)

    for (let i = 0; i < needed; i++) {
      const pump = queuePumps[i]
      if (pump) {
        pump.forecastStart = undefined
        pump.forecastEnd = undefined
      }
    }
  }

  return finalPumps
}

// Export catalog data for store integration
export function getCatalogData() {
  return catalogData as CatalogData
}

// Export production stages for UI components
export function getProductionStages(): Stage[] {
  return CATALOG_STAGES
}
