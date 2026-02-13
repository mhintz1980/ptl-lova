# AI Assistant Architecture for Manufacturing

> **Version:** 2.0 (Pragmatic Revision)
> **Status:** Design Draft
> **Date:** 2026-02-11

---

## 1. Executive Summary

This document outlines the architecture for an AI Assistant that enhances PumpTracker's manufacturing operations. The assistant enables natural language queries about production progress, historical data, purchase orders, customer information, and KPI reporting.

**Key Capabilities:**

- Track product progress through production stages
- Answer questions about past production runs via direct database queries
- Query purchase order and customer data (aggregated from `pump` table)
- Generate KPI reports and insights

**Technology Stack:**

- Vercel AI SDK (Core + React)
- OpenAI GPT-4o-mini for efficient reasoning
- Supabase (PostgreSQL) for data storage
- React + Zustand frontend

---

## 2. System Architecture

### 2.1 High-Level Architecture Diagram

```mermaid
flowchart TB
    subgraph Frontend
        UI[React UI]
        ChatHook[useChat (Vercel SDK)]
        MessageRenderer[Message Components]
    end

    subgraph API Layer
        POST[/api/chat]
        Tools[Tool Definitions]
        SystemPrompt[System Prompt]
    end

    subgraph AI Provider
        LLM[OpenAI GPT-4o-mini]
        Stream[Text Stream]
    end

    subgraph Tools Layer
        getPumps[getPumps]
        getJobStatus[getJobStatus]
        getShopCapacity[getShopCapacity]
        getCustomerInfo[getCustomerInfo]
        getKPIReport[getKPIReport]
    end

    subgraph Data Layer
        Supabase[(Supabase DB)]
    end

    UI --> ChatHook
    ChatHook --> POST
    POST --> Tools
    Tools --> getPumps
    Tools --> getJobStatus
    Tools --> getShopCapacity
    Tools --> getCustomerInfo
    Tools --> getKPIReport

    POST --> LLM
    LLM --> Stream
    Stream --> ChatHook

    getPumps --> Supabase
    getJobStatus --> Supabase
    getShopCapacity --> Supabase
    getCustomerInfo --> Supabase
    getKPIReport --> Supabase
```

### 2.2 Component Relationships

```mermaid
flowchart LR
    subgraph Client
        ChatInterface[Chat Interface]
        useChat[useChat Hook]
    end

    subgraph Server
        POST[/api/chat]
        streamText[streamText]
        ToolExecutor[Tool Executor]
    end

    subgraph Tools
        T1[getPumps]
        T2[getJobStatus]
        T3[getShopCapacity]
        T4[getCustomerInfo]
        T5[getKPIReport]
    end

    subgraph Data
        DB[(Supabase)]
    end

    ChatInterface --> useChat
    useChat --> POST
    POST --> streamText
    streamText --> ToolExecutor
    ToolExecutor --> T1
    ToolExecutor --> T2
    ToolExecutor --> T3
    ToolExecutor --> T4
    ToolExecutor --> T5

    T1 --> DB
    T2 --> DB
    T3 --> DB
    T4 --> DB
    T5 --> DB
```

---

## 3. Tool Specifications

### 3.1 Core Tools (Existing & Enhanced)

#### getPumps

**Purpose:** Query pumps with optional filters for stage, customer, priority.

**Input Schema:**

```typescript
const GetPumpsInputSchema = z.object({
  stage: z.enum(STAGES).optional(),
  customer: z.string().optional().describe('Partial customer name match'),
  priority: z.enum(PRIORITIES).optional(),
  limit: z.number().int().min(1).max(100).default(20),
  // Removed: includePaused (Feature deprecated)
  delayedOnly: z
    .boolean()
    .default(false)
    .describe('Filter for pumps past their forecast/promise date'),
})

type GetPumpsInput = z.infer<typeof GetPumpsInputSchema>
```

**Execute Function:** `getPumpsInternal(input)`

#### getJobStatus

**Purpose:** Get job status by PO or serial number.

**Input Schema:**

```typescript
const GetJobStatusInputSchema = z.object({
  po: z.string().optional().describe('Purchase order number'),
  serial: z.number().optional().describe('Serial number'),
  includeHistory: z.boolean().default(false),
})

type GetJobStatusInput = z.infer<typeof GetJobStatusInputSchema>
```

#### getShopCapacity

**Purpose:** Get shop capacity summary showing pumps in progress by stage.

**Input Schema:**

```typescript
const GetShopCapacityInputSchema = z.object({
  date: z.string().date().optional().describe('Defaults to today'),
})
```

### 3.2 New Tools (Aggregations)

#### getCustomerInfo

**Purpose:** Retrieve customer metrics by aggregating pump data.
**Strategy:** Since there is no `customers` table, this tool aggregates distinct customers from the `pump` table.

**Input Schema:**

```typescript
const GetCustomerInfoInputSchema = z.object({
  customerName: z.string().describe('Partial customer name to search for'),
  includeRecentOrders: z.boolean().default(true),
})
```

**Output Data:**

- Total active orders
- Total completed orders (lifetime)
- Recent POs (last 5)
- Breakdown of active pumps by stage

#### getKPIReport

**Purpose:** Generate manufacturing KPI reports from `pump` table timestamps.

**Input Schema:**

```typescript
const GetKPIReportInputSchema = z.object({
  metric: z.enum([
    'throughput', // Completed pumps over time
    'cycleTime', // Avg time from Start -> Ship
    'onTimeDelivery', // % shipped before promise date
    'wipAging', // Avg age of current WIP
  ]),
  dateRange: z
    .object({
      start: z.string().date(),
      end: z.string().date(),
    })
    .optional()
    .describe('Defaults to last 30 days'),
})
```

---

## 4. Frontend Chat Architecture

### 4.1 Migration to Vercel AI SDK React Hooks

The current manual `useChat` implementation limits our ability to render rich UI for tool calls. We will migrate to `@ai-sdk/react`.

**Dependencies:**

- `npm install @ai-sdk/react`

**Implementation Wrapper:**

```typescript
// src/components/ai-chat/ChatProvider.tsx
'use client'

import { useChat } from '@ai-sdk/react'

export function useChatSession() {
  return useChat({
    api: '/api/chat',
    maxSteps: 5, // Allow multi-step reasoning
    onError: (err) => console.error('Chat error:', err),
  })
}
```

### 4.2 Rich UI Components

We will create specific components to render tool results:

**File Structure:**

```
src/components/ai-chat/
├── ChatInterface.tsx          # Main container
├── MessageList.tsx            # Scrollable list
├── InputArea.tsx              # Text + Voice input
├── messages/
│   ├── UserMessage.tsx
│   ├── AssistantMessage.tsx
│   ├── ToolInvocation.tsx     # "Checking status..." spinner
│   ├── ToolResult.tsx         # Render data tables/charts
│   └── ErrorMessage.tsx
└── visualizers/
    ├── PumpTable.tsx          # Result of getPumps
    ├── KpiChart.tsx           # Result of getKPIReport
    └── CustomerCard.tsx       # Result of getCustomerInfo
```

---

## 5. Deployment & Security

### 5.1 Runtime Configuration

**Runtime:** Node.js (Standard)
**Reason:** Compatibility with Supabase Admin client and potential future libraries. Edge Runtime offers minimal benefit given the database latency.

```typescript
// api/chat.ts
export const config = {
  maxDuration: 60, // allow for complex aggregations
  regions: ['iad1'], // US East (N. Virginia)
}
```

### 5.2 Security

| Concern           | Mitigation strategies                                                      |
| ----------------- | -------------------------------------------------------------------------- |
| **CORS**          | Restrict `Access-Control-Allow-Origin` to production domain (no wildcards) |
| **Rate Limiting** | Vercel built-in Firewall or KV-based counter (IP-based)                    |
| **Data Leakage**  | `getPumps` output schema explicitly selects fields; no `select *`          |
| **Injection**     | Zod validation on all inputs; parameterized queries via Supabase SDK       |

---

## 6. Implementation Plan (Phased)

### Phase 1: Foundation & Aggregations (Current Focus)

**Goal:** Robust backend tools without new infrastructure.

1. **Fix:** Migrate `api/chat.ts` to Node.js config.
2. **Tool:** Implement `getCustomerInfo` (aggregation logic).
3. **Tool:** Implement `getKPIReport` (aggregation logic).
4. **Fix:** Remove `includePaused` from `getPumps`.

### Phase 2: Frontend Migration & Polish

**Goal:** Rich, interactive chat experience.

1. **Refactor:** Replace custom `useChat` with `@ai-sdk/react`.
2. **UI:** Create `ToolResult` renderers (tables for pumps, cards for customers).
3. **UI:** Integrate charts for KPI reports.

### Phase 3: Advanced Analytics (Future)

**Goal:** Proactive insights.

1. **Bot:** Daily "Morning Briefing" summary.
2. **Alerts:** "These 5 pumps are at risk of missing promise date."

---

## 7. Removed/Deferred Features

- **RAG / pgvector:** Deferred. Current volume (hundreds of pumps) allows direct SQL queries. Complexity cost > benefit right now.
- **Cross-Encoder Reranking:** Removed. unnecessary complexity.
- **Dedicated Customers Table:** Removed. Using aggregation for now.
- **SaaS Tiered Rate Limiting:** Removed. Using standard Vercel protection.
