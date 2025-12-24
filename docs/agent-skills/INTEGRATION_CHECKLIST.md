# Agent Skills Integration Checklist

Quick reference for tracking integration progress. For details, see `integration-plan.md`.

---

## Phase 1: Foundational Context Engineering ✅ COMPLETE

### 1.1 Context Fundamentals Integration

- [x] Refactor `GEMINI.md` bootloader
  - [x] Keep first 50 lines as bootloader summary
  - [x] Move detailed architecture to separate files
  - [x] Add explicit context budget guidance
  - [x] Position critical info at attention-favored locations
  
- [x] Create context budget monitor
  - [x] Add token counting guidance to agent instructions
  - [x] Establish 70-80% utilization thresholds
  - [x] Document compaction triggers
  
- [x] Implement file-system-based progressive loading
  - [x] Create index files for major domains
  - [x] Add file metadata summaries
  - [x] Design clear naming conventions

**Target Completion**: End of Week 1  
**Status**: ✅ COMPLETE (2025-12-24)  
**Success Metric**: Bootup context reduced from 557 to ~200 lines (65% reduction)

### 1.2 Context Degradation Awareness

- [x] Add degradation checklist to `AGENTS.md`
  - [x] Warning signs section
  - [x] Self-correction triggers
  - [x] Compaction strategies
  
- [x] Create session state templates
  - [x] Create `/ai_working/session-state.md` template
  - [x] Define structured format (files, decisions, next actions)
  - [x] Add instructions to `AGENTS.md`

**Target Completion**: End of Week 1  
**Status**: ✅ COMPLETE (2025-12-24)  
**Success Metric**: Agents can proactively manage context before degradation

---

## Phase 2: Architectural Patterns ✅ COMPLETE

### 2.1 Tool Design Optimization

- [x] Audit existing scripts
  - [x] Review each script in `scripts/` directory
  - [x] Ensure descriptions answer: what, when, what returns
  - [x] Add response format options
  - [x] Improve error messages for recoverability
  
- [x] Create agent-friendly tool catalog
  - [x] Create `docs/agent-tools.md`
  - [x] Inventory all scripts/workflows
  - [x] Add usage examples and common patterns
  - [x] Document error handling
  
- [x] MCP naming
  - [x] Check if using Model Context Protocol (N/A)
  - [x] Standard naming documented in catalog

**Target Completion**: End of Week 2  
**Status**: ✅ COMPLETE (2025-12-24)  
**Success Metric**: 15+ tools documented, <5% tool call failures expected

### 2.2 Multi-Agent Pattern Documentation

- [x] Document multi-agent use cases
  - [x] Planning + implementation pattern
  - [x] DDD layer specialists
  - [x] Supervisor pattern for refactors
  
- [x] Establish context isolation protocols
  - [x] File-system memory for shared state
  - [x] Handoff protocols via `/ai_working/handoff.md`
  - [x] Direct message forwarding pattern

**Target Completion**: End of Week 2  
**Status**: ✅ COMPLETE (2025-12-24)  
**Success Metric**: 3 patterns documented, protocols established

---

## Phase 3: Operational Excellence 📅 PLANNED

### 3.1 Context Optimization

- [ ] Implement compaction strategies
  - [ ] Create summarization templates
  - [ ] Define what to preserve vs. discard
  - [ ] Test on long conversation sessions
  
- [ ] Observation masking patterns
  - [ ] Replace long outputs with references
  - [ ] Mask test outputs after verification
  - [ ] Keep recent/critical info unmasked
  
- [ ] Cache-friendly documentation
  - [ ] Place stable content first
  - [ ] Remove timestamps from docs
  - [ ] Ensure consistent formatting

**Target Completion**: End of Week 4  
**Success Metric**: 50-70% token reduction via compaction

### 3.2 Evaluation Framework

- [ ] Define quality rubric
  - [ ] Factual accuracy (0.0-1.0)
  - [ ] Completeness (0.0-1.0)
  - [ ] Code quality (0.0-1.0)
  - [ ] Tool efficiency (0.0-1.0)
  - [ ] Process quality (0.0-1.0)
  
- [ ] Create test task set
  - [ ] Simple tasks (1-2 tools, single file)
  - [ ] Medium tasks (3-5 tools, 2-3 files)
  - [ ] Complex tasks (many tools, cross-layer)
  - [ ] Very complex (extended reasoning, coordination)
  
- [ ] Build evaluation pipeline
  - [ ] Human evaluation template
  - [ ] LLM-as-judge for factual checks
  - [ ] Tracking in `docs/agent-performance/`
  
- [ ] Establish baselines
  - [ ] Token usage per task type
  - [ ] Time to completion
  - [ ] Error rates and recovery

**Target Completion**: End of Week 5-6  
**Success Metric**: Rubric applied to 10+ tasks, baselines established

---

## Phase 4: Memory and Knowledge 🔮 FUTURE

### 4.1 Session Memory

- [ ] File-system-as-memory
  - [ ] Create `/ai_working/memory/` directory
  - [ ] Entity tracking templates
  - [ ] Temporal validity (date-stamped)
  
- [ ] Memory retrieval patterns
  - [ ] Pre-task memory check instructions
  - [ ] Post-discovery logging protocol
  - [ ] Just-in-time loading guidance

**Target Completion**: Month 2  
**Success Metric**: Agents reference prior learnings >50% on similar tasks

### 4.2 Knowledge Graph (Aspirational)

- [ ] Design entity relationship map
  - [ ] Core entities (Pump, Order, Stage, Priority)
  - [ ] Relationships (aggregates, value objects, events)
  - [ ] Temporal tracking

**Target Completion**: Month 3+  
**Success Metric**: Documentation complete (implementation optional)

---

## Quick Wins Tracker 🎯

### High Impact, Low Effort (Phase 1 - COMPLETE ✅)

- [x] **Progressive Disclosure** (2-3 hours, 60% bootup reduction) ✅
- [x] **Session State Tracking** (1 hour, complete multi-turn tasks) ✅
- [x] **Context Budget Awareness** (1 hour, prevent degradation) ✅
- [x] **Context Degradation Recovery** (part of Phase 1) ✅

### Medium Impact, Medium Effort (Do Second)

- [ ] **Compaction Strategies** (3-4 hours, 50% token reduction)
- [ ] **Evaluation Rubric** (2-3 hours, measure progress)
- [ ] **Memory Patterns** (3-4 hours, cross-session knowledge)

### High Impact, High Effort (Do Third)

- [ ] **Full Evaluation Pipeline** (6-8 hours, continuous improvement)
- [ ] **Multi-Agent Prep** (4-5 hours, future scaling)

---

## Integration with Claude Code Terminal

- [ ] Create `.claude/agent-instructions.md` (if supported)
- [ ] Symlink key skills to `.claude/skills/`
  - [ ] context-fundamentals
  - [ ] tool-design
  - [ ] evaluation
- [ ] Establish `/ai_working/memory/` directory
- [ ] Create session template

---

## Success Metrics Dashboard

| Metric | Baseline | Current | Target | Status |
|--------|----------|---------|--------|--------|
| Bootup context size | 557 lines | ~200 lines | <500 lines | 🟢 |
| Token usage per task | TBD | TBD | -30% | 🔴 |
| Tool call error rate | TBD | TBD | <5% | 🔴 |
| Session extension | ~10 turns | TBD | ~30 turns | 🟡 |
| Task completion rate | TBD | TBD | +20% | 🔴 |
| Context degradation incidents | Baseline | Will track | -50% | 🟡 |

🔴 Not started | 🟡 Infrastructure ready | 🟢 Complete

---

## Files to Create

- [ ] `/ai_working/session-state.md` (template)
- [ ] `/ai_working/handoff.md` (template)
- [ ] `/ai_working/memory/domain-patterns.md`
- [ ] `/ai_working/memory/gotchas.md`
- [ ] `docs/agent-tools.md`
- [ ] `docs/agent-performance/README.md`
- [ ] `docs/agent-performance/task-evaluations.md`
- [ ] `.claude/agent-instructions.md` (if applicable)

## Files to Modify

- [ ] `GEMINI.md` (progressive disclosure refactor)
- [ ] `AGENTS.md` (context budget, degradation awareness)
- [ ] Scripts in `scripts/` (improved descriptions)

---

## Notes

- All integration work affects **documentation only**, not production code
- Changes are **reversible** - easy to roll back if needed
- Focus on **measuring impact** - track metrics before/after
- **Iterate based on results** - adjust strategies that don't work

---

**Last Updated**: 2025-12-24  
**Phase**: 1 (Foundational Context Engineering)  
**Next Milestone**: End of Week 1 (Progressive Disclosure + Session State)
