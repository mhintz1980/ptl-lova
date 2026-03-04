# Project Memory: awesome-slash

This file contains critical instructions for AI assistants working in this repository.

See @README.md for project overview and @CONTRIBUTING.md for guidelines.

---

## ⚠️ Production Project Notice

**This project has real users and GitHub stars.** Every change impacts developers relying on this plugin for their workflows.

**Exercise extra caution:**
- Test thoroughly before pushing
- Consider backwards compatibility
- Don't break existing functionality
- Security vulnerabilities affect all users
- Breaking changes require major version bumps

---

## Project Purpose & Development Philosophy

### What This Project Is

**awesome-slash is a plugin for OTHER projects** - it provides workflow automation for developers using Claude Code, Codex CLI, and OpenCode in their own repositories.

This is NOT a project where we optimize for internal development convenience. Every decision must be evaluated through the lens of: **"How does this improve the experience for users of the plugin?"**

### Core Priorities (In Order)

1. **User DX** - The developer experience when using this plugin in external projects
2. **Controlled, worry-free automation** - Users should trust the plugin to run autonomously
3. **Minimal context/token consumption** - Agents should be efficient, not verbose
4. **Quality agent output** - Code written by agents must be production-ready
5. **Simplicity over features** - Remove complexity that doesn't serve users

### Development Approach

When working on this codebase, always ask:

- **"Does this help plugin users?"** - Not internal tooling, not developer convenience here
- **"Is this simple enough?"** - If it feels overengineered, it probably is
- **"Will agents using this consume fewer tokens?"** - Efficiency matters
- **"Does this make the automation more reliable?"** - Trust is everything

### What To Avoid

- **Overengineering** - No config systems nobody asked for, no schemas for the sake of schemas
- **Internal tooling focus** - We don't optimize for developing THIS repo
- **Complexity creep** - Every abstraction must justify its existence
- **Summary files** - Don't create audit/completion/summary files (see Work Guidelines)

### State Management Philosophy

State should be **simple and flat**:
- `tasks.json` in main project - tracks active worktree/task
- `flow.json` in worktree - tracks workflow progress
- No history arrays, no nested objects, no cached settings
- Policy is per-task, not global

---

## PR Auto-Review Process

> **CRITICAL**: Every PR receives automatic reviews from **4 agents**:
> - **Copilot** - GitHub's AI reviewer
> - **Claude** - Anthropic's AI reviewer
> - **Gemini** - Google's AI reviewer
> - **Codex** - OpenAI's AI reviewer

**Mandatory workflow:**
1. After PR creation, wait **at least 3 minutes** for first review round
2. Read **ALL comments** from all 4 reviewers
3. Address **EVERY comment** - no exceptions
4. Iterate until **zero unresolved threads** (typically 2-4 rounds)

**Rules:**
- ALWAYS address all comments, including "minor" or "nit" suggestions
- NEVER skip a comment unless factually wrong or user-approved
- Treat all feedback as **required changes**, not suggestions

---

## Workflow Essentials

**MUST-CALL Agents** (cannot skip in /next-task):
- `exploration-agent` - before planning
- `planning-agent` - before implementation
- `review-orchestrator` - before shipping
- `delivery-validator` - before /ship

**PR Review Loop**: Wait 3 min for auto-reviewers (Copilot, Claude, Gemini, Codex), address ALL comments.

See `agent-docs/workflow.md` for full agent tables and tool requirements.

---

## Code Quality

- Maintain **80%+ test coverage**
- Run `npm test` before commits
- Update CHANGELOG.md with every PR

---

## Work Guidelines

### No Summary Files

**CRITICAL**: Do NOT create summary, audit, or completion files unless explicitly part of the documented workflow.

**Prohibited files**:
- `*_FIXES_APPLIED.md`
- `*_AUDIT.md`
- `*_SUMMARY.md`
- `*_COMPLETION.md`
- Any other summary/report files

**Why**:
- Summary files clutter the repository
- Information should be in CHANGELOG.md or commit messages
- User doesn't want post-task summaries
- Focus on the work, not documentation about the work

**When summary files ARE allowed**:
- Explicitly requested by user
- Part of documented workflow (e.g., CHANGELOG.md)
- Required by process (e.g., PLAN.md in plan mode)

**If you complete a task**: Report completion verbally, update CHANGELOG.md if appropriate, but do NOT create a summary file.

---

## Key Files

| Component | Location |
|-----------|----------|
| Next-task agents | `plugins/next-task/agents/*.md` |
| Ship command | `plugins/ship/commands/ship.md` |
| CI review loop | `plugins/ship/commands/ship-ci-review-loop.md` |
| State management | `lib/state/workflow-state.js` |
| Plugin manifest | `.claude-plugin/plugin.json` |
| **Release checklist** | `agent-docs/release.md` |

