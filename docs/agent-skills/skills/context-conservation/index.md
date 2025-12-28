# Context Conservation

> **Theme**: Every token counts. Agents should minimize context consumption while maximizing effectiveness.

## TL;DR: The 10 Rules

| #   | Rule                 | Description                                      |
| --- | -------------------- | ------------------------------------------------ |
| 1   | **Outline First**    | Run `view_file_outline` before full file reads   |
| 2   | **Line Limits**      | Components: 200 max, Docs: 300 max               |
| 3   | **Header Summaries** | New files start with purpose/exports comment     |
| 4   | **Tiered Docs**      | Summary (50 lines) → Detail (on-demand)          |
| 5   | **Link Over Inline** | Never paste full content in artifacts            |
| 6   | **Minimal Handoffs** | Handoff docs: 30 lines max                       |
| 7   | **Lazy Loading**     | Load docs on-demand, not upfront                 |
| 8   | **Targeted Reads**   | Use line ranges, never read entire files         |
| 9   | **grep Before View** | Search for specific content first                |
| 10  | **Turbo Workflows**  | Use pre-approved commands in `.agent/workflows/` |

---

## Why Context Conservation?

Context windows are expensive and limited. Every token consumed by documentation, code, or conversation history is a token not available for reasoning about the actual task.

**The math**: A 128K context window sounds large, but:

- System prompts: ~10K tokens
- Conversation history: ~20K tokens
- Code files: 1 file = 500-2000 tokens
- After 5-6 file reads: **50%+ capacity consumed**

**The goal**: Maximize information density per token.

---

## Rule Details

### 1. Outline First

> **Before reading any file, run `view_file_outline`.**

The outline shows all functions/classes in ~20 lines. Only request full content for specific items you need.

```
❌ 500+ tokens: view_file(/path/to/large-component.tsx)
✅ 20 tokens: view_file_outline(/path/to/large-component.tsx)
   → Then view_code_item for specific functions
```

### 2. Line Limits

> **Keep files small enough for single-pass reading.**

| File Type | Max Lines | Action if Exceeded            |
| --------- | --------- | ----------------------------- |
| Component | 200       | Split into sub-components     |
| Document  | 300       | Create summary + detail files |
| Plan      | 150       | Separate into phases          |

### 3. Header Summaries

> **Every new file starts with a structured header.**

```typescript
/**
 * @purpose One-line description
 * @exports ComponentName, helperFunction
 * @depends ../../store, ../ui/Button
 */
```

Agents can read just the header to understand a file's role.

### 4. Tiered Documentation

> **Summary → Detail pattern for all docs.**

- **Tier 0**: Index entry (1 line description)
- **Tier 1**: Summary file (50 lines max)
- **Tier 2**: Full documentation (loaded on-demand)

Example: `GEMINI.md` is Tier 1 → links to Tier 2 docs in `docs/`.

### 5. Link Over Inline

> **Never paste full file content in artifacts. Use file links.**

```markdown
❌ Here is the full content:
[200 lines of code]

✅ See [ComponentName.tsx](file:///path/to/ComponentName.tsx)
```

### 6. Minimal Handoffs

> **Agent handoff documents: 30 lines max.**

```markdown
## Handoff: [Task Name]

**Goal**: One sentence
**Current State**: 2-3 sentences
**Next Action**: Concrete step
**Blockers**: List or "None"
**Key Files**: Links only
```

### 7. Lazy Loading

> **Load documentation on-demand, not in bootloader.**

`GEMINI.md` says "For X, see docs/X.md" — doesn't contain X inline.

### 8. Targeted Reads

> **Use line ranges when you know what you need.**

```
❌ view_file(/path/to/file.ts)           # All 400 lines
✅ view_file(..., StartLine=50, EndLine=80)  # Just 30 lines
```

### 9. grep Before View

> **Search for specific content instead of reading entire files.**

```bash
# Looking for a specific constant?
❌ Read the whole file to find it
✅ grep_search(Query="STAGE_POWDER", SearchPath="src/")
```

### 10. Turbo Workflows

> **Use pre-approved command sequences for common tasks.**

Files in `.agent/workflows/` with `// turbo-all` annotation run without confirmation, reducing conversation overhead.

---

## Integration with Existing Infrastructure

This skill builds on Phase 1-2 work documented in [integration-plan.md](../integration-plan.md):

- **Context Budget Thresholds**: 70% warning, 80% compaction trigger
- **Session State**: `/ai_working/session-state.md` for multi-turn tasks
- **Memory System**: `/ai_working/memory/` for cross-session knowledge
- **Degradation Self-Check**: Recovery protocol in [AGENTS.md](../../../../AGENTS.md)

---

## Related Documentation

- [AGENTS.md](../../../../AGENTS.md) - Repository operating manual
- [GEMINI.md](../../../../GEMINI.md) - Agent bootloader (example of Tier 1 doc)
- [integration-plan.md](../integration-plan.md) - Full skills integration roadmap

---

**Version**: 1.0  
**Created**: 2025-12-28
