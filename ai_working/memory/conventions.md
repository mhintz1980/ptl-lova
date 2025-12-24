# Project Conventions

## Naming Conventions

### Files
- Components: `PascalCase.tsx`
- Utilities: `camelCase.ts`
- Tests: `ComponentName.test.tsx` or `utility.test.ts`

### Code
- React components: `PascalCase`
- Functions: `camelCase`
- Constants: `UPPER_SNAKE_CASE`
- Types/Interfaces: `PascalCase`

---

## Directory Structure Conventions

- Feature components: `src/components/<feature>/`
- Shared UI: `src/components/ui/`
- Domain: `src/domain/<bounded-context>/`
- Infrastructure: `src/infrastructure/<concern>/`

---

## State Management

- Prefer Zustand store over ad-hoc React state
- Persistent state → Zustand partializer
- Ephemeral UI state → React useState (minimal)

---

## Styling

- Use Tailwind utilities
- Promote repeated styles to `src/index.css`
- Custom classes: `.kebab-case`

---

## Testing

- Unit tests colocated with code
- E2E tests in `tests/e2e/`
- Test naming: descriptive phrases, not function names

---

## Documentation

- Architecture changes → update `docs/architecture.md`
- New features → update `docs/development.md`
- Agent learnings → update memory files

---

**Last Updated**: 2025-12-24  
**Source**: AGENTS.md, development.md, observed patterns
