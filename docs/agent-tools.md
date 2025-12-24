# Agent Tools Catalog

This catalog documents all scripts, commands, and workflows available to agents working on PumpTracker Lite. Each tool follows the **consolidation principle**: clear descriptions that answer **what**, **when**, and **what returns**.

---

## Package.json Scripts (Primary Tools)

### Development & Building

#### `pnpm dev`

**What**: Starts Vite development server with hot module replacement  
**When**: 
- Starting local development
- Testing changes in browser
- Running app for E2E tests

**Returns**: 
- Dev server on `http://localhost:8080`
- Hot reload enabled
- Console output shows compilation status

**Example**:
```bash
pnpm dev
# ➜  Local:   http://localhost:8080/
# ➜  Network: http://192.168.1.x:8080/
```

**Error Recovery**:
- Port in use → Kill process or use `pnpm dev --port <other-port>`
- Compilation errors → Check console, fix TypeScript/ESLint errors

---

#### `pnpm build`

**What**: Compiles TypeScript and builds production bundle  
**When**:
- Before deployment
- Verifying production build works
- Running type checks with build

**Returns**:
- Production files in `dist/` directory
- TypeScript compilation output
- Build size summary

**Example**:
```bash
pnpm build
# vite v7.2.2 building for production...
# ✓ 1234 modules transformed.
# dist/index.html                  0.45 kB
# dist/assets/index-abc123.js    245.67 kB
```

**Error Recovery**:
- Type errors → Run `pnpm tsc --noEmit` for details
- Build failures → Check for circular dependencies, missing imports

---

#### `pnpm build:dev`

**What**: Builds with development mode settings  
**When**: Need development build for debugging production issues  
**Returns**: Development build in `dist/` with source maps

---

#### `pnpm preview`

**What**: Serves production build locally  
**When**: Testing production build before deployment  
**Returns**: HTTP server on configured port serving `dist/`

---

### Testing

#### `pnpm test`

**What**: Runs Vitest unit and integration tests  
**When**:
- After code changes
- Before committing
- Verifying business logic

**Returns**:
- Test results (pass/fail counts)
- Coverage report (if configured)
- Error details for failures

**Example**:
```bash
pnpm test
# ✓ src/store.test.ts (12)
# ✓ src/domain/production/entities/Pump.test.ts (8)
#
# Test Files  14 passed (14)
#      Tests  89 passed (89)
```

**Options**:
- `pnpm test --run` - Run once (no watch mode)
- `pnpm test src/store.ts` - Test specific file
- `pnpm test --coverage` - With coverage report

**Error Recovery**:
- Failing tests → Read error messages, check test expectations
- Import errors → Verify file paths, check tsconfig.json

---

#### `pnpm test:e2e`

**What**: Runs Playwright end-to-end tests  
**When**:
- Verifying UI workflows
- Testing user interactions
- Before major releases

**Returns**:
- E2E test results
- Screenshots on failure
- HTML report link

**Prerequisites**:
- Dev server must be running on expected port
- Set `PLAYWRIGHT_TEST_BASE_URL` if not default

**Example**:
```bash
pnpm dev &  # Start dev server first
PLAYWRIGHT_TEST_BASE_URL=http://localhost:8080 pnpm test:e2e
```

**Error Recovery**:
- Server not running → Start `pnpm dev` first
- Selector failures → Check if UI changed, update selectors
- Timeout errors → Increase timeout or fix slow operations

---

#### `pnpm test:e2e:headed`

**What**: Runs E2E tests with visible browser  
**When**: Debugging E2E test failures, seeing what's happening  
**Returns**: Same as `test:e2e` but with visible browser window

---

#### `pnpm test:e2e:ui`

**What**: Opens Playwright Test UI  
**When**: Interactive E2E test development and debugging  
**Returns**: Playwright UI at http://localhost:port (auto-opens)

---

#### `pnpm test:e2e:debug`

**What**: Runs E2E tests in debug mode  
**When**: Step-by-step debugging of E2E failures  
**Returns**: Debugger interface for stepping through tests

---

#### `pnpm test:e2e:codegen`

**What**: Opens Playwright code generator  
**When**: Creating new E2E tests, recording user interactions  
**Returns**: Browser with recording toolbar, generates test code

---

### Code Quality

#### `pnpm lint`

**What**: Runs ESLint on all source files  
**When**:
- Before committing
- After adding new code
- Fixing code quality issues

**Returns**:
- List of linting errors/warnings
- File locations and rule violations
- Suggestions for fixes

**Example**:
```bash
pnpm lint
# /src/components/Dashboard.tsx
#   45:23  error  'foo' is assigned but never used  @typescript-eslint/no-unused-vars
```

**Error Recovery**:
- Auto-fix → Some rules support `--fix` flag
- Rule conflicts → Check `.eslintrc` configuration

---

## Shell Scripts

### `scripts/constitution-gate.sh`

**What**: Validates Constitution compliance (tests + pattern checks)  
**When**:
- Before committing to main
- Before opening PR
- After refactoring domain/stage logic

**Returns**:
- ✅ Constitution gate passed - All checks successful
- ❌ Violations found - Specific violations with fix guidance

**What it checks**:
1. All Vitest tests must pass
2. No forbidden scheduling mutations (`schedulePump`, `clearSchedule`, etc.)
3. Legacy stage strings only in allowlisted files

**Example Success**:
```bash
./scripts/constitution-gate.sh
# ✓ All tests passed
# ✅ No forbidden scheduling mutation references.
# ✅ Legacy stage strings exist only in allowlisted migration/mapping files.
# ✅ Constitution gate passed.
```

**Example Failure**:
```bash
./scripts/constitution-gate.sh
# ❌ Legacy stage strings found OUTSIDE allowlisted migration/mapping files:
# src/components/SomeComponent.tsx:45:"POWDER COAT"
#
# Action: Replace legacy labels with canonical stages:
# - "POWDER COAT" -> POWDER_COAT (UI label: Powder Coat)
```

**Error Recovery**:
- Test failures → Fix failing tests first
- Forbidden mutations → Rename to forecast-hint APIs
- Legacy strings → Replace with canonical constants from `stage-constants.ts`

---

## Common Workflow Patterns

### Development Workflow

```bash
# 1. Start development
pnpm dev

# 2. Make changes
# ... edit files ...

# 3. Check tests
pnpm test --run

# 4. Lint code
pnpm lint

# 5. Verify E2E (optional)
pnpm test:e2e
```

### Pre-Commit Workflow

```bash
# Full validation before commit
pnpm test --run
pnpm lint
./scripts/constitution-gate.sh
```

### Deployment Workflow

```bash
# Build and verify
pnpm build
pnpm preview  # Test production build locally

# Then deploy to platform (Vercel, Netlify, etc.)
```

---

## Tool Selection Decision Tree

**Need to...**

- **Run app locally** → `pnpm dev`
- **Test business logic** → `pnpm test`
- **Test UI interactions** → `pnpm test:e2e`
- **Fix code style** → `pnpm lint`
- **Build for deployment** → `pnpm build`
- **Verify Constitution compliance** → `scripts/constitution-gate.sh`
- **Debug E2E test** → `pnpm test:e2e:ui` or `pnpm test:e2e:headed`
- **Create new E2E test** → `pnpm test:e2e:codegen`

---

## Error Message Patterns

### TypeScript Compilation Errors

**Pattern**: `TS2345: Argument of type 'X' is not assignable to parameter of type 'Y'`  
**Meaning**: Type mismatch between what you passed and what's expected  
**Fix**: Check type definitions, ensure correct type or add type assertion

**Pattern**: `TS2307: Cannot find module 'X'`  
**Meaning**: Import path incorrect or module not installed  
**Fix**: Check file path, run `pnpm install` if missing dependency

### Test Failures

**Pattern**: `AssertionError: expected 'X' to equal 'Y'`  
**Meaning**: Test expectation doesn't match actual value  
**Fix**: Either fix code to match expectation, or update test if expectation changed

**Pattern**: `TypeError: Cannot read property 'X' of undefined`  
**Meaning**: Accessing property on undefined value  
**Fix**: Add null checks, ensure value is initialized

### E2E Test Failures

**Pattern**: `Error: locator.click: Timeout 30000ms exceeded`  
**Meaning**: Element not found or not clickable within timeout  
**Fix**: Check selector, increase timeout, or ensure element renders

**Pattern**: `Error: page.goto: net::ERR_CONNECTION_REFUSED`  
**Meaning**: Dev server not running  
**Fix**: Start `pnpm dev` before running E2E tests

---

## Best Practices

### When to Use Each Tool

- **Always run** `pnpm test --run` before committing
- **Run** `constitution-gate.sh` before opening PR
- **Run** `pnpm lint` to catch code quality issues early
- **Use** `pnpm test:e2e:ui` for interactive E2E development
- **Use** `--run` flag with Vitest to avoid watch mode in CI/automation

### Tool Efficiency

- **Parallel execution**: Can run `pnpm dev` and `pnpm test` simultaneously
- **Selective testing**: Use file patterns to test specific areas
- **Caching**: Vite and Vitest cache builds for faster re-runs

---

**Last Updated**: 2025-12-24  
**Maintainer**: Agents and developers working on PumpTracker Lite  
**Related**: See `AGENTS.md` for development workflow, `docs/development.md` for detailed conventions
