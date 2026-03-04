#!/bin/bash
# Install awesome-slash for Codex CLI
# Usage: ./scripts/install/codex.sh

set -e

# Detect plugin root - works whether run directly or via bash -c
if [ -n "${BASH_SOURCE[0]}" ] && [ -f "${BASH_SOURCE[0]}" ]; then
  SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
  PLUGIN_ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"
elif [ -f "scripts/install/codex.sh" ]; then
  PLUGIN_ROOT="$(pwd)"
elif [ -f "package.json" ] && grep -q "awesome-slash" package.json 2>/dev/null; then
  PLUGIN_ROOT="$(pwd)"
else
  echo "Error: Cannot detect plugin root. Run from the awesome-slash directory."
  exit 1
fi

echo "Installing awesome-slash for Codex CLI..."
echo "Plugin root: $PLUGIN_ROOT"

# Check if codex is installed
if ! command -v codex &> /dev/null; then
  echo "Error: Codex CLI not found. Please install it first."
  echo "See: https://developers.openai.com/codex/quickstart/"
  exit 1
fi

# Install MCP server dependencies
echo "Installing MCP server dependencies..."
cd "$PLUGIN_ROOT/mcp-server"
npm install --production

# Configure MCP server in config.toml
echo "Configuring MCP server..."

CODEX_HOME="${CODEX_HOME:-$HOME/.codex}"
CONFIG_FILE="$CODEX_HOME/config.toml"

# Ensure config directory exists
mkdir -p "$CODEX_HOME"

# Create config file if it doesn't exist
if [ ! -f "$CONFIG_FILE" ]; then
  touch "$CONFIG_FILE"
fi

# Backup existing config
cp "$CONFIG_FILE" "$CONFIG_FILE.backup"

# Remove existing awesome-slash MCP server section if present
if grep -q "\[mcp_servers.awesome-slash\]" "$CONFIG_FILE" 2>/dev/null; then
  # Use sed to remove the section (from [mcp_servers.awesome-slash] to next section or EOF)
  sed -i '/\[mcp_servers\.awesome-slash\]/,/^\[/{/^\[mcp_servers\.awesome-slash\]/d;/^\[/!d}' "$CONFIG_FILE"
  # Clean up any trailing empty lines
  sed -i '/^$/N;/^\n$/d' "$CONFIG_FILE"
fi

# Convert Git Bash path to Windows path for TOML
# /c/Users/... -> C:/Users/...
if [[ "$PLUGIN_ROOT" == /[a-z]/* ]]; then
  DRIVE_LETTER=$(echo "$PLUGIN_ROOT" | cut -c2 | tr '[:lower:]' '[:upper:]')
  PLUGIN_ROOT_WIN="${DRIVE_LETTER}:${PLUGIN_ROOT:2}"
else
  PLUGIN_ROOT_WIN="$PLUGIN_ROOT"
fi
MCP_SERVER_PATH="$PLUGIN_ROOT_WIN/mcp-server/index.js"

# Append MCP server configuration
cat >> "$CONFIG_FILE" << EOF

[mcp_servers.awesome-slash]
command = "node"
args = ["$MCP_SERVER_PATH"]
env = { PLUGIN_ROOT = "$PLUGIN_ROOT_WIN", AI_STATE_DIR = ".codex" }
enabled = true
EOF

echo "MCP server configured in $CONFIG_FILE"

# Create skills directory
CODEX_HOME="${CODEX_HOME:-$HOME/.codex}"
SKILLS_DIR="$CODEX_HOME/skills"

echo "Installing Codex skills..."

# Create next-task skill
mkdir -p "$SKILLS_DIR/next-task"
cat > "$SKILLS_DIR/next-task/SKILL.md" << 'EOF'
---
name: next-task
description: Master workflow orchestrator for task-to-production automation. Use this skill when users want to find their next task, prioritize work, start a new workflow, resume an interrupted workflow, or ask "what should I work on next". Integrates with GitHub Issues, Linear, and local task files for task discovery.
---

# Next Task Workflow

Find and implement the next priority task with full workflow automation.

## CRITICAL: Always Ask User First

**DO NOT auto-select options.** You MUST ask the user:

1. First call `workflow_status` MCP tool to check for existing workflow
2. If resumable, ASK: "Resume existing workflow or start fresh?"
3. For new workflows, ASK user to choose:
   - **Task Source**: GitHub Issues, GitLab, Local files, or Custom?
   - **Priority Filter**: Bugs, Security, Features, or All?
   - **Stopping Point**: PR created, Merged, or Deployed?

## MCP Tools

- `workflow_status` - Check current workflow state
- `workflow_start` - Start workflow (params: taskSource, priorityFilter, stoppingPoint)
- `workflow_resume` - Resume from checkpoint
- `workflow_abort` - Cancel and cleanup
- `task_discover` - Find tasks (params: source, filter, limit)

## Task Sources (ask user)

- `gh-issues` - GitHub Issues
- `glab-issues` - GitLab Issues
- `tasks-md` - Local TASKS.md/PLAN.md/TODO.md
- `custom` - Custom file path

## Stopping Points (ask user)

- `pr-created` - Stop after PR
- `merged` - Stop after merge
- `deployed` - Stop after deployment

## State Directory

State stored in `.codex/` (flow.json, tasks.json)
EOF

# Create ship skill
mkdir -p "$SKILLS_DIR/ship"
cat > "$SKILLS_DIR/ship/SKILL.md" << 'EOF'
---
name: ship
description: Complete PR workflow from commit to production with validation. Use this skill when users want to ship code, create a pull request, merge changes, deploy to production, or finish their current work. Handles commit creation, PR creation, CI monitoring, code review, merge, and deployment validation.
---

# Ship Workflow

Complete PR workflow from commit to production.

## MCP Tools Available

- `workflow_status` - Check current state
- `review_code` - Run multi-agent code review

## Workflow Instructions

1. Check `workflow_status` for current state
2. Stage and commit changes with a clear, descriptive message
3. Create PR using `gh pr create` with context
4. Run `review_code` MCP tool for multi-agent review
5. Monitor CI status and fix any failures
6. Merge when approved
7. Validate deployment if configured

## Supported Platforms

**CI Platforms:**
- GitHub Actions
- GitLab CI
- CircleCI
- Jenkins
- Travis CI

**Deployment Platforms:**
- Railway
- Vercel
- Netlify
- Fly.io
- Platform.sh
- Render
EOF

# Create review skill
mkdir -p "$SKILLS_DIR/review"
cat > "$SKILLS_DIR/review/SKILL.md" << 'EOF'
---
name: review
description: Run multi-agent code review on changes. Use this skill when users want to review code, check code quality, run code analysis, find bugs, check for security issues, or validate changes before committing or creating a pull request.
---

# Code Review

Run multi-agent code review on changes.

## How To Run

**Step 1: Get files to review**

If user provided files, use those. Otherwise get changed files:
```bash
git diff --name-only HEAD
```

**Step 2: Call review_code MCP tool**
```
review_code({ files: ["src/file1.ts", "src/file2.ts"] })
```

## Review Checks

- Console debugging statements (console.log, print, dbg!)
- TODO/FIXME comments
- Commented-out code
- Debugger statements
- Empty catch blocks
- TypeScript `any` types
- Hardcoded secrets

## Default Behavior

If no files specified:
1. Get changed files via `git diff --name-only HEAD`
2. If no changes, ASK user: "Which files should I review?"
3. Never review 0 files silently
EOF

# Create deslop skill
mkdir -p "$SKILLS_DIR/deslop"
cat > "$SKILLS_DIR/deslop/SKILL.md" << 'EOF'
---
name: deslop
description: Clean AI slop from codebase. Use this skill when users want to clean up code, remove debugging statements, delete console.log calls, remove TODO comments, clean placeholder text, remove empty catch blocks, or prepare code for production by removing development artifacts.
---

# Deslop - AI Slop Cleanup

Remove debugging code, old TODOs, and AI-generated slop from the codebase.

## How To Run

**Step 1: Get files to analyze**

If user provided a path, use that. Otherwise:
```bash
# Get changed files (staged + unstaged)
git diff --name-only HEAD
# Or get all source files in a directory
find src -type f \( -name "*.ts" -o -name "*.js" -o -name "*.py" \)
```

**Step 2: Call review_code MCP tool with files**
```
review_code({ files: ["src/file1.ts", "src/file2.ts"] })
```

**Step 3: Fix issues found**

Review findings by severity and apply fixes.

## Detection Patterns

- Console debugging (console.log, print(), dbg!())
- Placeholder text (TODO, FIXME, lorem ipsum)
- Empty catch blocks
- Commented-out code blocks
- Disabled linters (eslint-disable, @ts-ignore)

## Default Behavior

If no path specified:
1. First check `git diff --name-only` for changed files
2. If no changes, ASK user: "Which directory should I scan?"
3. Never scan 0 files silently
EOF

# Create workflow-status skill for quick status checks
mkdir -p "$SKILLS_DIR/workflow-status"
cat > "$SKILLS_DIR/workflow-status/SKILL.md" << 'EOF'
---
name: workflow-status
description: Check the current workflow status. Use this skill when users ask about current task status, workflow progress, what phase they're in, or want to see the state of their work.
---

# Workflow Status

Quick check of the current workflow state.

## MCP Tools Available

- `workflow_status` - Get current workflow state

## Instructions

Simply call the `workflow_status` MCP tool to retrieve:
- Current task being worked on
- Current workflow phase
- Resume capability
- PR status if applicable
- Last update timestamp

## Status Information

The status includes:
- **task** - Current task title and ID
- **phase** - Current workflow phase (exploration, planning, implementation, etc.)
- **status** - Current status (in_progress, completed, failed)
- **pr** - Pull request number and URL if created
- **canResume** - Whether the workflow can be resumed
EOF

echo ""
echo "✓ Installation complete!"
echo ""
echo "Installed:"
echo "  - MCP server: awesome-slash"
echo "  - Skills: next-task, ship, review, deslop, workflow-status"
echo ""
echo "Usage:"
echo "  1. Start Codex: codex"
echo "  2. Skills are automatically selected based on your request"
echo "  3. Or invoke directly: \$next-task, \$ship, \$review, \$deslop"
echo "  4. MCP tools: workflow_status, workflow_start, task_discover, review_code"
echo ""
echo "To verify installation:"
echo "  cat ~/.codex/config.toml  # Check MCP server config"
echo "  ls ~/.codex/skills/       # Check installed skills"
