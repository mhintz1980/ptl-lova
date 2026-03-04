#!/bin/bash
# Install awesome-slash for OpenCode
# Usage: ./scripts/install/opencode.sh

set -e

# Detect plugin root - works whether run directly or via bash -c
if [ -n "${BASH_SOURCE[0]}" ] && [ -f "${BASH_SOURCE[0]}" ]; then
  SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
  PLUGIN_ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"
elif [ -f "scripts/install/opencode.sh" ]; then
  PLUGIN_ROOT="$(pwd)"
elif [ -f "package.json" ] && grep -q "awesome-slash" package.json 2>/dev/null; then
  PLUGIN_ROOT="$(pwd)"
else
  echo "Error: Cannot detect plugin root. Run from the awesome-slash directory."
  exit 1
fi

echo "Installing awesome-slash for OpenCode..."
echo "Plugin root: $PLUGIN_ROOT"

# Check if OpenCode is installed
if ! command -v opencode &> /dev/null; then
  echo "Error: OpenCode not found. Please install it first."
  echo "See: https://opencode.ai/docs/cli/"
  exit 1
fi

# Check if OpenCode config directory exists
OPENCODE_CONFIG="${OPENCODE_CONFIG:-$HOME/.config/opencode}"
if [ ! -d "$OPENCODE_CONFIG" ]; then
  echo "Creating OpenCode config directory..."
  mkdir -p "$OPENCODE_CONFIG"
fi

# Install MCP server dependencies
echo "Installing MCP server dependencies..."
cd "$PLUGIN_ROOT/mcp-server"
npm install --production

# Create/update OpenCode config with MCP server
CONFIG_FILE="$OPENCODE_CONFIG/opencode.json"
echo "Configuring MCP server in $CONFIG_FILE..."

if [ -f "$CONFIG_FILE" ]; then
  cp "$CONFIG_FILE" "$CONFIG_FILE.backup"
  echo "Backed up existing config to $CONFIG_FILE.backup"
fi

# Convert Git Bash path to Windows path
# /c/Users/... -> C:/Users/...
if [[ "$PLUGIN_ROOT" == /[a-z]/* ]]; then
  DRIVE_LETTER=$(echo "$PLUGIN_ROOT" | cut -c2 | tr '[:lower:]' '[:upper:]')
  PLUGIN_ROOT_WIN="${DRIVE_LETTER}:${PLUGIN_ROOT:2}"
else
  PLUGIN_ROOT_WIN="$PLUGIN_ROOT"
fi

# Check if jq is available for JSON manipulation
if command -v jq &> /dev/null; then
  if [ -f "$CONFIG_FILE.backup" ]; then
    # Merge with existing config
    jq --arg root "$PLUGIN_ROOT_WIN" '.mcp["awesome-slash"] = {
      "type": "local",
      "command": ["node", ($root + "/mcp-server/index.js")],
      "environment": {"PLUGIN_ROOT": $root, "AI_STATE_DIR": ".opencode"},
      "enabled": true
    }' "$CONFIG_FILE.backup" > "$CONFIG_FILE"
  else
    # Create new config
    jq -n --arg root "$PLUGIN_ROOT_WIN" '{
      "mcp": {
        "awesome-slash": {
          "type": "local",
          "command": ["node", ($root + "/mcp-server/index.js")],
          "environment": {"PLUGIN_ROOT": $root, "AI_STATE_DIR": ".opencode"},
          "enabled": true
        }
      }
    }' > "$CONFIG_FILE"
  fi
else
  # Create config without jq
  cat > "$CONFIG_FILE" << EOF
{
  "mcp": {
    "awesome-slash": {
      "type": "local",
      "command": ["node", "$PLUGIN_ROOT_WIN/mcp-server/index.js"],
      "environment": {
        "PLUGIN_ROOT": "$PLUGIN_ROOT_WIN",
        "AI_STATE_DIR": ".opencode"
      },
      "enabled": true
    }
  }
}
EOF
fi

# Create commands directory (for slash commands)
COMMANDS_DIR="$OPENCODE_CONFIG/commands"
mkdir -p "$COMMANDS_DIR"

echo "Installing slash commands..."

# /next-task command
cat > "$COMMANDS_DIR/next-task.md" << 'EOF'
---
description: Start the next-task workflow for task-to-production automation
agent: workflow
---

# Next Task Workflow

Start or resume the awesome-slash next-task workflow.

## CRITICAL: Always Ask User First

**DO NOT auto-select options.** You MUST ask the user before proceeding:

1. First, use `workflow_status` MCP tool to check for existing workflow
2. If resumable workflow exists, ASK user: "Resume existing workflow or start fresh?"
3. For new workflows, ASK user to choose:
   - **Task Source**: GitHub Issues, GitLab, Local files (TASKS.md), or Custom?
   - **Priority Filter**: Bugs, Security, Features, or All?
   - **Stopping Point**: PR created, Merged, or Deployed?

## Available MCP Tools

- `workflow_status` - Check current workflow state
- `workflow_start` - Start new workflow (params: taskSource, priorityFilter, stoppingPoint)
- `workflow_resume` - Resume from checkpoint
- `workflow_abort` - Cancel and cleanup
- `task_discover` - Find tasks (params: source, filter, limit)

## Task Sources (ask user to pick)

- `gh-issues` - GitHub Issues
- `glab-issues` - GitLab Issues
- `tasks-md` - Local TASKS.md/PLAN.md/TODO.md
- `custom` - Custom CLI tool or file

## Stopping Points (ask user to pick)

- `pr-created` - Stop after PR creation
- `merged` - Stop after merge
- `deployed` - Stop after deployment

## State Directory

State is stored in `.opencode/` directory (flow.json, tasks.json).

$ARGUMENTS
EOF

# /ship command
cat > "$COMMANDS_DIR/ship.md" << 'EOF'
---
description: Ship code from commit to production with full validation
agent: ship
---

# Ship Workflow

Complete PR workflow from commit to production.

## Instructions

1. Check `workflow_status` for current state
2. Stage and commit changes with a clear message
3. Create PR using `gh pr create`
4. Run `review_code` MCP tool for multi-agent review
5. Monitor CI status and fix any failures
6. Merge when approved

## MCP Tools

- `workflow_status` - Check current state
- `review_code` - Run multi-agent code review on changed files

## Platforms Supported

- CI: GitHub Actions, GitLab CI, CircleCI, Jenkins
- Deploy: Railway, Vercel, Netlify, Fly.io

$ARGUMENTS
EOF

# /review command
cat > "$COMMANDS_DIR/review.md" << 'EOF'
---
description: Run multi-agent code review on changes
agent: review
---

# Code Review

Run comprehensive multi-agent code review.

## Instructions

Use the `review_code` MCP tool to analyze changed files.

The review checks for:
- Console debugging statements
- TODO/FIXME comments
- Commented-out code
- Debugger statements
- Empty catch blocks
- TypeScript `any` types
- Hardcoded secrets

## Usage

Call `review_code` with optional parameters:
- `files` - Array of specific files to review (defaults to git diff)
- `maxIterations` - Maximum review iterations (default: 3)

$ARGUMENTS
EOF

# /deslop command
cat > "$COMMANDS_DIR/deslop.md" << 'EOF'
---
description: Clean AI slop from codebase - debug statements, TODOs, placeholder text
agent: general
---

# Deslop - AI Slop Cleanup

Remove debugging code, old TODOs, and AI-generated slop from the codebase.

## Detection Patterns

- Console debugging (console.log, print, dbg!)
- Placeholder text (TODO, FIXME, lorem ipsum)
- Empty catch blocks
- Commented-out code
- Magic numbers
- Disabled linters

## Instructions

1. Use the `review_code` MCP tool to detect issues
2. Review the findings by severity (error, warning, info)
3. Fix critical and high severity issues
4. Report medium and low severity for manual review

$ARGUMENTS
EOF

# Create agents directory (for agent definitions)
AGENTS_DIR="$OPENCODE_CONFIG/agents"
mkdir -p "$AGENTS_DIR"

echo "Installing agent configurations..."

# Workflow orchestrator agent
cat > "$AGENTS_DIR/workflow.md" << 'EOF'
---
description: Master workflow orchestrator for task-to-production automation with MCP tools
tools:
  read: true
  write: true
  bash: true
  glob: true
  grep: true
---

# Workflow Orchestrator

You are a workflow orchestrator that manages development tasks from discovery to production.

## MCP Tools Available

Use the awesome-slash MCP tools:
- `workflow_status` - Check current workflow state
- `workflow_start` - Start a new workflow
- `workflow_resume` - Resume from checkpoint
- `workflow_abort` - Cancel and cleanup
- `task_discover` - Find and prioritize tasks
- `review_code` - Run multi-agent review

## Workflow Phases

1. Policy Selection - Configure task source, priority, stopping point
2. Task Discovery - Find and prioritize tasks
3. Worktree Setup - Create isolated environment
4. Exploration - Deep codebase analysis
5. Planning - Design implementation plan
6. User Approval - Get plan approval
7. Implementation - Execute the plan
8. Review Loop - Multi-agent review until approved
9. Ship - PR creation, CI monitoring, merge
10. Cleanup - Remove worktree, update state

When starting, check for existing workflow with `workflow_status` first.
EOF

# Review agent (subagent)
cat > "$AGENTS_DIR/review.md" << 'EOF'
---
description: Multi-agent code reviewer for quality analysis
tools:
  read: true
  write: false
  edit: false
  bash: false
  glob: true
  grep: true
---

# Code Review Agent

Run comprehensive code review using the awesome-slash `review_code` MCP tool.

## Review Domains

- Code quality analysis
- Silent failure detection
- Test coverage analysis
- Security review

## Process

1. Call `review_code` with files to review
2. Report issues by severity (critical, high, medium, low)
3. Auto-fix critical and high severity issues
4. Report medium and low for manual review
EOF

# Ship agent (subagent)
cat > "$AGENTS_DIR/ship.md" << 'EOF'
---
description: Complete PR workflow from commit to production
tools:
  read: true
  write: true
  bash: true
  glob: true
  grep: true
permission:
  bash:
    "git *": allow
    "gh *": allow
    "*": ask
---

# Ship Agent

Complete PR workflow from commit to production.

## Workflow

1. Stage and commit changes with AI-generated message
2. Create PR with context
3. Run `review_code` MCP tool for multi-agent review
4. Monitor CI status
5. Merge when approved
6. Deploy if configured

## Platform Support

- CI: GitHub Actions, GitLab CI, CircleCI
- Deploy: Railway, Vercel, Netlify, Fly.io
EOF

echo ""
echo "✓ Installation complete!"
echo ""
echo "Installed:"
echo "  - MCP server: awesome-slash"
echo "  - Commands: /next-task, /ship, /review, /deslop"
echo "  - Agents: workflow, review, ship"
echo ""
echo "Usage:"
echo "  1. Start OpenCode: opencode"
echo "  2. Use slash commands: /next-task, /ship, /review, /deslop"
echo "  3. Switch agents with Tab: workflow, review, ship"
echo "  4. MCP tools available in prompts: workflow_status, task_discover, etc."
echo ""
echo "To verify installation:"
echo "  opencode mcp list"
echo "  ls ~/.config/opencode/commands/"
echo "  ls ~/.config/opencode/agents/"
