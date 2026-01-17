# Pre-Existing Test Failures

> **Sprint Note**: These failures existed before the Code Improvement Sprint and are unrelated to sprint changes.
> **Root Cause**: localStorage/zustand storage mock issues in test environment.

**Summary**: 20 files / 123 tests failed | 18 files / 164 tests passed | 13 skipped

## Failing Test Files

| File                                                    | Category       | Notes                                       |
| ------------------------------------------------------- | -------------- | ------------------------------------------- |
| `src/components/dashboard/DashboardSkeleton.test.tsx`   | Component      | localStorage mock                           |
| `src/components/error-handling/ErrorBoundary.test.tsx`  | Component      | localStorage mock                           |
| `src/components/kanban/KanbanBoard.test.tsx`            | Component      | `storage.setItem is not a function`         |
| `src/components/kanban/StageColumn.test.tsx`            | Component      | `storage.setItem is not a function`         |
| `src/components/scheduling/DragAndDropContext.test.tsx` | Component      | localStorage mock                           |
| `src/components/ui/EventHistoryTimeline.test.tsx`       | Component      | localStorage mock                           |
| `src/components/ui/PumpDetailModal.test.tsx`            | Component      | localStorage mock                           |
| `src/hooks/useKeyboardShortcuts.test.tsx`               | Hook           | localStorage mock                           |
| `src/hooks/useTheme.test.tsx`                           | Hook           | localStorage mock                           |
| `src/infrastructure/events/EventStore.test.ts`          | Infrastructure | localStorage mock                           |
| `src/infrastructure/ledger/LocalStorageLedger.test.ts`  | Infrastructure | `localStorage.removeItem is not a function` |
| `src/lib/calculateDaysInStage.test.ts`                  | Lib            | localStorage mock                           |
| `src/lib/schedule-helper.test.ts`                       | Lib            | localStorage mock                           |
| `src/store.constitution.test.ts`                        | Store          | localStorage mock                           |
| `src/store.staffing.test.ts`                            | Store          | localStorage mock                           |
| `tests/components/MainCalendarGrid.spec.tsx`            | Component      | localStorage mock                           |
| `tests/lib/schedule.spec.ts`                            | Lib            | localStorage mock                           |
| `tests/store/modular-store.spec.ts`                     | Store          | Module import / localStorage                |
| `tests/store/selectors.spec.ts`                         | Store          | localStorage mock                           |
| `tests/store/timeline-cache.spec.ts`                    | Store          | localStorage mock                           |

## Root Cause Analysis

All failures share the same error pattern:

```
TypeError: storage.setItem is not a function
```

or

```
TypeError: localStorage.removeItem is not a function
```

The zustand persist middleware expects `window.localStorage` with the full Storage API, but the Vitest environment's localStorage mock is incomplete.

## Recommended Fix

Add a proper localStorage mock to `tests/setup.ts` or `vitest.setup.ts`:

```typescript
const localStorageMock = (() => {
  let store: Record<string, string> = {}
  return {
    getItem: (key: string) => store[key] ?? null,
    setItem: (key: string, value: string) => {
      store[key] = value
    },
    removeItem: (key: string) => {
      delete store[key]
    },
    clear: () => {
      store = {}
    },
    get length() {
      return Object.keys(store).length
    },
    key: (i: number) => Object.keys(store)[i] ?? null,
  }
})()
Object.defineProperty(globalThis, 'localStorage', { value: localStorageMock })
```
