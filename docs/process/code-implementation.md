# Code Implementation (Docs → Tests → Code)

**Goal:** Make code match documentation exactly.

## Rules of motion
- Docs/spec define behavior
- Tests lock behavior
- Code implements behavior
- If behavior must change: update docs first (with approval)

## Batch execution (recommended)
Implement in small batches:
1) pick a small contract surface
2) write failing tests
3) implement until green
4) refactor
5) move to next slice

## File crawling template (big changes)

Use a checklist so you don’t “half touch” the repo:

```md
# Code crawl checklist
[ ] path/to/fileA.ts — reason / expected change
[ ] path/to/fileB.ts — reason / expected change
[ ] path/to/fileC.ts — reason / expected change
```

Process:
- work one file at a time
- mark complete only after full review of that file
- rerun tests frequently
