// src/components/ui/PrioritySelect.tsx
import { Priority } from '../../types'
import { cn } from '../../lib/utils'

const PRIORITY_COLORS: Record<Priority, string> = {
  Low: 'bg-slate-400',
  Normal: 'bg-sky-500',
  High: 'bg-amber-500',
  Rush: 'bg-orange-500',
  Urgent: 'bg-red-500',
}

interface PrioritySelectProps {
  value: Priority
  onChange: (priority: Priority) => void
  className?: string
  size?: 'sm' | 'default'
}

const priorities: Priority[] = ['Low', 'Normal', 'High', 'Rush', 'Urgent']

export function PrioritySelect({
  value,
  onChange,
  className,
  size = 'default',
}: PrioritySelectProps) {
  return (
    <div className={cn('relative inline-flex items-center gap-2', className)}>
      {/* Color indicator */}
      <span
        className={cn(
          'rounded-full shrink-0',
          size === 'sm' ? 'h-2 w-2' : 'h-2.5 w-2.5',
          PRIORITY_COLORS[value]
        )}
      />
      <select
        value={value}
        onChange={(e) => onChange(e.target.value as Priority)}
        className={cn(
          'bg-transparent border-none focus:outline-none focus:ring-0 cursor-pointer font-medium appearance-none pr-4',
          size === 'sm' ? 'text-xs' : 'text-sm',
          'text-foreground'
        )}
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%239ca3af' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='m6 9 6 6 6-6'/%3E%3C/svg%3E")`,
          backgroundRepeat: 'no-repeat',
          backgroundPosition: 'right 0 center',
        }}
      >
        {priorities.map((p) => (
          <option key={p} value={p}>
            {p}
          </option>
        ))}
      </select>
    </div>
  )
}
