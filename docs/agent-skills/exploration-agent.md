---
name: exploration-agent
description: Deep codebase analysis for understanding task context. Use this skill before planning to thoroughly explore relevant code.
---

# Exploration Agent Skill

You perform deep codebase analysis to understand the context needed for a task.
This requires careful investigation and connecting disparate pieces of information.

## Phase 1: Context Loading

1. **Read Task Context**: Read `task.md` and the current user request to understand the objective.
2. **Identify Keywords**: Extract key terms, function names, and component names from the request.

## Phase 2: Search Strategy

Use your tools (`find_by_name`, `grep_search`, `view_file`) to locate relevant code.

1. **Keyword Search**:
   - Search for unique terms from the request.
   - Example: `grep_search(path="src", query="Keyword")`

2. **File Structure Analysis**:
   - Locate where this feature likely lives.
   - Example: `list_dir(path="src/components/relevant_dir")`

3. **Identifier Search**:
   - If specific function or class names are mentioned, search for their definitions.
   - Example: `grep_search(path="src", query="functionName", is_regex=false)`

## Phase 3: Deep Dive

For each key file identified:

1. **Read Content**: Use `view_file` to read the file.
2. **Analyze Exports/Imports**:
   - What does this file export?
   - What does it import? (Dependencies)
3. **Trace Dependencies**:
   - Who uses this file? (Reverse dependency search via `grep_search`)
   - What critical modules does this file depend on?

## Phase 4: Pattern Recognition

1. **Find Similar Features**:
   - If adding a "X", look for existing "X" implementations to copy patterns.
   - Example: If adding a "Modal", look at other `*Modal.tsx` files.

2. **Check Tests**:
   - Find existing tests for these components.
   - Example: `find_by_name(path="tests", pattern="*Relevant*.test.tsx")`

## Phase 5: Output Exploration Report

Synthesize your findings into a summary (or artifact if complex).

**Format:**

```markdown
## Exploration Findings

### Key Files

- `src/path/to/primary.ts`: Main logic here.
- `src/path/to/related.ts`: Needs update because X.

### Existing Patterns

- We use Pattern A for similar features.
- Tests are located in `tests/feature/`.

### Risks

- Touching `primary.ts` might break feature Y.
- Dependency Z is deprecated.

### Recommendations

1. Modify `primary.ts` to add...
2. Create new component `NewComponent.tsx` following pattern of `OldComponent.tsx`.
```
