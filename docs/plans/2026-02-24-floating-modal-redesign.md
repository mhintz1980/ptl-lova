# Floating 3D Modal Redesign Proposal

**Date**: 2026-02-24
**Status**: Draft
**Author**: Architect Mode

---

## Executive Summary

This proposal addresses two modal UX issues:
1. **ControlFlyout** (charts flyout) - too small and cramped for filter controls
2. **ScheduleModal** (scheduling modal) - too big, covers entire screen without "floating" feel

The proposed solution implements a **floating 3D design** with glassmorphism effects, proper sizing constraints, and animated entrance/exit transitions.

---

## Current State Analysis

### ScheduleModal - Current Implementation

**File**: [`src/components/modals/ScheduleModal.tsx`](src/components/modals/ScheduleModal.tsx:1)

**Current Styling**:
```tsx
<div className="fixed inset-0 z-[60] flex flex-col bg-background/98 backdrop-blur-xl">
```

**Issues Identified**:
| Issue | Description |
|-------|-------------|
| Full screen coverage | `inset-0` makes modal cover 100% of viewport |
| No visual separation | Background nearly opaque at 98% |
| No 3D depth | Flat appearance, no shadow or transform |
| No margin/breathing room | Content touches screen edges |
| No entrance animation | Appears instantly without transition |

**Content Complexity**: Contains full [`SchedulingView`](src/components/scheduling/SchedulingView.tsx:15) with:
- Calendar header with navigation
- BacklogDock sidebar
- MainCalendarGrid with events
- PumpDetailModal nested inside

### ControlFlyout - Current Implementation

**File**: [`src/components/layout/ControlFlyout.tsx`](src/components/layout/ControlFlyout.tsx:1)

**Current Styling**:
```tsx
<div className="fixed left-1/2 top-16 z-50 w-full max-w-xl -translate-x-1/2 px-4">
  <div className="layer-glass border border-primary/40 p-4 shadow-layer-lg">
```

**Issues Identified**:
| Issue | Description |
|-------|-------------|
| Too narrow | `max-w-xl` (576px) cramps filter controls |
| Minimal padding | Only `p-4` inside the card |
| No backdrop | No overlay behind to dim main content |
| No animation | Appears/disappears instantly |
| Position fixed to header | Always at `top-16`, may overlap content |

**Content**: Contains [`FilterBar`](src/components/toolbar/FilterBar.tsx) with stacked layout.

---

## Proposed Design Architecture

### Design Principles

1. **Floating Perception**: Modal should appear elevated above main content
2. **Context Preservation**: Main screen visible around modal edges
3. **Depth Through Layers**: Backdrop blur + shadow + transform = 3D effect
4. **Smooth Transitions**: Animated entrance/exit enhances floating perception
5. **Responsive Sizing**: Percentage-based max dimensions with safe minimums

### Visual Hierarchy

```
┌─────────────────────────────────────────────────────────────┐
│                     Main Screen Content                      │
│                    (dimmed, blurred backdrop)                │
│                                                             │
│     ┌─────────────────────────────────────────────┐         │
│     │                                             │         │
│     │              Modal Content                  │         │
│     │         (floating, elevated z-50)           │         │
│     │                                             │         │
│     │   - Glassmorphism background               │         │
│     │   - Subtle shadow for depth                │         │
│     │   - Rounded corners                        │         │
│     │   - Margin from screen edges               │         │
│     │                                             │         │
│     └─────────────────────────────────────────────┘         │
│                                                             │
│                     Main Screen Content                      │
└─────────────────────────────────────────────────────────────┘
```

---

## Implementation Specifications

### Shared Modal Wrapper Component

Create a reusable `FloatingModal` wrapper in [`src/components/ui/FloatingModal.tsx`](src/components/ui/FloatingModal.tsx):

```tsx
interface FloatingModalProps {
  isOpen: boolean
  onClose: () => void
  children: ReactNode
  size: 'small' | 'medium' | 'large' | 'fullscreen'
  showBackdrop?: boolean
  className?: string
}
```

### Tailwind Class Specifications

#### Backdrop Layer
```tsx
// Backdrop - covers screen, dims and blurs main content
className="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm transition-opacity duration-300"
```

#### Modal Container - Sizing Variants

| Size | Max Width | Max Height | Use Case |
|------|-----------|------------|----------|
| `small` | `max-w-md` (448px) | `max-h-[70vh]` | Confirmations, alerts |
| `medium` | `max-w-2xl` (672px) | `max-h-[80vh]` | Forms, detail views |
| `large` | `max-w-5xl` (1024px) | `max-h-[90vh]` | Complex views, tables |
| `fullscreen` | `max-w-[95vw]` | `max-h-[95vh]` | Scheduling, full views |

#### Modal Card - 3D Floating Effect
```tsx
className={cn(
  // Base positioning
  "fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2",
  "z-50",
  
  // Sizing (example for large)
  "w-[95vw] max-w-5xl max-h-[90vh]",
  
  // Glassmorphism
  "bg-card/95 backdrop-blur-xl",
  "border border-border/50",
  "rounded-2xl",
  
  // 3D depth shadow
  "shadow-2xl shadow-black/20",
  "ring-1 ring-white/10",
  
  // Animation
  "transition-all duration-300 ease-out",
  isOpen 
    ? "opacity-100 scale-100" 
    : "opacity-0 scale-95 pointer-events-none"
)}
```

### ScheduleModal Redesign

**Changes Required**:

```tsx
// BEFORE (current)
<div className="fixed inset-0 z-[60] flex flex-col bg-background/98 backdrop-blur-xl">

// AFTER (proposed)
{/* Backdrop */}
<div 
  className="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm"
  onClick={onClose}
/>

{/* Modal */}
<div className="fixed inset-4 z-50 flex flex-col md:inset-8 lg:inset-12">
  <div className={cn(
    "flex flex-1 flex-col overflow-hidden",
    "bg-card/95 backdrop-blur-xl",
    "border border-border/50 rounded-2xl",
    "shadow-2xl shadow-black/20",
    "ring-1 ring-white/10"
  )}>
    {/* Header - unchanged */}
    {/* Content - unchanged */}
  </div>
</div>
```

**Key Changes**:
- `inset-4 md:inset-8 lg:inset-12` creates margin around modal
- Backdrop with click-to-close
- Glassmorphism card inside
- Preserves existing header and content structure

### ControlFlyout Redesign

**Changes Required**:

```tsx
// BEFORE (current)
<div className="fixed left-1/2 top-16 z-50 w-full max-w-xl -translate-x-1/2 px-4">
  <div className="layer-glass border border-primary/40 p-4 shadow-layer-lg">

// AFTER (proposed)
{/* Backdrop */}
<div 
  className="fixed inset-0 z-40 bg-black/20 backdrop-blur-sm transition-opacity"
  onClick={onClose}
/>

{/* Flyout */}
<div className={cn(
  "fixed left-1/2 top-20 z-50 -translate-x-1/2",
  "w-[90vw] max-w-2xl",  // Increased from max-w-xl
  "transition-all duration-200",
  open ? "opacity-100 translate-y-0" : "opacity-0 -translate-y-2 pointer-events-none"
)}>
  <div className={cn(
    "layer-glass border border-primary/40",
    "p-6",  // Increased from p-4
    "shadow-2xl shadow-black/20",
    "rounded-2xl"
  )}>
    <FilterBar layout="stacked" />
  </div>
</div>
```

**Key Changes**:
- Increased max-width from `max-w-xl` (576px) to `max-w-2xl` (672px)
- Added backdrop overlay
- Increased padding from `p-4` to `p-6`
- Added entrance/exit animation
- Enhanced shadow for depth

---

## Animation Specifications

### Entrance Animation
```css
/* Using Tailwind animate-in or custom keyframes */
@keyframes modal-enter {
  from {
    opacity: 0;
    transform: translate(-50%, -50%) scale(0.95);
  }
  to {
    opacity: 1;
    transform: translate(-50%, -50%) scale(1);
  }
}
```

### Exit Animation
```css
@keyframes modal-exit {
  from {
    opacity: 1;
    transform: translate(-50%, -50%) scale(1);
  }
  to {
    opacity: 0;
    transform: translate(-50%, -50%) scale(0.95);
  }
}
```

### Tailwind Animation Classes
```tsx
// Using Tailwind's built-in animation utilities
className="animate-in fade-in zoom-in-95 duration-300"
className="animate-out fade-out zoom-out-95 duration-200"
```

---

## Accessibility Considerations

| Requirement | Implementation |
|-------------|----------------|
| Focus trapping | Use `useEffect` to trap focus within modal |
| Keyboard navigation | ESC to close, Tab cycles focus |
| Screen reader | `role="dialog"` and `aria-modal="true"` |
| Focus restoration | Return focus to trigger element on close |
| Body scroll lock | Already implemented in ScheduleModal |

### Focus Trap Implementation
```tsx
// Add to modal component
useEffect(() => {
  if (!isOpen) return
  
  const modal = modalRef.current
  const focusableElements = modal?.querySelectorAll(
    'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
  )
  const firstElement = focusableElements?.[0] as HTMLElement
  const lastElement = focusableElements?.[focusableElements.length - 1] as HTMLElement
  
  const handleTab = (e: KeyboardEvent) => {
    if (e.key !== 'Tab') return
    if (e.shiftKey && document.activeElement === firstElement) {
      e.preventDefault()
      lastElement?.focus()
    } else if (!e.shiftKey && document.activeElement === lastElement) {
      e.preventDefault()
      firstElement?.focus()
    }
  }
  
  modal?.addEventListener('keydown', handleTab)
  return () => modal?.removeEventListener('keydown', handleTab)
}, [isOpen])
```

---

## Mobile Responsiveness

### Breakpoint Strategy

| Breakpoint | ScheduleModal | ControlFlyout |
|------------|---------------|---------------|
| Mobile (<640px) | `inset-2`, full-width | `inset-x-4 top-16`, full-width |
| Tablet (640-1024px) | `inset-4`, max-width 95vw | `max-w-xl` |
| Desktop (>1024px) | `inset-8`, max-w-5xl | `max-w-2xl` |

### Mobile-Specific Classes
```tsx
// ScheduleModal
"inset-2 sm:inset-4 md:inset-8 lg:inset-12"

// ControlFlyout  
"w-[95vw] sm:w-auto sm:max-w-xl md:max-w-2xl"
```

---

## Implementation Checklist

### Phase 1: Create Shared Utilities
- [ ] Create `FloatingModal` wrapper component
- [ ] Add animation keyframes to `index.css`
- [ ] Create `useFocusTrap` hook for accessibility

### Phase 2: Redesign ScheduleModal
- [ ] Add backdrop overlay with blur
- [ ] Change from `inset-0` to responsive margins
- [ ] Add glassmorphism card wrapper
- [ ] Add entrance/exit animations
- [ ] Test with SchedulingView content

### Phase 3: Redesign ControlFlyout
- [ ] Increase max-width to `max-w-2xl`
- [ ] Add backdrop overlay
- [ ] Increase padding to `p-6`
- [ ] Add entrance/exit animations
- [ ] Test with FilterBar content

### Phase 4: Testing & Polish
- [ ] Test keyboard navigation
- [ ] Test screen reader compatibility
- [ ] Test mobile responsiveness
- [ ] Verify no z-index conflicts
- [ ] Performance test animations

---

## Files to Modify

| File | Changes |
|------|---------|
| [`src/components/modals/ScheduleModal.tsx`](src/components/modals/ScheduleModal.tsx) | Add backdrop, responsive margins, glassmorphism |
| [`src/components/layout/ControlFlyout.tsx`](src/components/layout/ControlFlyout.tsx) | Increase size, add backdrop, animations |
| [`src/index.css`](src/index.css) | Add animation keyframes |
| `src/components/ui/FloatingModal.tsx` | New shared component (optional) |

---

## Visual Comparison

### ScheduleModal

| Aspect | Current | Proposed |
|--------|---------|----------|
| Coverage | 100% viewport | ~90% with margins |
| Background | `bg-background/98` | `bg-card/95` + backdrop |
| Depth | None | Shadow + ring + blur |
| Animation | None | Scale + fade |

### ControlFlyout

| Aspect | Current | Proposed |
|--------|---------|----------|
| Width | 576px max | 672px max |
| Padding | 16px | 24px |
| Backdrop | None | Blur + dim |
| Animation | None | Slide + fade |

---

## Risks & Mitigations

| Risk | Mitigation |
|------|------------|
| Performance impact from blur | Use `backdrop-blur-sm` (lighter blur) |
| Z-index conflicts | Audit existing z-index values, use consistent scale |
| Animation jank | Use `transform` and `opacity` only (GPU accelerated) |
| Mobile usability | Test on actual devices, ensure touch targets remain accessible |
| Content overflow | Ensure `overflow-auto` on content containers |

---

## Conclusion

This proposal transforms both modals from flat overlays to floating 3D panels that:
1. Maintain visual connection to the main screen through transparency and margins
2. Create depth perception through shadows, blur, and transforms
3. Provide smooth, polished entrance/exit animations
4. Maintain accessibility and mobile responsiveness

The implementation can be done incrementally, starting with the most impactful changes (backdrop + margins) and adding polish (animations) afterward.
