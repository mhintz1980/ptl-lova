# Plan: Report-Centric Modal Architecture Analysis

## Overview

As the application scales, data density increases. This plan proposes moving heavy analytical tasks (Reporting, Forecasting, Digital DNA Analysis) from permanent page real estate into focused, modal-based **"Intelligence Overlays"**.

## Core Architecture

- **Analytical vs. Operational**: The "Workbench" is for _doing_; the "Report Center" is for _viewing_.
- **Report Center Modal**:
  - A full-screen or large-scale modal triggered by a specialized "Report" button.
  - Contains a sidebar for preset layouts (Daily Production, Quality Report, Ship Forecast).
  - Allows users to save and reuse custom layouts.
- **Modal-Based Digital DNA**: Instead of expanding rows in the Orders table, Digital DNA analysis is moved to a dedicated "Deep Dive" modal, allowing for more screen space and detailed charting.
- **Scheduling Overlay**: The full Scheduling calendar becomes an overlay, allowing users to quickly check capacity without leaving the Kanban context.

## Strategic Shift

- **Digital DNA**: Moved from a table row to a rich, full-screen visualization modal.
- **Dashboard**: Replaced by a high-fidelity "Report Builder" modal.

## Benefits

- **Performance**: Heavy chart libraries only load or render when the modal is active.
- **Clarity**: The main operational view remains lightweight and fast.
- **Professionalism**: Focused reporting environments feel more like high-end enterprise tools.

## Implementation Steps

- [ ] Create `ReportCenterModal` component.
- [ ] Refactor `DigitalDNA` to support a full-screen "Pro" view.
- [ ] Implement layout persistence in the store.
