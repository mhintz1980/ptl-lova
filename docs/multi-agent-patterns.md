# Multi-Agent Patterns for PumpTracker Lite

This document describes multi-agent architectures that can be applied to PumpTracker Lite for handling complex tasks that exceed single-agent context limits. These patterns are **preparatory documentation** — actual multi-agent implementation is optional and based on need.

---

## When to Use Multi-Agent Patterns

Use multi-agent architectures when:

- ✅ Single-agent context limits constrain task complexity (>80% utilization)
- ✅ Task naturally decomposes into parallel subtasks
- ✅ Different subtasks require different expertise (domain vs. UI vs. infrastructure)
- ✅ Large refactors span multiple architectural layers
- ✅ Need specialized agents for each DDD bounded context

**Don't use multi-agent when**:
- ❌ Task fits comfortably in single context
- ❌ Coordination overhead exceeds parallelization benefit
- ❌ Sequential dependencies prevent parallel work

---

## Pattern 1: Planning + Implementation (Supervisor)

### Overview

One agent plans the work, another implements it. The **planning agent** focuses on analysis and design, while the **implementation agent** focuses on code changes.

### Architecture

```
User Request → Planning Agent → Implementation Plan → Implementation Agent → Code Changes
```

### When to Use

- Complex features requiring upfront design
- Refactors where planning and execution are distinct phases
- Tasks where implementation details unclear until analysis complete

### Protocol

**Planning Agent**:
1. Reads `docs/status/current-work.md` for context
2. Analyzes codebase (architecture, patterns, constraints)
3. Creates implementation plan in `docs/plans/<feature>.md`
4. Writes handoff to `/ai_working/handoff.md`
5. Notifies user for approval

**Implementation Agent**:
1. Reads handoff from `/ai_working/handoff.md`
2. Reads implementation plan
3. Implements changes following plan
4. Updates `/ai_working/session-state.md` with progress
5. Notifies user when complete

### Example Use Case

> **Task**: "Add a new aggregate root to the domain layer"
>
> **Planning Agent**:
> - Analyzes existing domain structure
> - Defines entity relationships and invariants
> - Creates DDD implementation plan
> - Documents integration points
>
> **Implementation Agent**:
> - Creates entity, value objects, events
> - Implements repository interface
> - Adds tests
> - Wires to application layer

---

## Pattern 2: Domain Layer Specialists (Multi-Expert)

### Overview

Each agent specializes in a specific DDD bounded context or architectural layer. Agents hand off work when crossing boundaries.

### Architecture

```
User Request → Router Agent
                ├→ Domain Agent (Pure business logic)
                ├→ Application Agent (Use cases)
                ├→ Infrastructure Agent (Persistence, APIs)
                └→ Presentation Agent (React components)
```

### When to Use

- Large features spanning multiple layers
- Domain logic changes with UI/infrastructure implications
- Enforcing strict DDD boundaries

### Protocol

**Handoff Rules**:
- Domain agent **never** imports from application/infrastructure/presentation
- Application agent orchestrates domain + infrastructure
- Presentation agent consumes application hooks

**Context Isolation**:
- Each agent maintains separate `/ai_working/session-state-<layer>.md`
- Shared state via `/ai_working/memory/domain-patterns.md`
- Handoff via `/ai_working/handoff-<from>-to-<to>.md`

### Example Use Case

> **Task**: "Add serial number validation with UI display"
>
> **Domain Agent** (First):
> - Adds serial validation to Pump entity
> - Creates SerialAssignedEvent
> - Updates domain tests
> - Hands off to Application Agent
>
> **Application Agent** (Second):
> - Creates AssignSerialCommand
> - Implements command handler
> - Hands off to Presentation Agent
>
> **Presentation Agent** (Third):
> - Creates SerialNumberField component
> - Wires to usePumpCommands hook
> - Adds E2E test

---

## Pattern 3: Parallel Research + Synthesis (Swarm)

### Overview

Multiple research agents work in parallel on different aspects, then a synthesis agent combines findings.

### Architecture

```
User Question → [Research Agent A, Research Agent B, Research Agent C] → Synthesis Agent → Answer
```

### When to Use

- Analyzing large codebase sections
- Researching multiple competing approaches
- Gathering information from diverse sources

### Protocol

**Research Agents (Parallel)**:
1. Each assigned specific scope (e.g., domain layer analysis, UI patterns, infrastructure)
2. Work independently in isolated contexts
3. Write findings to `/ai_working/research/<agent-name>.md`
4. No cross-communication needed

**Synthesis Agent**:
1. Reads all research outputs
2. Identifies patterns and contradictions
3. Creates unified recommendation
4. Presents to user

### Example Use Case

> **Task**: "How should we implement customer grouping across the app?"
>
> **Research Agent A** (Domain):
> - Analyzes Customer entity
> - Checks for existing grouping patterns
> - Documents domain constraints
>
> **Research Agent B** (UI):
> - Reviews dashboard components
> - Identifies grouping UI patterns
> - Notes user experience considerations
>
> **Research Agent C** (Data):
> - Checks Zustand store structure
> - Reviews data flow patterns
> - Documents performance concerns
>
> **Synthesis Agent**:
> - Combines findings
> - Proposes unified approach
> - Creates implementation plan

---

## Context Isolation Mechanisms

### File-System Memory

Use `/ai_working/` for shared state between agents:

```
/ai_working/
├── handoff.md                    # Current handoff message
├── handoff-domain-to-app.md      # Specific layer handoff
├── session-state-domain.md       # Domain agent state
├── session-state-ui.md           # UI agent state
├── research/                     # Research agent outputs
│   ├── domain-analysis.md
│   ├── ui-patterns.md
│   └── data-flow.md
└── memory/                       # Shared knowledge
    ├── domain-patterns.md
    ├── gotchas.md
    └── conventions.md
```

### Handoff Protocol

**Handoff Template** (`/ai_working/handoff.md`):

```markdown
# Agent Handoff

## From
Agent: [Planning | Domain | Application | Infrastructure | Presentation]
Completed: [Date/Time]

## To
Agent: [Next agent]
Task: [Specific task for next agent]

## Context
[Summary of work completed]

## Files Changed
- `file1.ts` - [What changed and why]
- `file2.tsx` - [What changed and why]

## Next Steps
- [ ] Step 1 for next agent
- [ ] Step 2 for next agent

## Important Decisions
1. Decision 1: [Rationale]
2. Decision 2: [Rationale]

## Blockers / Questions
[Any issues that need resolution]
```

### Direct Message Forwarding

To avoid "telephone game" problem where supervisors paraphrase incorrectly:

- Sub-agents write final responses directly
- Supervisor forwards without modification
- Preserves fidelity of technical details

---

## PumpTracker-Specific Use Cases

### Use Case 1: Full-Stack Feature

**Task**: Add new pump status tracking feature

**Agents**:
1. **Planning Agent**: Analyzes requirements, creates implementation plan
2. **Domain Agent**: Adds PumpStatus value object, events, invariants
3. **Application Agent**: Creates status change command/handler
4. **Infrastructure Agent**: Updates repository, migrations
5. **Presentation Agent**: Creates StatusBadge component, wires to hooks
6. **Testing Agent**: Adds E2E workflow test

**Coordination**: Sequential handoffs via `/ai_working/handoff-<layer>.md`

### Use Case 2: Large Refactor

**Task**: Convert scheduling logic from calendar-centric to forecast-hint model

**Agents**:
1. **Analysis Agent**: Documents current state, identifies all mutation points
2. **Domain Agent**: Refactors domain model (parallel can work on entities)
3. **Application Agent**: Updates command handlers (depends on domain)
4. **UI Agent**: Updates components to use forecast hints (parallel with infrastructure)
5. **Infrastructure Agent**: Updates persistence layer (parallel with UI)
6. **Verification Agent**: Runs all tests, checks Constitution compliance

**Coordination**: Hybrid (some parallel, some sequential)

### Use Case 3: Troubleshooting Regression

**Task**: Debug production issue where data not persisting

**Agents**:
1. **Adapter Research Agent**: Analyzes `supabase.ts` and `local.ts`
2. **Store Research Agent**: Analyzes Zustand store and persistence
3. **Component Research Agent**: Checks UI mutation calls
4. **Test Research Agent**: Reviews test coverage gaps
5. **Synthesis Agent**: Identifies root cause, creates fix plan

**Coordination**: Parallel research → single synthesis

---

## Failure Modes & Mitigations

### Failure: Supervisor Context Overload

**Problem**: Supervisor accumulates context from all sub-agents  
**Mitigation**: 
- Sub-agents write to files, supervisor reads summaries only
- Use progressive disclosure (supervisor loads details on-demand)
- Implement context budget monitoring (80% trigger)

### Failure: Coordination Overhead

**Problem**: Agent handoffs consume more tokens than single-agent work  
**Mitigation**:
- Only use multi-agent for truly complex tasks
- Minimize handoff messages (essential info only)
- Batch related work to reduce handoffs

### Failure: Context Clash

**Problem**: Multiple agents make conflicting assumptions  
**Mitigation**:
- Single source of truth in plan document
- Memory files for shared patterns
- Explicit conflict resolution protocol

### Failure: Error Propagation

**Problem**: Errors in one agent's output break downstream agents  
**Mitigation**:
- Validation checkpoints between agents
- Constitution gate runs after each agent
- Rollback protocol if agent fails

---

## Evaluation Criteria

Use these to decide if multi-agent pattern succeeded:

| Criterion | Target | Measurement |
|-----------|--------|-------------|
| Token efficiency | <15× single-agent | Compare total tokens used |
| Completion time | <50% longer than single | Wall-clock time |
| Quality | ≥ single-agent | Pass all tests + Constitution gate |
| Context utilization | <80% per agent | Peak context usage |
| Handoff overhead | <20% of total work | Tokens in handoff messages |

---

## Getting Started with Multi-Agent

### Step 1: Identify Need

Ask:
- Is task too complex for single context?
- Does task decompose naturally?
- Will coordination overhead be justified?

### Step 2: Choose Pattern

- Sequential work with clear phases → **Planning + Implementation**
- Parallel research needed → **Parallel Research + Synthesis**
- Spans DDD boundaries → **Domain Layer Specialists**

### Step 3: Set Up Infrastructure

```bash
# Create handoff directory
mkdir -p /ai_working/handoffs
mkdir -p /ai_working/research

# Create templates
cp docs/agent-skills/templates/handoff.md /ai_working/handoff.md
```

### Step 4: Execute

1. Primary agent starts work
2. Writes handoff when reaching boundary
3. Notifies user for next agent activation
4. User activates next agent with handoff context
5. Repeat until complete

---

## Future Enhancements

**Phase 3+ Possibilities**:
- Automated handoff routing (supervisor picks next agent)
- Agent telemetry (track efficiency metrics)
- Agent specialization templates (pre-configured contexts)
- Quality gates between handoffs (automated validation)

---

**Status**: Preparatory documentation  
**Required**: Phase 1 complete (Context Engineering)  
**Implementation**: Optional, based on task complexity  
**Last Updated**: 2025-12-24
