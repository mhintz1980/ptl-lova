/**
 * @file schemas.ts
 * @description Zod schemas for AI Assistant data models
 */

import { z } from 'zod'

// ═══════════════════════════════════════════════════════════════════════════════
// STAGE & PRIORITY ENUMS (aligned with src/types.ts)
// ═══════════════════════════════════════════════════════════════════════════════

export const STAGES = [
  'QUEUE',
  'FABRICATION',
  'STAGED_FOR_POWDER',
  'POWDER_COAT',
  'ASSEMBLY',
  'SHIP',
  'CLOSED',
] as const

export const STAGE_VALUES = STAGES as readonly [string, ...string[]]

export type Stage = (typeof STAGES)[number]

export const PRIORITIES = ['Low', 'Normal', 'High', 'Rush', 'Urgent'] as const
export type Priority = (typeof PRIORITIES)[number]

// ═══════════════════════════════════════════════════════════════════════════════
// PUMP SCHEMA
// ═══════════════════════════════════════════════════════════════════════════════

export const PumpSchema = z.object({
  id: z.string().uuid(),
  serial: z.number().nullable(),
  po: z.string(),
  customer: z.string(),
  model: z.string(),
  stage: z.enum(STAGES),
  priority: z.enum(PRIORITIES),
  powder_color: z.string().optional(),
  last_update: z.string().datetime({ offset: true }),
  value: z.number().nonnegative(),
  engine: z.string().optional(),
  gearbox: z.string().optional(),
  forecastEnd: z.string().datetime({ offset: true }).optional(),
  forecastStart: z.string().datetime({ offset: true }).optional(),
  isPaused: z.boolean().optional(),
  pausedAt: z.string().datetime({ offset: true }).optional(),
  pausedStage: z.enum(STAGES).optional(),
  totalPausedDays: z.number().int().nonnegative().optional(),
  promiseDate: z.string().datetime({ offset: true }).optional(),
  dateReceived: z.string().datetime({ offset: true }).optional(),
  powderCoatVendorId: z.string().nullable().optional(),
  work_hours: z
    .object({
      fabrication: z.number().int().nonnegative(),
      assembly: z.number().int().nonnegative(),
      ship: z.number().int().nonnegative(),
    })
    .optional(),
})

export type Pump = z.infer<typeof PumpSchema>

// ═══════════════════════════════════════════════════════════════════════════════
// PURCHASE ORDER SCHEMA
// NOTE: PurchaseOrder is derived from Pump records, not a separate table
// Pumps with matching PO numbers are aggregated to form PO-level views
// ═══════════════════════════════════════════════════════════════════════════════

export const PoLineSchema = z.object({
  model: z.string(),
  quantity: z.number().int().positive(),
  color: z.string().optional(),
  promiseDate: z.string().datetime({ offset: true }).optional(),
  valueEach: z.number().nonnegative().optional(),
  priority: z.enum(PRIORITIES).optional(),
  engine: z.string().optional(),
  gearbox: z.string().optional(),
  notes: z.string().optional(),
})

export type PoLine = z.infer<typeof PoLineSchema>

export const PurchaseOrderSchema = z.object({
  id: z.string().uuid().optional(), // Will be generated if not provided
  po: z.string(), // Purchase order number
  customer: z.string(),
  dateReceived: z.string().datetime({ offset: true }).optional(),
  promiseDate: z.string().datetime({ offset: true }).optional(),
  lines: z.array(PoLineSchema).min(1),
  status: z
    .enum(['pending', 'in_progress', 'completed', 'cancelled'])
    .default('pending'),
  createdAt: z.string().datetime({ offset: true }).optional(),
  updatedAt: z.string().datetime({ offset: true }).optional(),
})

export type PurchaseOrder = z.infer<typeof PurchaseOrderSchema>

// ═══════════════════════════════════════════════════════════════════════════════
// CUSTOMER SCHEMA
// ═══════════════════════════════════════════════════════════════════════════════

export const CustomerContactSchema = z.object({
  name: z.string(),
  email: z.string().email().optional(),
  phone: z.string().optional(),
})

export type CustomerContact = z.infer<typeof CustomerContactSchema>

export const CustomerAddressSchema = z.object({
  street: z.string().optional(),
  city: z.string().optional(),
  state: z.string().optional(),
  zipCode: z.string().optional(),
  country: z.string().default('USA'),
})

export type CustomerAddress = z.infer<typeof CustomerAddressSchema>

export const CustomerSchema = z.object({
  id: z.string().uuid().optional(),
  name: z.string(),
  contact: CustomerContactSchema.optional(),
  address: CustomerAddressSchema.optional(),
  tier: z.enum(['Tier1', 'Tier2', 'Tier3']).default('Tier2'),
  notes: z.string().optional(),
  createdAt: z.string().datetime({ offset: true }).optional(),
  updatedAt: z.string().datetime({ offset: true }).optional(),
})

export type Customer = z.infer<typeof CustomerSchema>

// ═══════════════════════════════════════════════════════════════════════════════
// JOB STATUS SCHEMA
// ═══════════════════════════════════════════════════════════════════════════════

export const JobStatusSchema = z.object({
  id: z.string().uuid(),
  stage: z.enum(STAGES),
  completion_percentage: z.number().min(0).max(100),
  current_step: z.string().optional(),
  estimated_completion: z.string().datetime({ offset: true }).optional(),
  last_updated: z.string().datetime({ offset: true }),
  notes: z.string().optional(),
})

export type JobStatus = z.infer<typeof JobStatusSchema>

// ═══════════════════════════════════════════════════════════════════════════════
// SHOP CAPACITY SCHEMA
// ═══════════════════════════════════════════════════════════════════════════════

export const DepartmentCapacitySchema = z.object({
  department: z.enum([
    'Fabrication',
    'Powder Coat',
    'Assembly',
    'Testing & Shipping',
  ]),
  employeeCount: z.number().int().positive(),
  workDayHours: z.object({
    monday: z.number().int().min(0).max(24),
    tuesday: z.number().int().min(0).max(24),
    wednesday: z.number().int().min(0).max(24),
    thursday: z.number().int().min(0).max(24),
    friday: z.number().int().min(0).max(24),
    saturday: z.number().int().min(0).max(24),
    sunday: z.number().int().min(0).max(24),
  }),
  efficiency: z.number().min(0).max(1).default(0.85),
  dailyManHours: z.number().int().positive(),
  maxWip: z.number().int().positive(),
})

export type DepartmentCapacity = z.infer<typeof DepartmentCapacitySchema>

export const ShopCapacitySchema = z.object({
  id: z.string().uuid().optional(),
  date: z.string().date(),
  utilization: z.number().min(0).max(100), // Percentage 0-100
  available_slots: z.number().int().nonnegative(),
  departmentCapacities: z.array(DepartmentCapacitySchema),
  last_updated: z.string().datetime({ offset: true }).optional(),
})

export type ShopCapacity = z.infer<typeof ShopCapacitySchema>

// ═══════════════════════════════════════════════════════════════════════════════
// AI QUERY RESULT SCHEMA
// ═══════════════════════════════════════════════════════════════════════════════

export const AiQueryResultSchema = z.object({
  pumps: z.array(PumpSchema).optional(),
  purchaseOrders: z.array(PurchaseOrderSchema).optional(),
  customers: z.array(CustomerSchema).optional(),
  jobStatuses: z.array(JobStatusSchema).optional(),
  shopCapacity: ShopCapacitySchema.optional(),
  summary: z.string().optional(),
  error: z.string().optional(),
})

export type AiQueryResult = z.infer<typeof AiQueryResultSchema>

// ═══════════════════════════════════════════════════════════════════════════════
// AI TOOL INPUT SCHEMAS (for Vercel AI SDK tool definitions)
// ═══════════════════════════════════════════════════════════════════════════════

export const GetPumpsInputSchema = z.object({
  stage: z.enum(STAGES).optional(),
  customer: z.string().optional(),
  priority: z.enum(PRIORITIES).optional(),
  limit: z.number().int().min(1).max(100).default(20),
})

export type GetPumpsInput = z.infer<typeof GetPumpsInputSchema>

export const GetJobStatusInputSchema = z.object({
  po: z.string().optional(),
  serial: z.number().optional(),
})

export type GetJobStatusInput = z.infer<typeof GetJobStatusInputSchema>

export const GetShopCapacityInputSchema = z.object({
  date: z.string().date().optional(), // defaults to today
})

export type GetShopCapacityInput = z.infer<typeof GetShopCapacityInputSchema>

// ═══════════════════════════════════════════════════════════════════════════════
// SHOP CAPACITY SUMMARY SCHEMA (lighter alternative for AI responses)
// ═══════════════════════════════════════════════════════════════════════════════

export const ShopCapacitySummarySchema = z.object({
  totalPumpsInProgress: z.number(),
  byStage: z.record(z.enum(STAGES), z.number()),
  bottleneck: z.string().optional(),
})

export type ShopCapacitySummary = z.infer<typeof ShopCapacitySummarySchema>
