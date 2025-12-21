# Staged for Powder Buffer Support - Design

## Design section 1: Data model + configuration
We will keep truth vs projection separation intact. Truth is only stage moves; projection uses settings and vendor throughput. Add `powderCoatVendorId?: string | null` to the Pump type if it is not already present, explicitly as truth metadata (assignment/location) with no implied stage progress. Stage progress remains strictly event history.

Add a new settings field `stagedForPowderBufferDays` in the same config store as the existing planning inputs, defaulting to 1 working day. The default is in-memory only: if persisted settings omit it, treat the value as 1 at runtime, but do not write it back until the user explicitly saves Settings. Input is integer working days, min 0.

Define “completed STAGED_FOR_POWDER” by history: a pump has completed it only if it has ever transitioned out of `STAGED_FOR_POWDER` into `POWDER_COAT` (or beyond). Current stage ordering is not sufficient, since rework can move a pump backward. This definition will be used by projection and by “actual” duration calculations.

If a pump is currently in `STAGED_FOR_POWDER`, projection uses remaining buffer: `remainingDays = max(0, bufferDays - elapsedWorkingDaysSinceStageEntry)`. This prevents double-counting time already spent in stage when settings change. Weekends count as zero for all working-day math.

## Design section 2: Projection + stage history handling
Projection remains pure and non-mutating. Insert a `STAGED_FOR_POWDER` segment between FABRICATION and POWDER_COAT in the timeline generator. Its length is based on the buffer days setting, but only for pumps that haven’t completed the stage by history. If the pump is currently in `STAGED_FOR_POWDER`, apply remaining buffer time (buffer minus elapsed working days since stage entry). If the pump has already exited to POWDER_COAT or beyond, treat buffer as zero in projection.

Vendor throughput gating remains the source of “when POWDER_COAT can accept a pump.” If weekly capacity blocks entry, the waiting time manifests as extended `STAGED_FOR_POWDER` (the waiting room). POWDER_COAT duration stays fixed at 5 working days. Weekends contribute zero in all day counts.

Stage history evaluation relies on recorded stage-move events, not current stage ordering. A pump can move backward for rework; projections must respect that history: “completed STAGED_FOR_POWDER” means an actual transition out of it to POWDER_COAT or beyond, regardless of current stage. If the pump re-enters `STAGED_FOR_POWDER`, elapsed time for the current stint is computed from the most recent entry event; projection uses remaining buffer from that entry.

## Design section 3: UI updates (Settings, Pump Details, Kanban badges)
Settings modal: add a numeric input alongside the stage planning defaults: label “Staged for Powder (buffer) — working days,” helper text “Buffer time before powder pickup/acceptance.” The input will be an integer (min 0, max ~30) and will bind to `stagedForPowderBufferDays`. It should not auto-persist; it should update in-memory draft state and only write on Save. When saved, projections recompute immediately.

Pump Details modal: update the rolled-up stage estimates section to support mixed units. Work stages (FABRICATION, ASSEMBLY, SHIP) continue showing estimated man-hours. Buffer/vendor stages (STAGED_FOR_POWDER, POWDER_COAT) show working days. For STAGED_FOR_POWDER specifically, planned uses the buffer setting (plus any vendor-capacity extension if already surfaced in projection), and actual is computed from stage-move timestamps (entry to exit, or entry to today if still in stage), in working days. This keeps actuals derived from truth events and avoids inventing data.

Kanban cards: add a small vendor badge on `STAGED_FOR_POWDER` and `POWDER_COAT` cards. If `powderCoatVendorId` is set, show the vendor’s display name; otherwise show “🎨 Unassigned.” The badge is purely informational; it does not affect stage progress. We will not group columns by vendor to keep UI changes minimal.
