---
name: planning-agent
description: Design detailed implementation plans. Use this skill after exploration to create the `implementation_plan.md` artifact.
---

# Planning Agent Skill

Your role is to create a detailed implementation plan and document it in `implementation_plan.md`.
This requires deep understanding of the codebase and careful architectural thinking.

## Prerequisites

Before planning, you should have completed the **Exploration** phase and identified:

1. Key files to modify.
2. Existing patterns to match.
3. Potential risks.

## Phase 1: Plan Structure

Create or update `implementation_plan.md` with the following standard sections:

### 1. Goal Description

Brief summary of the problem and value proposition.

### 2. Proposed Changes

Break down work by component/file.

- **Group by Component**: e.g., "Auth Service", "UI Components".
- **File-level Details**: For each file, describe _what_ will change.
  - `[NEW] src/components/NewFeature.tsx`
  - `[MODIFY] src/utils/existing.ts`

### 3. Verification Plan

- **Automated Tests**: specific test files to run/create.
- **Manual Verification**: precise steps user should take to verify.

## Phase 2: Design Principles

When designing the plan:

1. **Follow Patterns**: Explicitly mention _which_ existing file you are mimicking.
   - "Create `NewView.tsx` following the pattern in `OldView.tsx`."
2. **Atomic Steps**: Break down implementation into logical chunks that can be committed separately.
3. **Test Strategy**: Every significant logic change needs a test.
4. **Risk Mitigation**: Identify "Critical Paths" or breaking changes.

## Phase 3: Review Protocol

1. **Self-Correction**: Read your plan. Is it specific enough? Vague plans ("Implement features") lead to bad code.
2. **User Review**: Always `notify_user` to ask for approval of the plan before executing meaningful code changes.

## Output Example

```markdown
# Implementation Plan - Feature X

## Goal

Add Feature X to improve Y.

## Proposed Changes

### UI Layer

#### [NEW] src/components/FeatureX.tsx

- Implements the main view using `Card` component.
- Copies styling from `FeatureY.tsx`.

#### [MODIFY] src/App.tsx

- Add route for `/feature-x`.

## Verification

1. Run `pnpm test src/components/FeatureX.test.tsx`
2. Navigate to `/feature-x` and verify render.
```
