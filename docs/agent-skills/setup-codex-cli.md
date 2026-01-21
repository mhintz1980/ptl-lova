# Codex CLI Setup Guide

Step-by-step guide for setting up awesome-slash workflow automation in Codex CLI.

---

## Prerequisites

- **Git** installed
- **Node.js 18+** installed
- **Codex CLI** installed ([developers.openai.com/codex/quickstart](https://developers.openai.com/codex/quickstart/))
- **GitHub CLI (`gh`)** installed and authenticated (for ship workflow)

```bash
# Verify prerequisites
git --version
node --version   # Should be v18.0.0 or higher
codex --version
gh auth status
```

---

## Installation

```bash
# 1. Clone the repository
git clone https://github.com/avifenesh/awesome-slash.git
cd awesome-slash

# 2. Run the Codex installer
./scripts/install/codex.sh
```

---

## What the Installer Does

1. **Installs MCP server dependencies** (`npm install --production`)
2. **Configures MCP server** in `~/.codex/config.toml`:
   ```toml
   [mcp_servers.awesome-slash]
   command = "node"
   args = ["/path/to/awesome-slash/mcp-server/index.js"]
   env = { PLUGIN_ROOT = "/path/to/awesome-slash", AI_STATE_DIR = ".codex" }
   enabled = true
   ```
3. **Creates skill files** in `~/.codex/skills/`:
   - `next-task/SKILL.md` - Workflow orchestration
   - `ship/SKILL.md` - PR workflow
   - `review/SKILL.md` - Code review
   - `deslop/SKILL.md` - AI slop cleanup
   - `workflow-status/SKILL.md` - Status checking

---

## Verify Installation

```bash
# Check MCP server config
cat ~/.codex/config.toml

# Check installed skills
ls ~/.codex/skills/
```

---

## Usage

> [!IMPORTANT]
> Codex uses `$` prefix instead of `/` for commands.

| Command      | Purpose                      | Example                   |
| ------------ | ---------------------------- | ------------------------- |
| `$next-task` | Find and implement next task | `$next-task bug`          |
| `$ship`      | Complete PR workflow         | `$ship --strategy rebase` |
| `$review`    | Multi-agent code review      |                           |
| `$deslop`    | Clean AI slop                |                           |

### MCP Tools Available

In any prompt, you can call these MCP tools directly:

- `workflow_status` - Check current workflow state
- `workflow_start` - Start a new workflow
- `workflow_resume` - Resume from checkpoint
- `workflow_abort` - Cancel and cleanup
- `task_discover` - Find and prioritize tasks
- `review_code` - Run pattern-based code review

---

## Quick Test

1. Start Codex: `codex`
2. Type: "Check my workflow status" (uses `workflow_status` MCP tool)
3. Or invoke directly: `$next-task --status`

---

## Updating

```bash
cd /path/to/awesome-slash
git pull origin main
./scripts/install/codex.sh  # Re-run installer
```

---

## State Directory

Codex stores workflow state in `.codex/` directory:

- `flow.json` - Workflow progress
- `tasks.json` - Active task tracking

---

## Troubleshooting

### Skills not found

```bash
# Re-run installer
cd /path/to/awesome-slash
./scripts/install/codex.sh
```

### MCP server not connecting

```bash
# Check config
cat ~/.codex/config.toml

# Verify MCP server works
node /path/to/awesome-slash/mcp-server/index.js
```

### Path errors on Windows

The installer auto-converts Git Bash paths (`/c/Users/...`) to Windows paths (`C:/Users/...`). If issues persist, manually edit `~/.codex/config.toml` with correct Windows paths.

---

## Resources

- [awesome-slash Repository](https://github.com/avifenesh/awesome-slash)
- [Codex CLI Documentation](https://developers.openai.com/codex/cli)
- [Full Installation Guide](https://github.com/avifenesh/awesome-slash/blob/main/docs/INSTALLATION.md)
