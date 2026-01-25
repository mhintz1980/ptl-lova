# PumpTracker Lite

A modern, responsive production management system for tracking pump manufacturing orders through their complete lifecycle. Built with React 19, TypeScript, Tailwind CSS, and Zustand with Domain-Driven Design architecture.

## 🚀 Status

> **Version**: 2.0.0 (Beta)  
> **Deployment**: Live on Vercel with Supabase persistence  
> **Last Updated**: December 25, 2024

## 🎯 Overview

PumpTracker Lite is a powerful web application designed to help manufacturing teams manage pump production orders efficiently. It provides real-time visibility into production status, advanced KPI tracking with drill-down analytics, intuitive drag-and-drop Kanban board management, and intelligent scheduling.

## 📚 Documentation

All project documents live under [`docs/`](docs/README.md):

| Document                                                     | Purpose                                 |
| ------------------------------------------------------------ | --------------------------------------- |
| [`docs/architecture.md`](docs/architecture.md)               | UI surfaces, data flow, DDD layers      |
| [`docs/development.md`](docs/development.md)                 | Setup, workflow, coding conventions     |
| [`docs/error-format.md`](docs/error-format.md)               | Error reporting shape + troubleshooting |
| [`docs/testing.md`](docs/testing.md)                         | Vitest + Playwright instructions        |
| [`docs/deployment.md`](docs/deployment.md)                   | Hosting and deployment guidance         |
| [`docs/status/current-work.md`](docs/status/current-work.md) | Active work and next steps              |

## ✨ Features

### Dashboard View

- **Multi-Mode Dashboard**: Switch between Operations, Value, and Production views
- **KPI Strip**: Real-time metrics with favorites and drill-down capability
- **3D Drill-Down Charts**: Interactive donut and treemap charts with breadcrumb navigation
- **SparklineAreaChart**: Modern SVG-based charts with Bezier curves, 3D depth, and hover scanner
- **Tab-Based Analysis**: WIP by Stage/Customer/Model, Cycle Time Breakdown with bottleneck highlighting
- **Trend Visualization**: Lead time and total value trends with period-over-period comparison
- **Purchase Order Breakdown**: Sortable table with value summaries by PO

### Kanban Board View

- **8-Stage Production Pipeline**: UNSCHEDULED → NOT STARTED → FABRICATION → POWDER COAT → ASSEMBLY → TESTING → SHIPPING → CLOSED
- **Drag-and-Drop Interface**: Move pumps between stages with intuitive drag-and-drop
- **Serial Number Gate**: Stage progression blocked without assigned serial number
- **Smart Card Display**: Model, Serial, PO, Customer, Value, Priority badges, color-coded indicators
- **WIP Limits**: Configurable per-stage limits with visual warnings

### Scheduling View

- **Unscheduled Queue**: Sidebar showing pumps ready for scheduling
- **4-Week Calendar Grid**: Drag-and-drop scheduling with model-specific lead times
- **Stage Timelines**: Visual representation of fabrication, powder coat, assembly, and testing phases
- **Legend Filters**: Quick-filter calendar by production stage
- **Automatic Stage Progression**: Scheduled pumps auto-advance from UNSCHEDULED to NOT STARTED

### Data Management

- **Cloud Persistence**: Supabase integration for shared data across devices
- **Local Storage Fallback**: Automatic fallback when offline
- **Add PO Modal**: Create purchase orders with multi-line item support, customer dropdown, promise date inheritance
- **Bulk CSV Import**: Upload pump data from CSV files
- **Serial Number Control**: Nullable serials with "Unassigned" badge, required for production stages

### Accessibility & Polish

- **Light/Dark Mode**: Full theming with improved contrast ratios
- **Keyboard Navigation**: Full keyboard support for charts and modals
- **ARIA Labels**: Screen reader support throughout
- **Focus Management**: Proper focus trapping and restoration in modals

### Keyboard Shortcuts

PumpTracker Lite includes global keyboard shortcuts for faster navigation and productivity:

| Shortcut                  | Action             | Description                                                            |
| ------------------------- | ------------------ | ---------------------------------------------------------------------- |
| `Ctrl+N` (or `⌘N` on Mac) | Add Purchase Order | Opens the Add PO modal to create a new purchase order                  |
| `Ctrl+F` (or `⌘F` on Mac) | Focus Search       | Focuses the search input in the toolbar for quick filtering            |
| `Ctrl+/` (or `⌘/` on Mac) | Show Shortcuts     | Opens the keyboard shortcuts help modal                                |
| `Escape`                  | Close Modal        | Closes any open modal (Add PO, Settings, Pump Details, Shortcuts Help) |

**Features:**

- Shortcuts work globally across all views (Dashboard, Kanban, Scheduling)
- Smart detection prevents shortcuts from interfering with form inputs (except `Escape`)
- Cross-platform support: `Ctrl` on Windows/Linux, `⌘` on macOS
- Shortcuts state is persisted in localStorage
- Access the shortcuts help modal anytime with `Ctrl+/` to see all available shortcuts

## 🏗️ Architecture

### Technology Stack

| Category      | Technology                           |
| ------------- | ------------------------------------ |
| Frontend      | React 19 + TypeScript                |
| Build         | Vite 7                               |
| Styling       | Tailwind CSS 3.4                     |
| State         | Zustand 5                            |
| Visualization | Recharts + Custom SVG (motion/react) |
| Drag & Drop   | @dnd-kit                             |
| Database      | Supabase                             |
| Testing       | Vitest + Playwright                  |
| Routing       | React Router 7                       |
| Animations    | Framer Motion                        |

### Project Structure

```
src/
├── domain/                 # DDD: Pure business logic
│   ├── production/         # Pump aggregate, Stage/Priority value objects
│   └── sales/              # PurchaseOrder, LineItem entities
├── application/            # Use case orchestration (commands/handlers)
├── infrastructure/         # External concerns (adapters, repositories, event bus)
├── presentation/           # React hooks for domain operations
├── components/
│   ├── charts/             # Custom chart components (SparklineAreaChart, DrilldownDonutChart)
│   ├── dashboard/          # Dashboard views and KPI components
│   ├── kanban/             # Kanban board and pump cards
│   ├── scheduling/         # Calendar grid, backlog dock
│   ├── toolbar/            # Filter bar, Add PO modal
│   └── ui/                 # Reusable primitives (Button, Badge, Card, etc.)
├── adapters/               # Local + Supabase persistence
├── lib/                    # Utilities: formatters, CSV, seed, schedule helpers
├── store.ts                # Zustand store
└── types.ts                # Application types
```

### Domain-Driven Design

The app follows DDD principles with enforced invariants:

- **Stage transitions must be sequential** (QUEUE → FABRICATION → POWDER_COAT → ...)
- **CLOSED is terminal** (no transitions allowed)
- **Serial numbers are immutable** after creation

## 🚀 Getting Started

### Prerequisites

- Node.js 18+
- pnpm

### Installation

```bash
# Clone the repository
git clone <repository-url>
cd pumptracker-lite

# Install dependencies
pnpm install

# Start the development server
pnpm dev

# Open in browser
# Navigate to http://localhost:8080/
```

### Build for Production

```bash
pnpm build
```

### Testing

```bash
# Unit tests
pnpm test

# End-to-end tests
pnpm test:e2e

# E2E with UI
pnpm test:e2e:ui
```

## 📊 Bundle Optimization

The Vite config uses manual chunk splitting to keep bundles efficient. To keep Rollup from emitting a single vendor bundle (which triggered the default 500kB chunk-size warning), dependencies in `node_modules` are routed into purpose-specific chunks:

- `react` – React runtime and JSX helpers
- `charts` – Recharts + date-fns
- `dnd` – @dnd-kit packages
- `ui` – Lucide icons, Sonner toasts, Radix primitives
- `table` – TanStack table utilities
- `supabase` – Supabase client (tree-shaken when unused)
- `vendor` – fallback for any other third-party modules

## 🔧 Environment Variables

For cloud mode (Supabase):

```env
VITE_SUPABASE_URL=your-supabase-url
VITE_SUPABASE_ANON_KEY=your-anon-key
```

## 🎨 Design System

### Color Palette

- **Primary**: Blue (#2563eb)
- **Success**: Green (#16a34a)
- **Warning**: Yellow (#ca8a04)
- **Error**: Red (#dc2626)

### Priority Indicators

| Priority | Color  |
| -------- | ------ |
| Urgent   | Red    |
| Rush     | Orange |
| High     | Yellow |
| Normal   | Blue   |
| Low      | Gray   |

## 📄 License

This project is proprietary software. All rights reserved.

---

**Built with**: React 19 + TypeScript + Tailwind CSS + Zustand + Supabase
