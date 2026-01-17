// src/components/dashboard/DateRangePicker.tsx
import { Calendar, X } from 'lucide-react'
import { format } from 'date-fns'

interface DateRangePickerProps {
  from: Date | null
  to: Date | null
  onChange: (range: { from: Date | null; to: Date | null }) => void
}

export function DateRangePicker({ from, to, onChange }: DateRangePickerProps) {
  const hasRange = from !== null || to !== null

  const handleClear = () => {
    onChange({ from: null, to: null })
  }

  return (
    <div className="flex items-center gap-2">
      <div className="relative flex items-center gap-1.5 bg-muted/50 rounded-lg px-3 py-1.5 border border-border/40">
        <Calendar className="h-4 w-4 text-muted-foreground shrink-0" />
        <input
          type="date"
          value={from ? format(from, 'yyyy-MM-dd') : ''}
          onChange={(e) => {
            const date = e.target.value ? new Date(e.target.value) : null
            onChange({ from: date, to })
          }}
          className="bg-transparent border-none text-sm w-28 focus:outline-none text-foreground"
          placeholder="From"
        />
        <span className="text-muted-foreground text-xs">–</span>
        <input
          type="date"
          value={to ? format(to, 'yyyy-MM-dd') : ''}
          onChange={(e) => {
            const date = e.target.value ? new Date(e.target.value) : null
            onChange({ from, to: date })
          }}
          className="bg-transparent border-none text-sm w-28 focus:outline-none text-foreground"
          placeholder="To"
        />
        {hasRange && (
          <button
            onClick={handleClear}
            className="p-0.5 rounded hover:bg-muted ml-1"
            title="Clear dates"
          >
            <X className="h-3.5 w-3.5 text-muted-foreground" />
          </button>
        )}
      </div>
    </div>
  )
}
