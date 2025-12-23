// Mock data for the PumpTracker dashboard

export interface PurchaseOrder {
  id: string;
  poNumber: string;
  customer: string;
  model: string;
  quantity: number;
  completed: number;
  dueDate: string;
  status: "on-time" | "at-risk" | "late";
  buildTimePerPump: number;
  startDate: string;
}

export interface BuildTimeTrend {
  date: string;
  modelA: number;
  modelB: number;
  modelC: number;
  modelD: number;
  modelE: number;
  average: number;
}

export interface CapacityData {
  week: string;
  totalCapacity: number;
  scheduledWork: number;
  actualWork: number;
  utilization: number;
}

export const mockPurchaseOrders: PurchaseOrder[] = [
  {
    id: "1",
    poNumber: "PO-2024-001",
    customer: "Acme Industrial",
    model: "Model A",
    quantity: 25,
    completed: 15,
    dueDate: "2025-11-15",
    startDate: "2025-09-01",
    status: "on-time",
    buildTimePerPump: 5.2,
  },
  {
    id: "2",
    poNumber: "PO-2024-002",
    customer: "TechCorp Manufacturing",
    model: "Model B",
    quantity: 12,
    completed: 8,
    dueDate: "2025-10-28",
    startDate: "2025-09-15",
    status: "at-risk",
    buildTimePerPump: 6.1,
  },
  {
    id: "3",
    poNumber: "PO-2024-003",
    customer: "Acme Industrial",
    model: "Model C",
    quantity: 30,
    completed: 20,
    dueDate: "2025-12-01",
    startDate: "2025-08-15",
    status: "on-time",
    buildTimePerPump: 4.8,
  },
  {
    id: "4",
    poNumber: "PO-2024-004",
    customer: "Global Pumps Inc",
    model: "Model A",
    quantity: 18,
    completed: 5,
    dueDate: "2025-10-20",
    startDate: "2025-09-01",
    status: "late",
    buildTimePerPump: 7.2,
  },
  {
    id: "5",
    poNumber: "PO-2024-005",
    customer: "Industrial Solutions",
    model: "Model D",
    quantity: 8,
    completed: 6,
    dueDate: "2025-11-30",
    startDate: "2025-10-01",
    status: "on-time",
    buildTimePerPump: 5.5,
  },
  {
    id: "6",
    poNumber: "PO-2024-006",
    customer: "TechCorp Manufacturing",
    model: "Model B",
    quantity: 15,
    completed: 10,
    dueDate: "2025-11-10",
    startDate: "2025-09-20",
    status: "on-time",
    buildTimePerPump: 5.9,
  },
  {
    id: "7",
    poNumber: "PO-2024-007",
    customer: "Global Pumps Inc",
    model: "Model E",
    quantity: 20,
    completed: 8,
    dueDate: "2025-10-25",
    startDate: "2025-09-05",
    status: "late",
    buildTimePerPump: 6.8,
  },
  {
    id: "8",
    poNumber: "PO-2024-008",
    customer: "Acme Industrial",
    model: "Model A",
    quantity: 22,
    completed: 18,
    dueDate: "2025-12-15",
    startDate: "2025-09-10",
    status: "on-time",
    buildTimePerPump: 5.0,
  },
  {
    id: "9",
    poNumber: "PO-2024-009",
    customer: "Precision Engineering",
    model: "Model C",
    quantity: 10,
    completed: 7,
    dueDate: "2025-11-20",
    startDate: "2025-10-05",
    status: "on-time",
    buildTimePerPump: 5.3,
  },
  {
    id: "10",
    poNumber: "PO-2024-010",
    customer: "Industrial Solutions",
    model: "Model B",
    quantity: 16,
    completed: 12,
    dueDate: "2025-12-05",
    startDate: "2025-09-25",
    status: "on-time",
    buildTimePerPump: 5.7,
  },
];

export const getUniqueCustomers = (orders: PurchaseOrder[]): string[] => {
  return Array.from(new Set(orders.map((order) => order.customer))).sort();
};

export const getUniquePOs = (orders: PurchaseOrder[]): string[] => {
  return Array.from(new Set(orders.map((order) => order.poNumber))).sort();
};

export const getUniqueModels = (orders: PurchaseOrder[]): string[] => {
  return Array.from(new Set(orders.map((order) => order.model))).sort();
};

// Mock build time trends data
export const mockBuildTimeTrends: BuildTimeTrend[] = [
  {
    date: "2025-08-01",
    modelA: 5.8,
    modelB: 6.5,
    modelC: 5.2,
    modelD: 5.9,
    modelE: 7.1,
    average: 6.1,
  },
  {
    date: "2025-08-15",
    modelA: 5.5,
    modelB: 6.3,
    modelC: 5.0,
    modelD: 5.7,
    modelE: 6.9,
    average: 5.88,
  },
  {
    date: "2025-09-01",
    modelA: 5.3,
    modelB: 6.1,
    modelC: 4.9,
    modelD: 5.6,
    modelE: 6.8,
    average: 5.74,
  },
  {
    date: "2025-09-15",
    modelA: 5.2,
    modelB: 6.0,
    modelC: 4.8,
    modelD: 5.5,
    modelE: 6.7,
    average: 5.64,
  },
  {
    date: "2025-10-01",
    modelA: 5.1,
    modelB: 5.9,
    modelC: 4.8,
    modelD: 5.5,
    modelE: 6.8,
    average: 5.62,
  },
  {
    date: "2025-10-12",
    modelA: 5.2,
    modelB: 6.1,
    modelC: 4.8,
    modelD: 5.5,
    modelE: 6.8,
    average: 5.68,
  },
];

// Mock capacity planning data
export const mockCapacityData: CapacityData[] = [
  {
    week: "Oct 7-13",
    totalCapacity: 50,
    scheduledWork: 42,
    actualWork: 38,
    utilization: 76,
  },
  {
    week: "Oct 14-20",
    totalCapacity: 50,
    scheduledWork: 48,
    actualWork: 45,
    utilization: 90,
  },
  {
    week: "Oct 21-27",
    totalCapacity: 50,
    scheduledWork: 52,
    actualWork: 46,
    utilization: 92,
  },
  {
    week: "Oct 28-Nov 3",
    totalCapacity: 50,
    scheduledWork: 45,
    actualWork: 0,
    utilization: 0,
  },
  {
    week: "Nov 4-10",
    totalCapacity: 50,
    scheduledWork: 38,
    actualWork: 0,
    utilization: 0,
  },
  {
    week: "Nov 11-17",
    totalCapacity: 50,
    scheduledWork: 41,
    actualWork: 0,
    utilization: 0,
  },
  {
    week: "Nov 18-24",
    totalCapacity: 50,
    scheduledWork: 35,
    actualWork: 0,
    utilization: 0,
  },
  {
    week: "Nov 25-Dec 1",
    totalCapacity: 50,
    scheduledWork: 40,
    actualWork: 0,
    utilization: 0,
  },
];
