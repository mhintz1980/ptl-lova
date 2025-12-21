# Constitutional Core Rules (Full)

Fundamental principles governing all specification-driven development.

## I. Library‑First Principle
Every feature is developed as a standalone library.
- Self-contained and independently testable
- Clear purpose required (no “organization-only” libraries)
- Usable outside the original context
- Docs explain purpose and usage

## II. CLI Interface Requirement
Every library exposes a CLI.
- stdin/args → stdout
- errors → stderr
- exit codes convey truth
- `--help` is accurate
- JSON output supported when reasonable

## III. Test‑First Development (Non‑Negotiable)
- Tests are written first
- Tests must fail first (prove they assert something real)
- Implement only until tests pass
- Refactor after green

## IV. Integration Testing Priority
Prefer integration tests when unsure.
Suggested distribution:
- ~70% integration tests (contract validation)
- ~20% unit tests (logic density/edge cases)
- ~10% end-to-end tests (workflow validation)

## V. Simplicity Gates
Ruthless simplicity is enforced through explicit gates.
- No speculative features
- YAGNI: You Aren’t Gonna Need It
- Avoid pre-optimization and “future proofing”
- Keep scope intentionally small

## VI. Anti‑Abstraction Rule
- Don’t wrap external libraries “for cleanliness”
- Wrap only for a concrete, current need (document the need)

## VII. Observability Requirement
- Systems must be debuggable
- Errors must be actionable
- Logs explain what failed and where (without leaking secrets)

## VIII. Versioning & Breaking Changes
- Semver when applicable
- Breaking changes are explicit and intentional

## Compliance
If something violates the above, fix the violation or explicitly document why an exception exists.

## Clarification Protocol (When Questions Are Required)
When requirements are unclear and you must ask questions, present them as **multiple-choice**.
- Provide **3–7** labeled options (A, B, C…)
- Keep options concise
- Include a final freeform option:
  - **Z) Other — I’ll answer in my own words:** prompt the human to type the desired answer
