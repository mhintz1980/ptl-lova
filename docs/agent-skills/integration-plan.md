# Agent Skills Integration Plan for PumpTracker Lite

## Executive Summary

This plan outlines the integration of Agent Skills for Context Engineering principles into the PumpTracker Lite project and Claude Code IDE configuration. The agent-skills collection provides battle-tested patterns for context management, multi-agent architectures, tool design, memory systems, and evaluation frameworks that will significantly improve AI agent effectiveness when working on this codebase.

## Current State Analysis

### What We Have

1. **Project Documentation**
   - `GEMINI.md` - Primary agent bootloader and context injection
   - `AGENTS.md` - Repository operating manual and constitution
   - `docs/` - Comprehensive architecture, status tracking, and process documentation
   - DDD architecture with clean domain/application/infrastructure layers

2. **Agent Skills Collection** (`docs/agent-skills/`)
   - 8 comprehensive skills covering context engineering fundamentals
   - Platform-agnostic patterns applicable to any agent system
   - Examples and practical implementation guidance
   - Focused on maximizing agent effectiveness through context curation

### Gap Analysis

The current project has excellent domain documentation but lacks:

1. **Context Engineering Awareness** - No explicit guidance on context budget management
2. **Progressive Disclosure Patterns** - Documentation loaded upfront rather than just-in-time
3. **Tool Design Principles** - Agent interaction with the codebase could be optimized
4. **Evaluation Framework** - No systematic evaluation of agent performance on tasks
5. **Memory Systems** - No long-term knowledge persistence across sessions

---

## Integration Checklist

### Phase 1: Foundational Context Engineering (Priority: HIGH)

#### 1.1 Context Fundamentals Integration

**Target**: Optimize how agents consume project documentation

- [ ] **Refactor `GEMINI.md`** to use progressive disclosure
  - Keep 50-line bootloader section (current First 5 Minutes)
  - Move detailed architecture to separate files with clear headers
  - Add explicit context budget guidance
  - Position critical information at attention-favored locations (beginning/end)

- [ ] **Create Context Budget Monitor**
  - Add token counting guidance to agent instructions
  - Establish 70-80% utilization thresholds for compaction triggers
  - Document when to load detailed docs vs. relying on summaries

- [ ] **Implement File-System-Based Progressive Loading**
  - Create lightweight index files for each major domain (domain/, infrastructure/, presentation/)
  - Add file metadata summaries (size, complexity, last modified)
  - Design clear naming conventions indicating file purpose

**Success Metrics**:
- Agent bootup reads <500 lines initially
- Full context available on-demand
- 30-50% reduction in tokens consumed during typical tasks

#### 1.2 Context Degradation Awareness

**Target**: Help agents recognize when context is becoming problematic

- [ ] **Add Degradation Checklist to `AGENTS.md`**
  - Warning signs: repeated errors, forgetting earlier decisions, confused tool usage
  - Self-correction triggers: "Review recent conversation history", "Summarize current task state"
  - Compaction strategies: preserve decisions, active files, next steps

- [ ] **Create Session State Templates**
  - `/ai_working/session-state.md` template for tracking task progress
  - Structured format: files touched, decisions made, next actions
  - Agents update this file to prevent context loss

**Success Metrics**:
- Agents proactively manage context before degradation
- Fewer instances of "lost-in-middle" failures
- Improved completion of multi-turn tasks

---

### Phase 2: Architectural Patterns (Priority: MEDIUM)

#### 2.1 Tool Design Optimization

**Target**: Improve how agents interact with project workflows and scripts

- [ ] **Audit Existing Scripts Against Tool Design Principles**
  - Review `scripts/` directory for tool-like utilities
  - Ensure descriptions answer: what, when, what returns
  - Add response format options where appropriate
  - Improve error messages for agent recoverability

- [ ] **Create Agent-Friendly Tool Catalog**
  - `docs/agent-tools.md` - Inventory of available scripts/workflows
  - Clear descriptions following consolidation principle
  - Usage examples and common patterns
  - Error handling guidance

- [ ] **Implement MCP Tool Naming Best Practices**
  - If using Model Context Protocol, ensure fully qualified tool names
  - Format: `ServerName:tool_name`
  - Document in agent instructions

**Success Metrics**:
- <5% tool call failures due to ambiguous descriptions
- Agents select correct tools on first attempt >90% of time
- Error recovery without human intervention increases

#### 2.2 Multi-Agent Pattern Documentation

**Target**: Prepare for potential multi-agent workflows (future-proofing)

- [ ] **Document Potential Multi-Agent Use Cases**
  - Planning agent + Implementation agent pattern
  - Domain-specific specializations (DDD layer experts)
  - Supervisor pattern for complex refactors

- [ ] **Establish Context Isolation Protocols**
  - File-system memory for sharing state between agent sessions
  - Handoff protocols via `/ai_working/handoff.md`
  - Prevent "telephone game" with direct message forwarding

**Note**: This is preparatory work; actual multi-agent implementation is out of scope for Phase 2.

**Success Metrics**:
- Documentation exists for future multi-agent expansion
- Clear boundaries defined for when to escalate vs. partition work

---

### Phase 3: Operational Excellence (Priority: MEDIUM)

#### 3.1 Context Optimization

**Target**: Extend effective agent capacity for complex tasks

- [ ] **Implement Compaction Strategies**
  - Create summarization templates for completed work
  - Preserve: files touched, decisions made, next steps
  - Discard: verbose tool outputs, early conversation turns

- [ ] **Observation Masking Patterns**
  - Replace long file contents with references after initial review
  - Mask test outputs after verification
  - Keep recent outputs and critical information unmasked

- [ ] **Cache-Friendly Documentation Structure**
  - Place stable content first (system prompts, core rules)
  - Avoid timestamps in agent-facing docs
  - Consistent formatting across sessions

**Success Metrics**:
- 50-70% token reduction via compaction
- Agent sessions extend 2-3x longer without degradation
- Sub-5% quality loss from optimization

#### 3.2 Evaluation Framework

**Target**: Systematically measure and improve agent performance

- [ ] **Define Quality Rubric for Agent Work**
  - **Factual Accuracy**: Claims match codebase reality (0.0-1.0)
  - **Completeness**: Requirements fully addressed (0.0-1.0)
  - **Code Quality**: Follows project conventions (0.0-1.0)
  - **Tool Efficiency**: Right tools, reasonable calls (0.0-1.0)
  - **Process Quality**: Follows AGENTS.md workflow (0.0-1.0)

- [ ] **Create Test Task Set**
  - **Simple**: "Add a new constant to stage-constants.ts" (single file, known pattern)
  - **Medium**: "Implement a new value object in domain layer" (2-3 files, DDD pattern)
  - **Complex**: "Add a new feature with domain logic, UI component, tests" (multi-file, cross-layer)
  - **Very Complex**: "Refactor a subsystem while maintaining backward compatibility" (many files, coordination)

- [ ] **Build Evaluation Pipeline**
  - Template for human evaluation of completed tasks
  - LLM-as-judge for factual correctness checks
  - Track metrics over time in `docs/agent-performance/`

- [ ] **Establish Performance Baselines**
  - Current token usage per task type
  - Current time to completion
  - Current error rates and recovery patterns

**Success Metrics**:
- Evaluation rubric applied to 10+ tasks
- Baseline metrics established
- Performance trends tracked over time
- 20%+ improvement in efficiency after optimizations

---

### Phase 4: Memory and Knowledge Systems (Priority: LOW)

#### 4.1 Session Memory

**Target**: Enable agents to persist knowledge across sessions

- [ ] **File-System-as-Memory Implementation**
  - `/ai_working/memory/` for session-persistent notes
  - Entity tracking: components, patterns, gotchas discovered
  - Temporal validity: date-stamped learnings

- [ ] **Create Memory Retrieval Patterns**
  - "Before starting a domain task, check `/ai_working/memory/domain-patterns.md`"
  - "After discovering a gotcha, log it to memory for future agents"
  - Just-in-time loading based on task context

**Success Metrics**:
- Agents reference prior learnings >50% of time on similar tasks
- Reduced time on repeated tasks by 20-30%
- Cross-session knowledge accumulation visible

#### 4.2 Knowledge Graph (Aspirational)

**Target**: Structured knowledge about codebase relationships

- [ ] **Design Entity Relationship Map**
  - Core entities: Pump, Order, Stage, Priority
  - Relationships: aggregates, value objects, events
  - Temporal tracking: when patterns established, when changed

**Note**: Full knowledge graph is out of scope; this is documentation only.

---

## Implementation Priorities

### Immediate (This Week)
1. Refactor `GEMINI.md` for progressive disclosure
2. Add context budget guidance to `AGENTS.md`
3. Create degradation awareness checklist
4. Audit scripts for tool design principles

### Short-Term (Next 2 Weeks)
1. Implement session state templates
2. Create agent-friendly tool catalog
3. Build compaction strategies
4. Define evaluation rubric

### Medium-Term (Next Month)
1. Establish evaluation pipeline
2. Collect baseline metrics
3. Implement file-system memory patterns
4. Document multi-agent preparation

### Long-Term (Future)
1. Track performance improvements
2. Iterate on optimization strategies
3. Consider knowledge graph implementation

---

## Integration with Claude Code IDE

### Terminal Agent Instructions

Create `.claude/agent-instructions.md` (if supported) or add to workspace settings:

```markdown
# Claude Code Agent Instructions for PumpTracker Lite

## Context Engineering Principles

1. **Progressive Disclosure**: Always read `GEMINI.md` first for the map, then load specific docs on-demand
2. **Context Budget**: Monitor token usage; trigger compaction at 70-80% utilization
3. **Attention Management**: Place critical decisions at message boundaries (start/end)
4. **Tool Selection**: Follow consolidation principle - if uncertain which tool, escalate to user

## Quality Rubric

Every task completion should score ≥0.7 on:
- Factual accuracy (matches codebase)
- Completeness (requirements met)
- Code quality (follows conventions)
- Tool efficiency (right tools, minimal calls)
- Process quality (follows AGENTS.md)

## Memory Patterns

- Before complex tasks: Check `/ai_working/memory/` for prior learnings
- After discovering patterns: Log to memory for future sessions
- Session state: Update `/ai_working/session-state.md` at major milestones

## Degradation Self-Check

If experiencing:
- Repeated errors on same pattern
- Forgetting earlier decisions
- Confused tool usage

Then:
1. Summarize current task state to `/ai_working/session-state.md`
2. Review only recent conversation history
3. Reload only active file contexts
4. Ask user if compaction needed
```

### Workspace-Level Skills

If Claude Code supports workspace skills, symlink or copy key skills:

```bash
# From project root
mkdir -p .claude/skills/
ln -s docs/agent-skills/skills/context-fundamentals .claude/skills/
ln -s docs/agent-skills/skills/tool-design .claude/skills/
ln -s docs/agent-skills/skills/evaluation .claude/skills/
```

---

## Success Metrics Summary

| Metric | Baseline (Current) | Target (Post-Integration) | Timeline |
|--------|-------------------|---------------------------|----------|
| Agent bootup context size | ~1500 lines | <500 lines | Week 1 |
| Token usage per task | TBD | -30% | Month 1 |
| Tool call error rate | TBD | <5% | Month 1 |
| Task completion without intervention | TBD | +20% | Month 2 |
| Context degradation incidents | TBD | -50% | Month 1 |
| Session extension capacity | ~10 turns | ~30 turns | Month 1 |

---

## Risks and Mitigations

| Risk | Impact | Mitigation |
|------|--------|------------|
| Over-optimization reduces clarity | HIGH | Measure quality rubric scores; revert if <0.7 |
| Progressive disclosure too aggressive | MEDIUM | Keep critical paths in bootloader; detailed only on-demand |
| Evaluation overhead slows development | LOW | Evaluate sample tasks only; full evaluation quarterly |
| Memory patterns ignored by agents | MEDIUM | Explicit instructions in AGENTS.md; periodic audits |

---

## Next Steps

1. **Review this plan** with project stakeholders
2. **Prioritize phases** based on immediate needs
3. **Assign ownership** for each integration task
4. **Establish timeline** for Phase 1 completion
5. **Create tracking mechanism** in `docs/status/current-work.md`

---

## Appendix: Skill Reference Map

| When Agent Needs... | Reference Skill | Location |
|---------------------|----------------|----------|
| Context management basics | context-fundamentals | `docs/agent-skills/skills/context-fundamentals/` |
| Recognize context degradation | context-degradation | `docs/agent-skills/skills/context-degradation/` |
| Optimize context usage | context-optimization | `docs/agent-skills/skills/context-optimization/` |
| Design better tools | tool-design | `docs/agent-skills/skills/tool-design/` |
| Multi-agent coordination | multi-agent-patterns | `docs/agent-skills/skills/multi-agent-patterns/` |
| Memory architecture | memory-systems | `docs/agent-skills/skills/memory-systems/` |
| Build evaluations | evaluation | `docs/agent-skills/skills/evaluation/` |

---

**Version**: 1.0  
**Created**: 2025-12-24  
**Last Updated**: 2025-12-24  
**Next Review**: 2025-01-24  
**Owner**: To Be Assigned
