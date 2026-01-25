# Project: PumpTracker Lite

> **This is your bootloader.** Load detailed docs only as needed.

---

## 🤖 Agent Bootloader / Start Here

**You are working on PumpTracker Lite** — a production management system for tracking pump manufacturing orders.

### 1. The Prime Directive: "Where is the work?"

> [!CAUTION] > **`main` BRANCH IS LIVE IN PRODUCTION WITH REAL USERS.**
> Never push to main. Never merge without explicit approval. If you break main, real users suffer.

**Always** read [`docs/status/current-work.md`](docs/status/current-work.md) **FIRST** in every new conversation.

- It tells you the active branch, deployment status, and the immediate **Next Actions**.
- **Do not** hallucinate next steps. Trust this file.
- **Do not** merge to `main` or run destructive operations without asking.

### 2. The Documentation Map: "Where do I look/write?"

| If you need to...             | Go to...                                                                       |
| :---------------------------- | :----------------------------------------------------------------------------- |
| **Check Rules & Philosophy**  | [`AGENTS.md`](AGENTS.md) (The Constitution)                                    |
| **Track Tasks / Status**      | [`docs/status/current-work.md`](docs/status/current-work.md)                   |
| **Read/Write Design Specs**   | [`docs/plans/`](docs/plans/)                                                   |
| **Find Technical Deep Dives** | [`docs/process/`](docs/process/)                                               |
| **Support Operations**        | [`docs/process/support-operations.md`](docs/process/support-operations.md)     |
| **Learn Agent Skills**        | [`docs/SKILL_INDEX.md`](docs/SKILL_INDEX.md) (Central Registry)                |
| **⚡ Supabase Operations**    | [`claude-code-supabase-skills/`](claude-code-supabase-skills/) ⚠️ **REQUIRED** |
| **Architecture Details**      | [`docs/architecture.md`](docs/architecture.md)                                 |
| **Development Guide**         | [`docs/development.md`](docs/development.md)                                   |
| **Deployment Guide**          | [`docs/deployment.md`](docs/deployment.md)                                     |
| **UI/Component Standards**    | [`docs/DESIGN_SYSTEM.md`](docs/DESIGN_SYSTEM.md)                               |

### 3. Your First 5 Minutes

### 3. Your First 5 Minutes

1.  **Run Preflight**: `npm run preflight`
    - This summarizes status, environment, and relevant skills.
2.  **Context Budget**: Start with <10% utilization.
3.  **Assume Production**: Treat `main` as live.

---

## ⚠️ Important Context

- **Refactor Status**: We recently completed a major "Constitution Refactor" and "DDD implementation".
- **Deployment**: We are in **BETA** (Cloud Mode). Shared data. Do not reset without asking.
- **🧪 Local Dev is Safe**: `pnpm dev` auto-enters **Sandbox Mode** with test data — production is never touched.
- **Key Docs**:
  - Refactor History: [`docs/agents/opus-4.5-refactor-prompt.md`](docs/agents/opus-4.5-refactor-prompt.md)
  - Domain Logic: [`DDD_BLUEPRINT-OPUS.md`](DDD_BLUEPRINT-OPUS.md)

---

## 📦 Quick Reference

### Project Overview

Modern, responsive production management system for pump manufacturing. Built with:

- **Frontend**: React + TypeScript + Vite
- **Styling**: Tailwind CSS
- **State**: Zustand
- **Testing**: Vitest + Playwright
- **Architecture**: DDD with clean domain/application/infrastructure layers

### Tech Stack Summary

- React 18 + TypeScript
- Vite for build tooling
- Zustand for state management
- Tailwind CSS for styling
- Recharts for data visualization
- Vitest for unit/integration testing
- Playwright for E2E testing

### Key Commands

```bash
pnpm install          # Install dependencies
pnpm dev              # Start dev server (http://localhost:8080)
pnpm build            # Build for production
pnpm test             # Run Vitest tests
pnpm test:e2e         # Run Playwright E2E tests
pnpm lint             # Run ESLint
pnpm format           # Run Prettier
```

---

## 🎯 Context Engineering Guidelines

### Progressive Disclosure

### Progressive Disclosure

- **Load this bootloader first**
- **Load detailed docs only when needed**
- **Use Telemetry Header**: All responses MUST start with:  
  `[🎫 <Tokens Used> | 📉 <Context Remaining> | 🛡️ <Confidence Score>]`
- **Use `/ai_working/`** for session state

### Context Budget Management

| Utilization | Action                                                               |
| ----------- | -------------------------------------------------------------------- |
| <70%        | Continue normally                                                    |
| 70-80%      | Review context, summarize if needed                                  |
| 80%+        | **TRIGGER COMPACTION** - Summarize to `/ai_working/session-state.md` |

### Degradation Self-Check

If you experience:

- ❌ Repeated errors on known patterns
- ❌ Forgetting earlier decisions
- ❌ Confused tool usage

Then:

1. Summarize current task state to `/ai_working/session-state.md`
2. Review only recent conversation history
3. Reload only active file contexts
4. Continue with fresh context

---

## 📂 Architecture Quick Reference

**For full details**, load [`docs/architecture.md`](docs/architecture.md) on-demand.

### Core Layers

```
src/
├── domain/           # Pure business logic (DDD)
├── application/      # Use case orchestration
├── infrastructure/   # External concerns (DB, APIs)
└── presentation/     # React components & hooks
```

### Key Concepts

- **Kanban is truth**: The source of record for pump stage
- **Calendar is projection**: Read-only view of schedule forecasts
- **Forecast hints only**: Schedule dates are estimates, not commitments
- **DDD invariants**: Stage transitions sequential, CLOSED is terminal

---

## 🛠️ Development Quick Reference

**For full details**, load [`docs/development.md`](docs/development.md) on-demand.

### Coding Conventions

- Components in `src/components/<feature>/`
- Shared UI in `src/components/ui/`
- Extend `src/store.ts` for state (avoid ad-hoc React state)
- Tailwind for styling; promote reused styles to `src/index.css`
- Follow DDD boundaries: domain → application → infrastructure

### Feature Workflow

1. **Plan** → capture in `docs/plans/`
2. **Update Store** → actions/selectors
3. **Implement UI** → reuse components
4. **Document** → update relevant docs
5. **Test** → Vitest + Playwright

---

## 🚀 Deployment Quick Reference

**For full details**, load [`docs/deployment.md`](docs/deployment.md) on-demand.

**Recommended**: Vercel (auto-deploy from GitHub)  
**Alternatives**: Netlify, AWS S3 + CloudFront, Docker, Traditional servers

```bash
pnpm build    # Builds to dist/
```

---

## 🧠 Agent Memory & Session State

### Session State Tracking

Use `/ai_working/session-state.md` to track multi-turn tasks:

```markdown
## Current Task

<task description>

## Files Touched

- file1.ts (added X, modified Y)
- file2.ts (refactored Z)

## Decisions Made

- Decision 1
- Decision 2

## Next Steps

- [ ] Step 1
- [ ] Step 2
```

### Cross-Session Memory

Use `/ai_working/memory/` for learnings that persist:

- `domain-patterns.md` - DDD patterns and gotchas
- `gotchas.md` - Known issues and workarounds
- `conventions.md` - Project-specific conventions

**Before complex tasks**: Check memory files  
**After discoveries**: Log to memory for future agents

---

## 📊 File Organization

```
/
├── GEMINI.md              # This bootloader (YOU ARE HERE)
├── AGENTS.md              # Constitution and rules
├── docs/
│   ├── architecture.md    # Detailed architecture (load on-demand)
│   ├── development.md     # Dev guide (load on-demand)
│   ├── deployment.md      # Deploy guide (load on-demand)
│   ├── status/            # Task tracking
│   ├── plans/             # Design specs
│   ├── process/           # Process documentation
│   └── agent-skills/      # Context engineering skills
├── src/                   # Application code
├── tests/                 # Vitest + Playwright tests
└── /ai_working/           # Agent session state & memory
    ├── session-state.md   # Current task tracking
    └── memory/            # Cross-session knowledge
```

---

## ✅ Success Criteria for Context Management

- ✅ Bootloader read in <500 lines
- ✅ Detailed docs loaded just-in-time
- ✅ Session state tracked in `/ai_working/`
- ✅ Context compacted at 70-80% utilization
- ✅ Multi-turn tasks complete without context loss

---

**Version**: 2.1 (Added DESIGN_SYSTEM reference)  
**Last Updated**: 2025-12-27  
**Previous Version**: 2.0 (Progressive Disclosure)  
**Token Reduction**: ~65% (from 1500+ tokens to <500 tokens)
