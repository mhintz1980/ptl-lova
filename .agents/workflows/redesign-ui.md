---
description: Propose a UI/UX redesign for the current feature or page. Accepts argument [intensity] 'tweak', 'random', or 'massive'.
---

This workflow guides the AI to automatically propose UI/UX redesigns based on the project's design philosophy (e.g., Kanban Hub consolidation, Dual-Mode Workbench, Inbox Zero paradigm, and accessible interfaces).

When the user runs `/redesign-ui [intensity]`, follow these steps:

1. **Analyze Current State**: Review the code for the current active file or component to understand its purpose and current UI limitations.
2. **Apply Design Philosophy**: Keep in mind the project's goal of simplifying the app UI by removing redundancies, making the system powerful but accessible to users without business degrees, and utilizing modern paradigms like command palettes and smart grouping.
3. **Execute based on `[intensity]`**:
   - **`tweak`**: Propose minor, high-impact improvements. Focus on spacing, typography, colors, micro-animations, or simplifying existing elements without changing the core layout. Keep it safe and iterative.
   - **`random`**: Propose an unconventional, "out-of-the-box" UI/UX approach. Think laterally. How could this be radically different but solve the same problem? (e.g., replacing a table with a swipeable card deck, using a timeline, etc.)
   - **`massive`**: Fundamentally rethink and consolidate the feature. Propose structural changes like merging it with other pages, converting it into a global modal/drawer, or shifting the entire interaction paradigm (like the "Kanban Hub" or "Inbox Zero" concepts).
4. **Draft the Proposal**: Present a concise summary of the proposed changes and the reasoning behind them.
5. **Image Verification**: Explicitly ask the user if they would like you to generate an image mockup of the proposed redesign concept before you write any code. Wait for their answer before generating the image or writing code. If they say yes, use the generate_image tool to create a visual representation of your proposal.
6. **Next Steps**: Suggest the next specific steps or code changes to execute if the user approves the direction. Do NOT execute the code changes until the user approves.
