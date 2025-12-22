# AGENTS.md — Repository Operating Manual

This file is the **default contract** for humans and AI agents working in this repo.
If anything conflicts with project-specific docs/specs, **project docs win**.

**Heavy details live in:** `docs/process/` (linked below) so we don't nuke the context window.

---

## Prime Directive

**Ship the simplest correct thing, with clean seams and tests that prove it.**

- Clarity > cleverness
- Vertical slice > sprawling architecture
- "Because it's cleaner" is not a sufficient reason (it's a vibe, not a requirement)

> [!CAUTION]
> **BETA PROTOCOL IN EFFECT**
> The application is in **Cloud Mode** using a shared Supabase database.
> **DO NOT** reset data, clear tables, or run seed scripts without explicit user authorization.
> Read [`docs/status/current-work.md`](docs/status/current-work.md) before starting any task.

---

## Project Structure & Module Organization

- `src/` contains the React + TypeScript app (components, store, lib utilities, adapters).
- `tests/` holds Playwright E2E specs (see `tests/e2e`).
- `docs/` is the source of truth for architecture, development, testing, and constitution rules.
- `public/` contains static assets; `dist/` is build output.
- `scripts/` contains utility scripts.
- `/ai_working` (optional, gitignored) can be used for scratch notes and checklists.

---

## Build, Test, and Development Commands

- `pnpm install` installs dependencies (pnpm is required).
- `pnpm dev` starts Vite with hot reload.
- `pnpm build` runs `tsc -b` then builds the production bundle.
- `pnpm preview` serves the production build locally.
- `pnpm lint` runs ESLint; `pnpm format` runs Prettier.
- `pnpm test` runs Vitest unit/integration suites.
- `pnpm test:e2e` runs Playwright E2E tests (use `PLAYWRIGHT_TEST_BASE_URL=http://localhost:5173` when pointing at a running dev server).

---

## Non‑Negotiables

1. **Modular design (bricks mindset)**  
   Build features as small, focused modules with clear boundaries. Each module should be independently testable and replaceable without rippling changes.

2. **CLI for scripts/utilities**  
   Standalone scripts in `scripts/` expose proper CLIs: args/stdin → stdout, errors → stderr, real exit codes, honest `--help`.

3. **TDD required**  
   Write tests first, see them fail, then implement until green, then refactor.

4. **Integration tests prioritized**  
   If unsure: test the contract and workflow, not the internals.

5. **Simplicity gates**  
   No speculative "future-proofing." If you can't justify an abstraction _today_, don't add it.

6. **Anti‑abstraction rule**  
   Don't wrap external libraries just to "clean up." Wrap only when there's a concrete need.

7. **Observability**  
   Failures must be diagnosable. Errors should say what failed and where (without leaking secrets).

8. **Versioning**  
   Breaking changes are explicit and intentional.

Full rule text: `docs/process/constitutional-core-rules.md`

---

## Implementation & Modular Design Philosophy

- Favor ruthless simplicity: solve today's need directly, avoid future-proofing, minimize abstractions.
- Build in vertical slices so data flows end-to-end early; refine after core paths work.
- Prefer small, self-contained modules with stable interfaces ("bricks") that can be regenerated without rippling changes.
- Treat external contracts as sacred: interfaces and boundaries stay stable even if internals change.
- Use libraries when they align cleanly; revert to custom code when the library becomes the constraint.

---

## Coding Style & Naming Conventions

- TypeScript + React function components; keep feature components in `src/components/<feature>` and shared UI in `src/components/ui`.
- Tailwind CSS for layout and utilities; reuse shared classes from `src/index.css` when styles repeat.
- Prefer Zustand selectors/actions in `src/store.ts` over ad-hoc component state.
- Use canonical stage constants and names defined in the Constitution and DDD blueprint; never reintroduce legacy stage strings.
- Keep modules focused and readable; if an abstraction doesn't buy clarity, remove it.

---

## Default Workflow (Do This Unless Told Otherwise)

1. **Clarify the goal** (happy path, non-goals, constraints)
2. **Write a small plan** (checklist, files touched, acceptance criteria)
3. **Retcon docs/spec first** _when behavior/contracts change_
4. **Write tests first** (contract + integration, then unit as needed)
5. **Implement in small slices** (keep seams clean, avoid "general solution" traps)
6. **Review vs plan/spec** (drift check, naming, complexity, dead code)
7. **Cleanup & push** (repo clean, checks pass, docs/code in sync)

Workflow details: `docs/process/README.md`

---

## Testing Guidelines

- Vitest covers store logic, hooks, and helpers; add tests near the code or under `tests/components` as appropriate.
- Playwright covers end-to-end workflows; update E2E specs when UI flows change.
- Name tests clearly for the behavior (e.g., `scheduling-enhanced.spec.ts`).

---

## Stop / Escalate Conditions (Do NOT "Power Through")

Pause and ask for a decision when:

- requirements are unclear or contradict docs
- terminology is inconsistent and would create new "parallel truths"
- the next step requires a new abstraction you can't justify today
- a change appears to be breaking (API/CLI behavior, data shape, storage schema)

---

## Commit & Pull Request Guidelines

- Follow Conventional Commits style seen in history: `feat:`, `test:`, `fix:`, `docs:` (include scope when useful).
- Keep PRs small and tightly scoped; one Constitution phase per PR.
- PR description must link an issue/plan item when applicable, or state "no issue".
- UI changes require before/after screenshots or a short GIF.
- PR description must confirm Constitution compliance: Kanban is truth, calendar is projection-only, forecast hints only.
- Must pass: `pnpm test` and `scripts/constitution-gate.sh`.
- Include test results in the PR; add/update tests for behavior changes (Vitest, Playwright for UI workflow changes).
- If localStorage/data shapes change, include migration notes and fixture updates.
- Legacy stage strings allowed only in `src/lib/stage-constants.ts` and `src/infrastructure/persistence/MigrationAdapter.ts`
  (and optionally `src/test-fixtures`).
- Update docs when rules/architecture change (Constitution + implementation plan).

---

## Quick Prompt Template (Copy/Paste)

> Follow AGENTS.md strictly.  
> Task: <one sentence>  
> Constraints: <bullets>  
> Output: <what you must produce>  
> Stop if: conflicts, unclear requirements, or breaking changes are detected.

---

## Agent Browser Instructions

AI agents with built-in browser capabilities can view the running app:

1. **Start the dev server**:

   ```bash
   pnpm dev
   ```

2. **Use `browser_subagent`** to navigate to `http://localhost:8080/`

3. **Available views**:
   - Dashboard: `/` (default) — KPIs, charts, order table
   - Kanban: Click Kanban icon in header — drag-and-drop stage columns
   - Scheduling: Click calendar icon — backlog dock + calendar grid

---

## Agent-Specific Notes

Key references:

- `docs/development.md`, `docs/testing.md`
- `DDD_BLUEPRINT-OPUS.md`
- `docs/constitution/pumptracker-constitution.md`

---

## Process Links (Deep Dives)

- `docs/process/constitutional-core-rules.md` — full constitution
- `docs/process/documentation-retcon.md` — "docs describe target state" method
- `docs/process/implementation-philosophy.md` — simplicity/complexity decision framework + examples
- `docs/process/modular-design.md` — "brick" mindset for AI-assisted building
- `docs/process/code-implementation.md` — code must match docs; file-crawl templates
- `docs/process/code-review.md` — reviewer checklist + severity categories
- `docs/process/cleanup-and-push.md` — final polish + shipping checklist
