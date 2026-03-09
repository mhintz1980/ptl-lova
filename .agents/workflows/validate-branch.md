---
description: Format, lint, and run all tests before opening a PR to protect the main branch.
---

// turbo-all

1. Format the codebase: `pnpm format`
2. Lint the codebase: `pnpm lint`
3. Run unit tests: `pnpm test`
4. Run Playwright E2E tests: `pnpm test:e2e`
5. Dry-run the build: `pnpm build`
