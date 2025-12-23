---
scope: Dashboard charts with Recharts, CSS/Tailwind styling
kind: system
content_hash: d144b54e7d49bdb720663b394a3e4dbb
---

# Hypothesis: Gemini Flash Visual Prototyping

Use Gemini Flash (Nano Banana) for rapid visual iteration. Flash will:
1. Take screenshots of current dashboard charts
2. Generate multiple visual variations with different color schemes, layouts, and styling
3. Produce image references showing "before vs after" comparisons
4. Create CSS/Tailwind snippets matching each visual variation

Implementation: Iterate quickly through visual options using Flash's image generation, then implement the chosen direction manually or with Sonnet 4.5.

## Rationale
{"anomaly": "Can't visualize aesthetic improvements without seeing them", "approach": "Use Flash's image generation to create rapid visual prototypes", "alternatives_rejected": ["Code-only iteration (slower, requires running dev server)", "Manual mockups (time-consuming)"]}