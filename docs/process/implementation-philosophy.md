# Implementation Philosophy (Decision Framework)

This is the “how to not build a cathedral when you need a shed” guide.

## Core posture
- Ruthless simplicity is a feature.
- Architectural integrity matters, but **minimal implementation wins**.
- Prefer direct use of proven libraries; prefer tiny custom code when it’s obvious.

## When custom code makes sense
- The problem is small, bounded, and easy to test.
- You can describe it in a few sentences and cover it with contract tests.
- The “library version” would add more surface area than value.

## When libraries make sense
- The problem is genuinely complex (auth, crypto, parsing, migrations, etc.)
- The library is mature and well-documented.
- The integration can be kept shallow (easy to replace later).

## Misalignment smell tests
- You’re inventing frameworks, registries, or state machines “just in case.”
- You can’t explain the abstraction’s value in plain language.
- Debugging would require reading 10 files before you can print a variable.

## Where to embrace complexity
- Correctness boundaries (security, money, permissions)
- Data integrity and migrations
- Anything that would hurt users if wrong

## Where to aggressively simplify
- Glue code
- Config loading
- “Manager of managers” patterns
- Fancy generalized plumbing (unless needed *now*)

## Two micro-examples (pattern, not gospel)

### Good: small focused SSE manager
- one responsibility
- direct primitives
- tested contract behavior

### Bad: over-engineered SSE framework
- unnecessary event buses
- extra state tracking
- abstractions without a current user
