# Documentation Retcon (Docs First)

**Goal:** Update documentation to describe the *target state* as if it already exists and always worked this way.

This prevents “docs lag” and keeps agents aligned: **code follows docs, not the other way around.**

## The rule
- Write in **present tense**
- Avoid “will/soon/later”
- One canonical place per concept (delete/move duplicates)

## The retcon loop (for each doc)
1) Read the whole file (no skimming)
2) Understand its scope and role
3) Choose one action:
   - Update to target state
   - Delete if duplicate
   - Move if wrong location
   - Skip if already correct
4) Apply changes carefully (not just global search/replace)
5) Mark complete only after full review

### Anti-pattern
Do **not** mark docs “done” because you ran a global replacement. Each file needs real attention.

## Commit guidance
- Iterate with human feedback before committing docs that redefine behavior.
- If implementation needs to differ: update docs first, then implement.
