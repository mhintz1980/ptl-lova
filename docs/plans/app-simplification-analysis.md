# Plan: App Simplification Analysis (Consolidation)

## Overview

The current PumpTracker Lite application is split across four primary routes (Dashboard, Kanban, Scheduling, Orders), leading to context switching overhead and redundant UI components. This plan outlines the requirements for consolidating these views into a single-page **"Operational Workbench"**.

## Goals

- **Eliminate Navigation Latency**: Move almost everything to a single scrollable view.
- **Reduce Redundancy**: Consolidate overlapping features (e.g., Dashboard's Data Mode vs. Orders Page).
- **Focus the Experience**: Prioritize the Kanban board as the primary "Command Center".

## Strategic Consolidation

- **Primary Section**: The Kanban Board, occupying the center of the viewport.
- **Top Section**: A sticky header containing a global Search/Filter and a low-profile KPI Strip.
- **Collapsible Analytics**: The current Dashboard charts move to a collapsible panel above the Kanban board.
- **Collapsible Orders**: The Orders table moves to a collapsible drawer or bottom section.

## Benefits

- Improved cognitive load: The user never loses their place on the Kanban board.
- Unified state: Filters apply to the whole page simultaneously.
- Faster interaction: No loading states between page transitions.

## Success Criteria

- [ ] Routes `/dashboard`, `/kanban`, `/orders` are removed or redirected.
- [ ] Users can toggle between analytical (charts) and operational (kanban) views without page loads.
- [ ] Performance remains stable with more components on a single page.
