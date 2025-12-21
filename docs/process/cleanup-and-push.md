# Cleanup & Push (Shipping Checklist)

**Goal:** Remove temporary artifacts, verify completeness, and push clean work.

## Cleanup
- delete scratch/temp files (unless intentionally kept in `/ai_working`)
- remove debug prints/log spam
- verify formatting/lint rules

## Verify
- repo clean: `git status`
- tests pass: unit + integration
- docs and code are in sync (no drift)
- CLI `--help` correct; errors are actionable
- no secrets in logs/config

## Commit hygiene
- logical commits (small, meaningful)
- clear messages (what + why)
- avoid “WIP” in mainline

## Final done checklist
- ✅ temporary artifacts cleaned
- ✅ verification complete
- ✅ checks passing
- ✅ docs/code in sync
- ✅ clean history
- ✅ pushed to remote
