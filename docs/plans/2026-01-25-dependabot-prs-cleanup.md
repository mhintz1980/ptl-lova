# Dependabot PR Cleanup Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Document improvements from open Dependabot PRs, close those PRs, and re-apply the same dependency bumps directly onto the current working branch.

**Architecture:** Use GitHub CLI to extract PR body/release notes for a concise summary, then close the PRs. Update dependencies via `pnpm up` so `package.json` and `pnpm-lock.yaml` stay in sync, and verify with a build or tests.

**Tech Stack:** GitHub CLI (`gh`), pnpm, Vite/TypeScript toolchain.

### Task 1: Document PR improvements

**Files:**
- Modify: None (deliver summary to user in response or save a short note if requested)

**Step 1: Collect PR release notes**

Run:
```bash
gh pr view 39 --json body
gh pr view 40 --json body
gh pr view 41 --json body
gh pr view 42 --json body
gh pr view 43 --json body
```
Expected: PR bodies include Dependabot release notes or links.

**Step 2: Summarize improvements**

Create a concise bullet summary for each PR (dependency + improvements) and present it to the user for a keep/drop decision.

### Task 2: Close the Dependabot PRs

**Files:**
- Modify: None (GitHub PR state only)

**Step 1: Close PRs with a short reason**

Run:
```bash
gh pr close 39 --comment "Superseded; will reapply dependency bumps directly on branch."
gh pr close 40 --comment "Superseded; will reapply dependency bumps directly on branch."
gh pr close 41 --comment "Superseded; will reapply dependency bumps directly on branch."
gh pr close 42 --comment "Superseded; will reapply dependency bumps directly on branch."
gh pr close 43 --comment "Superseded; will reapply dependency bumps directly on branch."
```
Expected: PRs are closed and no longer appear in `gh pr list`.

### Task 3: Re-implement dependency bumps on the working branch

**Files:**
- Modify: `package.json`
- Modify: `pnpm-lock.yaml`

**Step 1: Update dependencies**

Run:
```bash
pnpm up react-router-dom@7.13.0 \
  @playwright/test@1.58.0 \
  @testing-library/react@16.3.2 \
  autoprefixer@10.4.23 \
  vitest@4.0.18
```
Expected: `package.json` and `pnpm-lock.yaml` updated to target versions.

**Step 2: Verify**

Run:
```bash
pnpm build
```
Expected: Build succeeds or any pre-existing failures are reported for follow-up.

**Step 3: Report results**

Summarize dependency changes and any verification failures to the user.
