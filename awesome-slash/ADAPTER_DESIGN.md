# Multi-Tool Adapter Design

> **Status:** Design Document - Implementation In Progress
>
> This is an architectural design document for internal reference. MCP server integration is complete and functional. Platform-specific installation scripts are available.

## Overview

This document describes the adapter layer for supporting awesome-slash commands across multiple AI coding tools.

## Supported Tools

1. **Claude Code** - Anthropic's official CLI (primary target)
2. **Codex CLI** - OpenAI's Codex command-line interface
3. **OpenCode** - Open-source alternative AI coding assistant

## Key Finding

All three tools support **markdown-based slash commands** with similar syntax:
- Commands defined in `.md` files
- Support `$ARGUMENTS` placeholder for dynamic input
- Similar command structure and flow

## Architecture

### No Format Translation Needed ✓

Since all tools use markdown, we don't need format converters. Instead, we provide:
1. **Installation scripts** per tool
2. **Tool-specific configuration**
3. **Compatibility notes** for tool-specific features

### Directory Structure

```
awesome-slash/
├── plugins/                      # Claude Code plugins (current)
│   ├── deslop-around/
│   ├── next-task/
│   ├── project-review/
│   └── ship/
├── adapters/                     # NEW: Tool-specific adapters
│   ├── codex/
│   │   ├── install.sh           # Codex CLI installation script
│   │   ├── README.md            # Codex-specific docs
│   │   └── prompts/             # Symlinks to commands
│   ├── opencode/
│   │   ├── install.sh           # OpenCode installation script
│   │   ├── README.md            # OpenCode-specific docs
│   │   └── commands/            # Symlinks to commands
│   └── README.md                # Adapter overview
└── lib/                          # Shared utilities (unchanged)
```

## Installation Strategies

### Claude Code (Current - No Changes)

```bash
claude plugin marketplace add avifenesh/awesome-slash
claude plugin install deslop-around@awesome-slash
```

### Codex CLI (NEW)

```bash
# Clone repository
git clone https://github.com/avifenesh/awesome-slash.git
cd awesome-slash

# Run Codex installer
./adapters/codex/install.sh

# Commands become available as:
# /ship, /deslop-around, /next-task, /project-review
```

### OpenCode (NEW)

```bash
# Clone repository
git clone https://github.com/avifenesh/awesome-slash.git
cd awesome-slash

# Run OpenCode installer
./adapters/opencode/install.sh

# Commands become available as:
# /ship, /deslop-around, /next-task, /project-review
```

## Tool-Specific Differences

### Codex CLI Specifics

**Path References:**
- Update `${CLAUDE_PLUGIN_ROOT}` → `${CODEX_PROMPTS_DIR}`
- Node.js script paths need absolute paths

**Platform Detection:**
- Works as-is (uses standalone Node.js scripts)

**Limitations:**
- May not support Claude-specific subagents
- Task tool not available (use alternative approaches)

### OpenCode Specifics

**Path References:**
- Update `${CLAUDE_PLUGIN_ROOT}` → `${OPENCODE_COMMANDS_DIR}`
- Bash scripts work natively

**Platform Detection:**
- Works as-is (uses standalone Node.js scripts)

**Special Features:**
- Can use `@filename` for file includes
- Can use `!command` for bash command output injection

**Limitations:**
- May have different agent/plugin ecosystem
- Task tool may not be available

## Command Compatibility Matrix

| Command | Claude Code | Codex CLI | OpenCode | Notes |
|---------|-------------|-----------|----------|-------|
| `/deslop-around` | ✅ Full | ✅ Full | ✅ Full | Pure bash, fully compatible |
| `/next-task` | ✅ Full | ⚠️ Partial | ⚠️ Partial | Needs `gh` CLI, code validation works |
| `/project-review` | ✅ Full | ⚠️ Partial | ⚠️ Partial | Multi-agent may differ per tool |
| `/ship` | ✅ Full | ⚠️ Partial | ⚠️ Partial | CI/CD detection works, subagents may differ |

**Legend:**
- ✅ Full: Complete feature parity
- ⚠️ Partial: Core features work, some advanced features may differ
- ❌ Limited: Significant limitations

## Implementation Status

### Phase 1: Adapter Architecture ✅
- [x] Research Codex CLI
- [x] Research OpenCode
- [x] Design adapter architecture
- [x] MCP server implementation complete

### Phase 2: Installation Scripts ✅
- [x] Write `scripts/install/claude.sh`
- [x] Write `scripts/install/codex.sh`
- [x] Write `scripts/install/opencode.sh`

### Phase 3: Integration Strategy 🚧
- [x] MCP server for cross-platform tools
- [x] Platform detection working
- [ ] Full testing on Codex CLI
- [ ] Full testing on OpenCode

### Phase 4: Documentation ✅
- [x] CROSS_PLATFORM.md complete
- [x] Update main README with multi-tool support
- [x] Installation guides for all platforms

### Phase 5: Testing 🚧
- [x] Test all commands on Claude Code
- [ ] Complete testing on Codex CLI
- [ ] Complete testing on OpenCode
- [x] Add troubleshooting guides

## Path Variable Strategy

Commands reference paths like:
```bash
node ${CLAUDE_PLUGIN_ROOT}/lib/platform/detect-platform.js
```

**Solution**: Environment variable substitution in install scripts

```bash
# Codex install.sh
export CODEX_PROMPTS_DIR="$HOME/.codex/prompts/awesome-slash"
sed "s|\${CLAUDE_PLUGIN_ROOT}|$CODEX_PROMPTS_DIR|g" ...

# OpenCode install.sh
export OPENCODE_COMMANDS_DIR="$HOME/.opencode/commands/awesome-slash"
sed "s|\${CLAUDE_PLUGIN_ROOT}|$OPENCODE_COMMANDS_DIR|g" ...
```

## Maintenance Strategy

**Single Source of Truth**: Commands live in `plugins/*/commands/*.md`

**Adapters**: Installers create symlinks + path adjustments

**Updates**: Update command files once, run installer again to sync

## Success Criteria

- [ ] All 4 commands installable on Codex CLI
- [ ] All 4 commands installable on OpenCode
- [ ] Platform detection works on all tools
- [ ] Clear documentation per tool
- [ ] Automated installation (one command)
- [ ] Easy to update (re-run installer)

## Future Enhancements

- CI/CD testing on all 3 tools
- Version compatibility matrix
- Tool feature detection
- Graceful degradation per tool
- Auto-updater scripts
