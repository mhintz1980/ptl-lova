# AI Assistant Architecture Retrospective Context

> **Document Purpose:** Comprehensive reference for retrospective review planning
> **Source Documents:** AI_ASSISTANT_ARCHITECTURE.md, current-work.md, 2026-01-21-project-review.md, api/chat.ts
> **Created:** 2026-02-12

---

## 1. Executive Summary

The AI Assistant Architecture for Manufacturing is an enhancement to PumpTracker that enables natural language queries about production operations. The assistant allows users to ask questions in plain language about production progress, historical data, purchase orders, customer information, and KPI reporting.

**Core Value Proposition:**
- Democratize access to production data for non-technical users
- Reduce time spent navigating dashboards for common queries
- Enable proactive insights through automated alerts and summaries

**Technology Stack:**
- Vercel AI SDK (Core + React)
- OpenAI GPT-4o-mini for efficient reasoning
- Supabase (PostgreSQL) for data storage
- React + Zustand frontend

**Current Status:** Phase 1 (Foundation & Aggregations) in progress; implementation exists in `api/chat.ts` with working tools

---

## 2. Original Objectives & Success Metrics

### 2.1 Primary Objectives

| Objective | Description | Success Indicator |
|-----------|-------------|------------------|
| **Natural Language Queries** | Enable users to ask production questions in plain language | Users can query pumps, jobs, capacity without SQL |
| **Production Tracking** | Track product progress through all 7 production stages | Real-time stage information available via chat |
| **Historical Data Access** | Answer questions about past production runs | Direct database queries return historical data |
| **Customer Intelligence** | Query purchase order and customer data | Aggregated customer metrics from pump table |
| **KPI Reporting** | Generate manufacturing KPI reports | On-demand throughput, cycle time, delivery metrics |

### 2.2 Defined Success Metrics/KPIs

| Metric | Target | Measurement Method |
|--------|--------|-------------------|
| **Query Response Time** | < 5 seconds for standard queries | API latency monitoring |
| **Tool Invocation Success Rate** | > 95% | Error logging in chat endpoint |
| **Multi-step Reasoning** | Up to 5 steps allowed | `stepCountIs(5)` configuration |
| **Data Freshness** | Real-time from Supabase | Direct DB queries, no caching layer |
| **Stage Coverage** | All 7 stages (QUEUE → CLOSED) | Tool filters support all stages |

### 2.3 KPIs Tracked by getKPIReport

| KPI | Definition | Data Source |
|-----|------------|-------------|
| **throughput** | Completed pumps over time | pump table timestamps |
| **cycleTime** | Average time from Start → Ship | stage entry/exit timestamps |
| **onTimeDelivery** | % shipped before promise date | promisedate vs actual ship date |
| **wipAging** | Average age of current WIP | last_update timestamp |

---

## 3. Architecture Components & Intended Functionality

### 3.1 System Architecture Overview

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
    POST --> LLM
    LLM --> Stream
    Stream --> ChatHook
    Tools --> getPumps
    Tools --> getJobStatus
    Tools --> getShopCapacity
    Tools --> getCustomerInfo
    Tools --> getKPIReport
    getPumps --> Supabase
    getJobStatus --> Supabase
    getShopCapacity --> Supabase
    getCustomerInfo --> Supabase
    getKPIReport --> Supabase
```

### 3.2 Tool Specifications

#### Core Tools (Existing)

| Tool | Input Schema | Execute Function | Purpose |
|------|--------------|------------------|---------|
| **getPumps** | stage, customer, priority, limit, delayedOnly | `getPumpsInternal()` | Query pumps with optional filters |
| **getJobStatus** | po, serial, includeHistory | `getJobStatusInternal()` | Get job status by PO or serial |
| **getShopCapacity** | date | `getShopCapacityInternal()` | Get shop capacity summary by stage |

#### New Tools (Aggregations)

| Tool | Input Schema | Output Data | Purpose |
|------|--------------|-------------|---------|
| **getCustomerInfo** | customerName, includeRecentOrders | Total active orders, lifetime completed, recent POs, stage breakdown | Customer metrics via pump table aggregation |
| **getKPIReport** | metric, dateRange | Throughput, cycle time, on-time delivery, WIP aging | Manufacturing KPI reports |

### 3.3 Frontend Components (Planned)

```
src/components/ai-chat/
├── ChatInterface.tsx          # Main container
├── MessageList.tsx            # Scrollable list
├── InputArea.tsx              # Text + Voice input
├── messages/
│   ├── UserMessage.tsx
│   ├── AssistantMessage.tsx
│   ├── ToolInvocation.tsx
│   ├── ToolResult.tsx
│   └── ErrorMessage.tsx
└── visualizers/
    ├── PumpTable.tsx
    ├── KpiChart.tsx
    └── CustomerCard.tsx
```

### 3.4 Production Stages Supported

```
QUEUE → FABRICATION → STAGED_FOR_POWDER → POWDER_COAT → ASSEMBLY → SHIP → CLOSED
```

**Completion Percentages:**
- QUEUE: 10%
- FABRICATION: 30%
- STAGED_FOR_POWDER: 45%
- POWDER_COAT: 60%
- ASSEMBLY: 80%
- SHIP: 95%
- CLOSED: 100%

---

## 4. Technical Specifications & Benchmarks

### 4.1 Runtime Configuration

| Setting | Value | Rationale |
|---------|-------|-----------|
| **Runtime** | Node.js (Standard) | Supabase Admin client compatibility |
| **Max Duration** | 60 seconds | Allow for complex aggregations |
| **Regions** | iad1 (US East) | Low latency to Supabase |
| **Model** | gpt-4o-mini | Efficient reasoning, cost-effective |

### 4.2 Security Specifications

| Concern | Mitigation Strategy |
|---------|-------------------|
| **CORS** | Restrict Access-Control-Allow-Origin to production domain (no wildcards) |
| **Rate Limiting** | Vercel built-in Firewall or KV-based counter (IP-based) |
| **Data Leakage** | Explicit field selection in getPumps output schema; no `select *` |
| **Injection** | Zod validation on all inputs; parameterized queries via Supabase SDK |

### 4.3 Input Validation (Zod Schemas)

All tools use Zod for input validation with:
- Enum validation for stages (STAGES constant)
- Optional fields with descriptive metadata
- Range limits (e.g., limit: 1-100)
- Date format validation

### 4.4 Error Handling Patterns

```typescript
// Standard error response format
return { error: 'Descriptive error message' }
// Error logging with context
console.error('[toolName] Error:', error)
// HTTP status codes
400: Invalid request format
500: Chat service error
503: AI service not configured
```

---

## 5. Scope Boundaries

### 5.1 In Scope

**Functional:**
- Natural language queries via chat interface
- Tool-based data retrieval (5 core tools)
- KPI reporting and aggregations
- Customer data summaries (aggregated from pump table)
- Shop capacity and bottleneck analysis
- Multi-step reasoning (up to 5 steps)

**Technical:**
- Vercel AI SDK integration
- OpenAI GPT-4o-mini model
- Supabase database queries
- React frontend with Zustand state management
- Node.js runtime for API compatibility

### 5.2 Out of Scope / Deferred

| Feature | Reason | Impact |
|---------|--------|--------|
| **RAG / pgvector** | Current data volume (hundreds of pumps) doesn't justify complexity | Direct SQL queries sufficient |
| **Cross-Encoder Reranking** | Unnecessary complexity | Simple filtering adequate |
| **Dedicated Customers Table** | Using aggregation reduces schema changes | No customer table migration needed |
| **SaaS Tiered Rate Limiting** | Standard Vercel protection sufficient | No custom rate limiting implementation |
| **Voice Input** | Low priority feature | Future enhancement |
| **Proactive Alerts/Bot** | Phase 3 future work | Morning briefing deferred |
| **Rich UI Components** | Phase 2 work | Tool results currently return JSON |

### 5.3 Known Constraints

- **No dedicated customer table**: Customer data aggregated from `pump` table
- **No pause tracking**: Deprecated fields removed from pump schema
- **Single model**: Only gpt-4o-mini configured (no model switching)
- **No caching layer**: Real-time queries only, no Redis/memoization

---

## 6. Lessons Learned & Identified Issues

### 6.1 Technical Debt Items

| Item | Description | Status |
|------|-------------|--------|
| **Custom useChat implementation** | Limits ability to render rich UI for tool calls | Migration to @ai-sdk/react planned |
| **Deprecated paused fields** | isPaused, pausedAt, pausedStage, totalPausedDays still in schema but mapped to null | Should be removed from PumpRow type |
| **work_hours JSON parsing** | String field requires runtime JSON parsing | Could be normalized to JSONB column |

### 6.2 Past Issues (from current-work.md)

| Issue | Fix Applied | Date |
|-------|------------|------|
| **Data crash (pump_api → pump)** | Corrected table name in supabase.ts | 2026-01-25 |
| **Vercel build failure** | Removed unused filteredPumpsCount prop and imports | 2026-01-25 |
| **Unit test failures** | Added localStorage mock to vitest.setup.ts | 2026-01-18 |
| **TypeScript errors** | Prefixed unused props with underscore in charts | 2026-01-27 |

### 6.3 Architecture Decisions Documented

| Decision | Rationale |
|----------|-----------|
| **Node.js runtime over Edge** | Supabase Admin client compatibility; DB latency dominates anyway |
| **gpt-4o-mini over larger model** | Cost efficiency; reasoning requirements are straightforward |
| **No RAG implementation** | Data volume doesn't justify complexity; direct SQL faster |
| **Aggregation over customer table** | Avoid schema migration; current volume manageable |

---

## 7. Resource & Timeline Context

### 7.1 Implementation Phases

| Phase | Goal | Status |
|-------|------|--------|
| **Phase 1: Foundation & Aggregations** | Robust backend tools without new infrastructure | In Progress |
| **Phase 2: Frontend Migration & Polish** | Rich, interactive chat experience | Planned |
| **Phase 3: Advanced Analytics** | Proactive insights (Morning Briefing, Alerts) | Future |

### 7.2 Phase 1 Tasks (Current Focus)

| Task | Status |
|------|--------|
| Migrate api/chat.ts to Node.js config | Implementation exists |
| Implement getCustomerInfo (aggregation) | Implementation exists in api/tools/customer.ts |
| Implement getKPIReport (aggregation) | Implementation exists in api/tools/kpi.ts |
| Remove includePaused from getPumps | Done (deprecated field removed) |

### 7.3 Dependencies

| Dependency | Purpose | Status |
|------------|---------|--------|
| @ai-sdk/react | Vercel AI SDK React hooks | Not yet installed |
| @ai-sdk/openai | OpenAI provider | Installed |
| zod | Schema validation | Installed |
| supabase-admin | Database access | Implementation exists |

### 7.4 Test Status (from current-work.md)

- **Unit Tests:** Passing (317 tests)
- **Build:** Passing
- **Test Fixes Applied:** 2026-01-18 (localStorage mock, component fixes)

---

## 8. Risk Considerations

### 8.1 Technical Risks

| Risk | Impact | Mitigation |
|------|--------|------------|
| **OpenAI API cost** | Budget overruns with high usage | gpt-4o-mini is cost-efficient; rate limiting available |
| **Supabase latency** | Slow query response | Direct queries; no caching layer (accepted trade-off) |
| **Schema changes** | Tool breakage if pump table schema changes | Zod validation at boundaries; explicit field selection |
| **Model deprecation** | gpt-4o-mini unavailable | Abstract to provider interface; swap model if needed |

### 8.2 Security Risks

| Risk | Impact | Mitigation |
|------|--------|------------|
| **Prompt injection** | AI tricked into unauthorized actions | System prompt constrains behavior; tool permissions fixed |
| **Data leakage** | Sensitive pump data exposed | Explicit field selection; no select * queries |
| **Unauthorized access** | Chat endpoint accessed without auth | Vercel authentication layer; RLS on Supabase |

### 8.3 Operational Risks

| Risk | Impact | Mitigation |
|------|--------|------------|
| **Tool misuse** | Users asking ineffective questions | System prompt guides query patterns |
| **Tool complexity** | LLM fails to invoke correct tool | Limited to 5 tools; clear descriptions |
| **Error propagation** | Database errors exposed to users | Structured error handling; user-friendly messages |

---

## 9. Key Files & References

| File | Purpose |
|------|---------|
| `docs/plans/AI_ASSISTANT_ARCHITECTURE.md` | Primary architecture document |
| `api/chat.ts` | Chat endpoint implementation (453 lines) |
| `api/tools/schemas.ts` | Zod input/output schemas |
| `api/tools/customer.ts` | Customer aggregation tool |
| `api/tools/kpi.ts` | KPI reporting tool |
| `docs/status/current-work.md` | Current project status |
| `docs/plans/2026-01-21-project-review.md` | Review implementation plan |

---

## 10. Retrospective Review Areas

Based on the above context, the retrospective should evaluate:

1. **Technical Performance**
   - API response times vs. 5-second target
   - Tool invocation success rates
   - Error handling effectiveness

2. **Development Process**
   - Phase 1 completion against planned tasks
   - Quality of Zod schema validation
   - Code organization and modularity

3. **User Experience**
   - Natural language query effectiveness
   - Tool selection accuracy by LLM
   - Error message clarity

4. **Architecture Decisions**
   - Node.js runtime decision (correct?)
   - gpt-4o-mini model choice (adequate?)
   - No RAG decision (still valid?)

5. **Scope Management**
   - Deferred features status (still valid?)
   - Technical debt items addressed?
   - Constraints still appropriate?

6. **Risk Mitigation**
   - Security measures implemented?
   - Error handling comprehensive?
   - Operational monitoring in place?

---

*Document generated for AI Assistant Architecture retrospective planning. All information sourced from project documentation and implementation files.*
