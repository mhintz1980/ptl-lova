import React, { useCallback, useRef, useState, useEffect } from 'react'

interface ChartA11yWrapperProps {
  children: React.ReactNode
  /** Chart title for screen readers */
  title: string
  /** Description of what the chart shows */
  description?: string
  /** Data summary for screen readers (e.g., "5 data points ranging from 10 to 50") */
  dataSummary?: string
  /** Number of interactive elements (for arrow key navigation) */
  itemCount?: number
  /** Callback when arrow keys navigate to item */
  onNavigate?: (index: number) => void
  /** Callback when Enter/Space is pressed on current item */
  onSelect?: (index: number) => void
  /** Current focused item index */
  focusedIndex?: number
  /** Additional CSS classes */
  className?: string
}

/**
 * Accessibility wrapper for chart components.
 * 
 * Provides:
 * - Keyboard navigation (Tab to focus, Arrow keys to navigate, Enter/Space to select)
 * - ARIA labels and live regions for screen readers
 * - Focus management with visual indicators
 * 
 * @example
 * <ChartA11yWrapper
 *   title="Sales Trend"
 *   description="Monthly sales over the past year"
 *   dataSummary="12 months, ranging from $10,000 to $50,000"
 *   itemCount={12}
 *   onNavigate={setHoveredIndex}
 *   onSelect={handlePointClick}
 * >
 *   <SparklineAreaChart ... />
 * </ChartA11yWrapper>
 */
export function ChartA11yWrapper({
  children,
  title,
  description,
  dataSummary,
  itemCount = 0,
  onNavigate,
  onSelect,
  focusedIndex = -1,
  className = '',
}: ChartA11yWrapperProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const [internalIndex, setInternalIndex] = useState(focusedIndex)
  const [announcement, setAnnouncement] = useState('')
  
  // Sync external focused index
  useEffect(() => {
    if (focusedIndex >= 0) {
      setInternalIndex(focusedIndex)
    }
  }, [focusedIndex])

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (itemCount === 0) return
    
    let newIndex = internalIndex
    
    switch (e.key) {
      case 'ArrowRight':
      case 'ArrowDown':
        e.preventDefault()
        newIndex = internalIndex < itemCount - 1 ? internalIndex + 1 : 0
        break
      case 'ArrowLeft':
      case 'ArrowUp':
        e.preventDefault()
        newIndex = internalIndex > 0 ? internalIndex - 1 : itemCount - 1
        break
      case 'Home':
        e.preventDefault()
        newIndex = 0
        break
      case 'End':
        e.preventDefault()
        newIndex = itemCount - 1
        break
      case 'Enter':
      case ' ':
        e.preventDefault()
        if (internalIndex >= 0) {
          onSelect?.(internalIndex)
          setAnnouncement(`Selected item ${internalIndex + 1} of ${itemCount}`)
        }
        return
      case 'Escape':
        e.preventDefault()
        containerRef.current?.blur()
        return
      default:
        return
    }
    
    if (newIndex !== internalIndex) {
      setInternalIndex(newIndex)
      onNavigate?.(newIndex)
      setAnnouncement(`Item ${newIndex + 1} of ${itemCount}`)
    }
  }, [internalIndex, itemCount, onNavigate, onSelect])

  const handleFocus = useCallback(() => {
    if (internalIndex < 0 && itemCount > 0) {
      setInternalIndex(0)
      onNavigate?.(0)
    }
    setAnnouncement(`${title}. ${dataSummary || ''} Use arrow keys to navigate.`)
  }, [internalIndex, itemCount, onNavigate, title, dataSummary])

  const handleBlur = useCallback(() => {
    // Clear internal focus state when chart loses keyboard focus
    setInternalIndex(-1)
    onNavigate?.(-1)
  }, [onNavigate])

  const descriptionId = `chart-desc-${title.replace(/\s+/g, '-').toLowerCase()}`
  const summaryId = `chart-summary-${title.replace(/\s+/g, '-').toLowerCase()}`

  return (
    <div
      ref={containerRef}
      role="graphics-document"
      aria-roledescription="interactive chart"
      aria-label={title}
      aria-describedby={description ? descriptionId : undefined}
      tabIndex={0}
      onKeyDown={handleKeyDown}
      onFocus={handleFocus}
      onBlur={handleBlur}
      className={`chart-a11y-wrapper outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-background rounded-lg ${className}`}
    >
      {/* Hidden description for screen readers */}
      {description && (
        <span id={descriptionId} className="sr-only">
          {description}
        </span>
      )}
      
      {/* Hidden data summary for screen readers */}
      {dataSummary && (
        <span id={summaryId} className="sr-only">
          {dataSummary}
        </span>
      )}
      
      {/* Live region for announcements */}
      <div
        aria-live="polite"
        aria-atomic="true"
        className="sr-only"
      >
        {announcement}
      </div>
      
      {/* Chart content */}
      {children}
    </div>
  )
}

/**
 * Hook for generating data summary for screen readers.
 * 
 * @example
 * const summary = useChartDataSummary({
 *   points: [10, 20, 30, 40, 50],
 *   formatValue: (v) => `$${v}`,
 *   labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May']
 * })
 * // Returns: "5 data points from Jan to May, ranging from $10 to $50"
 */
export function useChartDataSummary({
  points,
  formatValue = (v: number) => v.toString(),
  labels,
}: {
  points: number[]
  formatValue?: (value: number) => string
  labels?: string[]
}): string {
  if (points.length === 0) return 'No data available'
  
  const min = Math.min(...points)
  const max = Math.max(...points)
  const count = points.length
  
  const rangeText = `ranging from ${formatValue(min)} to ${formatValue(max)}`
  
  if (labels && labels.length >= 2) {
    return `${count} data points from ${labels[0]} to ${labels[labels.length - 1]}, ${rangeText}`
  }
  
  return `${count} data points, ${rangeText}`
}
