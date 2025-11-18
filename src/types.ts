// src/types.ts

export type Stage =
  | "UNSCHEDULED"
  | "NOT STARTED"
  | "FABRICATION"
  | "POWDER COAT"
  | "ASSEMBLY"
  | "TESTING"
  | "SHIPPING"
  | "CLOSED";

export type Priority = "Low" | "Normal" | "High" | "Rush" | "Urgent";

export type Department =
  | "Fabrication"
  | "Powder Coat"
  | "Assembly"
  | "Testing & Shipping";

export interface Pump {
  id: string;              // uuid
  serial: number;          // 4-digit unique
  po: string;
  customer: string;
  model: string;
  stage: Stage;
  priority: Priority;
  powder_color?: string;
  last_update: string;     // ISO
  value: number;           // numeric
  scheduledEnd?: string;   // ISO
  scheduledStart?: string; // ISO
  // derived, non-persistent:
  promiseDate?: string;    // from PO line
}

export interface PoLine {
  model: string;
  quantity: number;
  color?: string;
  promiseDate?: string; // ISO
  valueEach?: number;
  priority?: Priority;
}

export interface AddPoPayload {
  po: string;
  customer: string;
  dateReceived?: string;
  promiseDate?: string;
  lines: PoLine[]; // expands to multiple Pump entries
}

export interface Filters {
  po?: string;
  customer?: string;
  model?: string;
  priority?: Priority | "";
  stage?: Stage | "";
  q?: string; // search
  dateFrom?: string; // ISO (optional for trend)
  dateTo?: string;   // ISO
}

export type DataAdapter = {
  load: () => Promise<Pump[]>;
  replaceAll: (rows: Pump[]) => Promise<void>;
  upsertMany: (rows: Pump[]) => Promise<void>;
  update: (id: string, patch: Partial<Pump>) => Promise<void>;
};
