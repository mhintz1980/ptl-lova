#!/usr/bin/env node
/**
 * Setup git hooks for development
 * Installs pre-commit hook that auto-syncs lib/ to plugins/
 */

const fs = require('fs');
const path = require('path');

const hookDir = path.join(__dirname, '..', '.git', 'hooks');
const preCommitPath = path.join(hookDir, 'pre-commit');

const preCommitHook = `#!/bin/sh
# Auto-sync lib/ to plugins/ when lib/ files are staged

if git diff --cached --name-only | grep -q "^lib/"; then
  echo "lib/ changes detected, syncing to plugins..."
  bash scripts/sync-lib.sh
  git add plugins/*/lib/
  echo "Synced and staged plugin lib/ copies"
fi
`;

// Only run in git repo (not when installed as npm package)
if (!fs.existsSync(hookDir)) {
  // Not a git repo or installed as dependency - skip silently
  process.exit(0);
}

try {
  fs.writeFileSync(preCommitPath, preCommitHook, { mode: 0o755 });
  console.log('Git pre-commit hook installed');
} catch (err) {
  // Non-fatal - might not have write permissions
  console.warn('Could not install git hook:', err.message);
}
