---
description: Use awesome-slash commands for automated workflow management
---

# Awesome-Slash Commands

Cross-platform workflow automation for AI coding assistants. Works with Claude Code, Codex CLI, and OpenCode.

## Installation

// turbo

```bash
npm install awesome-slash
```

Or install via git clone:

```bash
git clone https://github.com/avifenesh/awesome-slash.git
cd awesome-slash
./scripts/install/claude.sh  # or codex.sh or opencode.sh
```

## Available Commands

| Command               | Purpose                             | Usage                                         |
| --------------------- | ----------------------------------- | --------------------------------------------- |
| `/next-task`          | Find and work on next priority task | `/next-task`, `/next-task --resume`           |
| `/ship`               | Complete PR workflow                | `/ship`, `/ship --dry-run`                    |
| `/deslop-around`      | Clean AI slop from code             | `/deslop-around`, `/deslop-around apply`      |
| `/project-review`     | Multi-agent code review             | `/project-review`, `/project-review --recent` |
| `/reality-check:scan` | Plan drift detection                | `/reality-check:scan`                         |

> **Note**: Codex CLI uses `$` prefix (e.g., `$next-task` instead of `/next-task`).

## Workflow Phases

`/next-task` orchestrates these phases:

1. Policy Selection → Task Discovery → Worktree Setup
2. Exploration → Planning → User Approval
3. Implementation → Review Loop → Ship
4. CI Wait → Merge → Deploy → Complete

## When to Use

- **Starting new work**: `/next-task` to find and prioritize tasks
- **Before commit**: `/deslop-around` to clean AI slop
- **Ready to ship**: `/ship` for complete PR workflow
- **Code review**: `/project-review` for multi-agent review

## Platform-Specific Setup

See detailed guides:

- [Claude Code Setup](../docs/agent-skills/setup-claude-code.md)
- [Codex CLI Setup](../docs/agent-skills/setup-codex-cli.md)
