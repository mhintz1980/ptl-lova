---
name: review-agent
description: Perform multi-perspective code review on changes. Use this skill before requesting user review or finalizing a task.
---

# Review Agent Skill

Your role is to critique the current changes (diff) from multiple perspectives: **Code Quality**, **Safety**, and **Testing**.

## Phase 1: Analysis

1. **Identify Changes**: Look at the files modified in the current task.
   - Use `git diff --stat` or recall your recent edits.
2. **Read the Diff**: Examine the specific lines changed.

## Phase 2: Multi-Perspective Review

Simulate three different reviewers looking at the code:

### 🤖 Reviewer 1: The Code Craftsman (Quality/Style)

- **Consistency**: Do the new files match the project's style? (Naming, file structure)
- **Typing**: Are there any `any` types? Are interfaces defined?
- **Readability**: Are functions too long? Are variable names clear?
- **Duplication**: Is this code copy-pasted? Could it be a shared utility?

### 🛡️ Reviewer 2: The Security/Safety Officer (Risks)

- **Silent Failures**: Are there empty `catch` blocks? Swallowed errors?
- **Input Validation**: Is user input checked before use?
- **Secrets**: Are there any hardcoded keys or tokens? (Run `deslop` check)
- **Side Effects**: Does this change affect global state unexpectedly?

### 🧪 Reviewer 3: The Test Engineer (Coverage)

- **Coverage**: Did we add new logic without a corresponding test?
- **Edge Cases**: Did we only test the "Happy Path"? What about nulls/undefined?
- **Test Quality**: Do the tests actually _assert_ something meaningful?

## Phase 3: Actionable Findings

Synthesize findings into a list of issues to fix _before_ handing off to the user.

**Severity Levels:**

- **CRITICAL**: Must fix (Bugs, Security, Build breaks).
- **HIGH**: Should fix (Missing tests, potential runtime errors).
- **MEDIUM**: Good to fix (Style inconsistencies, duplication).
- **LOW**: Nitpicks (Comments, naming).

## Phase 4: Self-Correction Loop

If you find **CRITICAL** or **HIGH** issues:

1. **Fix them immediately**. Do not ask the user.
2. Re-run verification.

If you find **MEDIUM/LOW** issues:

1. Fix them if quick.
2. Or note them in the `walkthrough.md` or PR description.
