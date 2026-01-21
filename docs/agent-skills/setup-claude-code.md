# Claude Code Setup Guide

Step-by-step guide for setting up awesome-slash workflow automation in Claude Code.

---

## Prerequisites

- **Git** installed
- **Claude Code CLI** installed ([claude.ai/code](https://claude.ai/code))
- **GitHub CLI (`gh`)** installed and authenticated (for `/ship` command)

```bash
# Verify prerequisites
git --version
claude --version
gh auth status
```

---

## Installation Options

### Option 1: npm (Recommended)

```bash
claude plugin add npm:awesome-slash
```

### Option 2: GitHub Marketplace

```bash
claude plugin marketplace add avifenesh/awesome-slash
claude plugin install awesome-slash@awesome-slash
```

### Option 3: Local Clone

```bash
git clone https://github.com/avifenesh/awesome-slash.git
cd awesome-slash
./scripts/install/claude.sh
```

---

## Verify Installation

```bash
claude plugin list
# Should show: awesome-slash
```

In Claude Code, type `/help` to see available commands.

---

## Available Commands

| Command                | Purpose                               | Example                    |
| ---------------------- | ------------------------------------- | -------------------------- |
| `/next-task`           | Find and implement next priority task | `/next-task bug`           |
| `/next-task --status`  | Check current workflow state          |                            |
| `/next-task --resume`  | Resume interrupted workflow           |                            |
| `/ship`                | Complete PR workflow                  | `/ship --strategy rebase`  |
| `/deslop-around`       | Clean AI slop (report mode)           |                            |
| `/deslop-around apply` | Clean AI slop (auto-fix)              |                            |
| `/project-review`      | Multi-agent code review               | `/project-review --recent` |

---

## Quick Test

1. Open Claude Code in any project directory
2. Run `/deslop-around` to scan for AI slop
3. Run `/next-task --status` to check workflow state

---

## Updating

```bash
# npm installation
claude plugin update awesome-slash

# Local installation
cd /path/to/awesome-slash
git pull origin main
```

---

## Troubleshooting

### Commands don't appear in `/help`

```bash
# Check installation
claude plugin list

# Reinstall
claude plugin remove awesome-slash
claude plugin add npm:awesome-slash
```

### "GitHub CLI not found" errors

```bash
# Install and authenticate
brew install gh  # macOS
gh auth login
```

---

## Resources

- [awesome-slash Repository](https://github.com/avifenesh/awesome-slash)
- [Full Documentation](https://github.com/avifenesh/awesome-slash/blob/main/docs/INSTALLATION.md)
