# Project Review Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Execute a full `/project-review` across the repository, producing evidence-based findings and applying safe fixes with verification.

**Architecture:** Follow the project-review phases: context gathering, multi-domain review, consolidation, optional fixes, and verification. Treat each domain as an independent review stream with clear file/line findings, then consolidate by severity.

**Tech Stack:** Node.js, React + TypeScript, pnpm, Playwright/Vitest, GitHub Actions.

### Task 1: Phase 1 Context & Scoping

**Files:**
- Read: `docs/status/current-work.md`
- Read: `awesome-slash/plugins/project-review/commands/project-review-agents.md`

**Step 1: Verify branch context**

Run: `git branch`
Expected: Current branch shown with `*` (do not switch to `main`).

**Step 2: Gather platform metadata**

Run: `node awesome-slash/plugins/project-review/lib/platform/detect-platform.js`
Expected: JSON with `projectType`, `packageManager`, `mainBranch`.

**Step 3: Gather project stats**

Run:
```bash
FILE_COUNT=$(git ls-files | wc -l)
TEST_FILES=$(git ls-files | rg -i '(test|spec)\.' | wc -l)
```
Expected: Non-zero file count; tests likely > 0.

### Task 2: Phase 2 Multi-Domain Review (Sequential in this session)

**Files:**
- Read: `src/**`
- Read: `tests/**`
- Read: `.github/workflows/**`

**Step 1: Security review pass**

Run targeted `rg` searches for auth, validation, and config hotspots; open only relevant sections.
Expected: Findings recorded with file:line and code quote or no-issue note.

**Step 2: Performance review pass (React-aware)**

Inspect render hot paths, heavy loops, and data fetching patterns; apply Vercel React performance heuristics.
Expected: Findings recorded with file:line and code quote or no-issue note.

**Step 3: Test-quality review pass**

Inspect test coverage for critical workflows and edge cases.
Expected: Findings recorded with file:line and code quote or no-issue note.

**Step 4: Architecture review pass**

Assess module boundaries, coupling, and organization.
Expected: Findings recorded with file:line and code quote or no-issue note.

**Step 5: Database review pass**

Inspect query usage, adapters, and migration patterns.
Expected: Findings recorded with file:line and code quote or no-issue note.

**Step 6: API review pass**

Inspect API endpoints/handlers for HTTP semantics and errors.
Expected: Findings recorded with file:line and code quote or no-issue note.

**Step 7: Frontend review pass**

Inspect components/state management for correctness and maintainability.
Expected: Findings recorded with file:line and code quote or no-issue note.

**Step 8: DevOps review pass**

Inspect CI workflows for coverage gaps or unsafe steps.
Expected: Findings recorded with file:line and code quote or no-issue note.

### Task 3: Phase 3 Tech Debt (Conditional)

**Files:**
- Modify: `TECHNICAL_DEBT.md` (only if existing or `--create-tech-debt`)

**Step 1: Check for existing tech debt file**

Run: `rg --files -g 'TECHNICAL_DEBT.md'`
Expected: 0 or 1 file path.

**Step 2: Update tech debt doc (if required)**

Apply the template from project-review spec with counts by severity.
Expected: Summary matches consolidated findings.

### Task 4: Phase 4 Fixes (If Any Critical/High Issues)

**Files:**
- Modify: Only files implicated by findings
- Test: Relevant tests in `tests/**` or `src/**` as appropriate

**Step 1: Write failing test**

Add/adjust tests that demonstrate the issue.
Expected: Failing test that isolates the behavior.

**Step 2: Implement minimal fix**

Change only the required logic to satisfy the test.
Expected: Test passes.

**Step 3: Re-run tests**

Run: `pnpm test` (or narrower test target)
Expected: Green for touched tests.

### Task 5: Phase 5 Verification

**Files:**
- Read: None

**Step 1: Run verification commands**

Run: `pnpm test`, `pnpm lint`, `pnpm build` (as applicable).
Expected: All commands succeed; failures documented if any.

