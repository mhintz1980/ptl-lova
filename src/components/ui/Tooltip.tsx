// src/components/ui/Tooltip.tsx
import * as React from 'react'
import { createPortal } from 'react-dom'
import { cn } from '../../lib/utils'

interface TooltipProps {
  content: React.ReactNode
  children: React.ReactNode
  className?: string
  side?: 'top' | 'bottom' | 'left' | 'right'
  align?: 'start' | 'center' | 'end'
  delay?: number
}

export function Tooltip({
  content,
  children,
  className,
  side = 'top',
  align: _align = 'center',
  delay = 200,
}: TooltipProps) {
  const [isVisible, setIsVisible] = React.useState(false)
  const [coords, setCoords] = React.useState<{
    top: number
    left: number
    width: number
    height: number
  } | null>(null)
  const [timeoutId, setTimeoutId] = React.useState<NodeJS.Timeout | null>(null)
  const triggerRef = React.useRef<HTMLDivElement>(null)

  const showTooltip = React.useCallback(() => {
    if (timeoutId) {
      clearTimeout(timeoutId)
    }
    const id = setTimeout(() => {
      if (triggerRef.current) {
        const rect = triggerRef.current.getBoundingClientRect()
        setCoords({
          top: rect.top,
          left: rect.left,
          width: rect.width,
          height: rect.height,
        })
        setIsVisible(true)
      }
    }, delay)
    setTimeoutId(id)
  }, [delay, timeoutId])

  const hideTooltip = React.useCallback(() => {
    if (timeoutId) {
      clearTimeout(timeoutId)
    }
    setIsVisible(false)
  }, [timeoutId])

  // Clean up timeout on unmount
  React.useEffect(() => {
    return () => {
      if (timeoutId) {
        clearTimeout(timeoutId)
      }
    }
  }, [timeoutId])

  const getTooltipStyle = (): React.CSSProperties => {
    if (!coords) return {}

    // Gap between trigger and tooltip
    const gap = 8

    // Base styles for fixed positioning
    const style: React.CSSProperties = {
      position: 'fixed',
      zIndex: 50,
    }

    switch (side) {
      case 'top':
        style.top = coords.top - gap
        style.left = coords.left + coords.width / 2
        style.transform = 'translate(-50%, -100%)'
        break
      case 'bottom':
        style.top = coords.top + coords.height + gap
        style.left = coords.left + coords.width / 2
        style.transform = 'translate(-50%, 0)'
        break
      case 'left':
        style.top = coords.top + coords.height / 2
        style.left = coords.left - gap
        style.transform = 'translate(-100%, -50%)'
        break
      case 'right':
        style.top = coords.top + coords.height / 2
        style.left = coords.left + coords.width + gap
        style.transform = 'translate(0, -50%)'
        break
    }

    return style
  }

  const getArrowClasses = () => {
    // Arrow points TOWARDS the trigger
    const arrows = {
      top: 'top-full left-1/2 -translate-x-1/2 -mt-1 border-l-transparent border-r-transparent border-b-transparent border-t-current',
      bottom:
        'bottom-full left-1/2 -translate-x-1/2 -mb-1 border-l-transparent border-r-transparent border-t-transparent border-b-current',
      left: 'left-full top-1/2 -translate-y-1/2 -ml-1 border-t-transparent border-b-transparent border-r-transparent border-l-current',
      right:
        'right-full top-1/2 -translate-y-1/2 -mr-1 border-t-transparent border-b-transparent border-l-transparent border-r-current',
    }
    return arrows[side] || arrows.top
  }

  return (
    <>
      <div
        ref={triggerRef}
        className="inline-block"
        onMouseEnter={showTooltip}
        onMouseLeave={hideTooltip}
        onFocus={showTooltip}
        onBlur={hideTooltip}
      >
        {children}
      </div>

      {isVisible &&
        coords &&
        createPortal(
          <div
            role="tooltip"
            aria-live="polite"
            style={getTooltipStyle()}
            className={cn(
              'px-3 py-2 text-sm font-medium text-white bg-gray-900 rounded-lg shadow-lg border border-gray-700',
              'max-w-xs break-words pointer-events-none',
              'animate-in fade-in-0 zoom-in-95 duration-200',
              className
            )}
          >
            <div className="relative">
              {content}
              <div
                className={cn('absolute w-0 h-0 border-4', getArrowClasses())}
                aria-hidden="true"
              />
            </div>
          </div>,
          document.body
        )}
    </>
  )
}
