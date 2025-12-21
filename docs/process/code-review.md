# Code Review Checklist (Senior Reviewer)

Use this after a major step (or before merge).

## 1) Plan alignment
- Does implementation match the plan/spec?
- Are deviations justified improvements or accidental drift?
- Is all planned functionality present?

## 2) Architecture & design
- Are boundaries/seams respected?
- Any new abstractions? Are they justified *today*?
- Does the change increase accidental complexity?

## 3) Correctness & tests
- Do tests prove contracts (CLI + public API)?
- Are integration tests covering workflows?
- Any missing edge cases that matter?

## 4) Maintainability
- Naming consistency
- Dead code removed
- Error messages actionable
- Logging helpful and safe (no secrets)

## 5) Findings format
Classify issues:
- **Critical**: must fix
- **Important**: should fix
- **Suggestion**: nice to have

Include concrete examples and actionable fixes.
