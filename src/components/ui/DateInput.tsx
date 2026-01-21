// src/components/ui/DateInput.tsx
import * as React from 'react'
import { cn } from '../../lib/utils'
import { format, parseISO, isValid } from 'date-fns'
import { Calendar } from 'lucide-react'

export interface DateInputProps {
  value?: string // ISO string or empty
  onChange: (isoString: string | undefined) => void
  className?: string
  disabled?: boolean
  placeholder?: string
}

/**
 * A controlled date input that handles partial typing gracefully.
 * Shows a calendar picker button and formats dates properly.
 *
 * Unlike raw input[type="date"], this component:
 * - Uses local state while typing to avoid year-jumping issues
 * - Only updates parent state when date is valid or cleared
 * - Shows calendar picker button clearly
 */
export function DateInput({
  value,
  onChange,
  className,
  disabled = false,
  placeholder = 'Select date',
}: DateInputProps) {
  const inputRef = React.useRef<HTMLInputElement>(null)

  // Convert ISO string to YYYY-MM-DD for input value
  const formatForInput = (isoString?: string): string => {
    if (!isoString) return ''
    try {
      const date = parseISO(isoString)
      if (isValid(date)) {
        return format(date, 'yyyy-MM-dd')
      }
    } catch {
      // Ignore parse errors
    }
    return ''
  }

  // Local state for the input value (allows partial typing)
  const [localValue, setLocalValue] = React.useState(() =>
    formatForInput(value)
  )

  // Sync local state when prop changes (e.g., on form reset)
  React.useEffect(() => {
    setLocalValue(formatForInput(value))
  }, [value])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value
    setLocalValue(newValue)

    // Only update parent state when we have a valid date or it's cleared
    if (!newValue) {
      onChange(undefined)
    } else if (newValue.length === 10) {
      // Full date typed (YYYY-MM-DD)
      const date = new Date(newValue + 'T00:00:00')
      if (isValid(date)) {
        onChange(date.toISOString())
      }
    }
    // For partial dates, we just keep local state - don't update parent
  }

  const handleBlur = () => {
    // On blur, if we have a partial date, reset to the last valid value
    if (localValue && localValue.length !== 10) {
      setLocalValue(formatForInput(value))
    }
  }

  const openPicker = () => {
    inputRef.current?.showPicker?.()
  }

  return (
    <div className={cn('relative flex items-center', className)}>
      <input
        ref={inputRef}
        type="date"
        value={localValue}
        onChange={handleChange}
        onBlur={handleBlur}
        disabled={disabled}
        placeholder={placeholder}
        className={cn(
          'flex h-8 w-full rounded-md border border-border/50 bg-muted/30 px-3 py-1 text-sm text-foreground',
          'transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium',
          'placeholder:text-muted-foreground/50',
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 focus-visible:border-primary/40',
          'disabled:cursor-not-allowed disabled:opacity-50',
          // Ensure calendar picker is visible in dark mode
          'dark:[color-scheme:dark]',
          // Make calendar icon clickable area larger
          '[&::-webkit-calendar-picker-indicator]:cursor-pointer',
          '[&::-webkit-calendar-picker-indicator]:opacity-70',
          '[&::-webkit-calendar-picker-indicator]:hover:opacity-100',
          className
        )}
      />
      {/* Calendar button for non-webkit browsers or as backup */}
      <button
        type="button"
        onClick={openPicker}
        disabled={disabled}
        className="absolute right-2 p-1 text-muted-foreground hover:text-foreground transition-colors"
        tabIndex={-1}
        aria-label="Open calendar"
      >
        <Calendar className="h-3.5 w-3.5" />
      </button>
    </div>
  )
}
