# Bounded Context

## Vocabulary

{
  "Pump": A manufactured pump unit with model, serial number, and production status
  "PO (Purchase Order)": Customer order containing one or more pump line items
  "Stage": Production pipeline stage (UNSCHEDULED, NOT STARTED, FABRICATION, POWDER COAT, ASSEMBLY, TESTING, SHIPPING, CLOSED)
  "Priority": Order urgency level (Low, Normal, High, Rush, Urgent)
  "Lead Time": Model-specific production duration in days
  "Scheduled End Date": Target completion date for a pump order
  "Shop Efficiency": Percentage of orders completed on or before scheduled date
  "Build Time": Days between order creation and completion
  "Zustand": State management library used for application state
  "Adapter": Data persistence layer (local storage, Supabase)
  "Dashboard": View with KPI metrics, charts, and order tables
  "Kanban": Drag-and-drop board for stage management
  "Scheduling": Calendar interface for assigning dates to unscheduled pumps
}

## Invariants

{
  "tech_stack": "React 19.2.0, TypeScript 5.9.3, Vite 7.2.2, Tailwind CSS 3.4.18, Zustand 5.0.8",
  "state_management": "Zustand for global state with local storage persistence",
  "testing": "Vitest for unit tests, Playwright for E2E tests",
  "architecture": "DDD-style layered architecture: domain, application, infrastructure, presentation layers",
  "drag_drop": "@dnd-kit for drag-and-drop functionality",
  "charts": "Recharts for data visualization",
  "routing": "React Router DOM for navigation",
  "data_persistence": "Local storage adapter with optional Supabase integration",
  "build_constraints": "Manual chunking configured to keep bundles under 275kB",
  "component_structure": "Organized by feature (dashboard, kanban, scheduling, toolbar)",
  "stage_pipeline": "Fixed 8-stage production pipeline, cannot be extended dynamically",
  "model_lead_times": "Each pump model has a specific lead time that affects scheduling calculations",
  "date_inheritance": "When scheduling from UNSCHEDULED to NOT STARTED, both start and end dates are set based on model lead time",
  "priority_ordering": "Urgent > Rush > High > Normal > Low for display and sorting",
  "test_coverage": "Unit tests for store logic, E2E tests for critical user flows"
}
