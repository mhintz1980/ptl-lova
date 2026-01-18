// src/lib/format.ts

export function formatCurrency(value: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value)
}

/**
 * Compact currency format for dashboards: $12K, $1.2M
 */
export function formatCompactCurrency(value: number): string {
  if (value >= 1_000_000) {
    return `$${(value / 1_000_000).toFixed(1)}M`
  }
  if (value >= 1_000) {
    return `$${(value / 1_000).toFixed(0)}K`
  }
  return `$${value.toFixed(0)}`
}

export function formatDate(isoString: string | undefined): string {
  if (!isoString) return 'N/A'
  try {
    return new Date(isoString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    })
  } catch {
    return 'Invalid Date'
  }
}

export function round(value: number, decimals: number = 0): number {
  return Number(Math.round(Number(value + 'e' + decimals)) + 'e-' + decimals)
}

export function formatPriorityColor(
  priority: string,
  type: 'border' | 'text' | 'bg'
): string {
  const colors = {
    Urgent: {
      border: 'border-l-[3px] border-rose-400/80',
      text: 'text-rose-300',
      bg: 'ring-1 ring-rose-400/25 bg-rose-500/10',
    },
    Rush: {
      border: 'border-l-[3px] border-orange-400/80',
      text: 'text-orange-200',
      bg: 'ring-1 ring-orange-400/25 bg-orange-500/10',
    },
    High: {
      border: 'border-l-[3px] border-amber-300/80',
      text: 'text-amber-200',
      bg: 'ring-1 ring-amber-300/25 bg-amber-400/10',
    },
    Normal: {
      border: 'border-l-[3px] border-sky-400/80',
      text: 'text-sky-200',
      bg: 'ring-1 ring-sky-400/20 bg-sky-500/10',
    },
    Low: {
      border: 'border-l-[3px] border-slate-500/70',
      text: 'text-slate-300',
      bg: 'ring-1 ring-slate-500/20 bg-slate-500/10',
    },
  }

  const priorityColors = colors[priority as keyof typeof colors] || colors.Low

  if (type === 'bg') {
    return `${priorityColors.border} ${priorityColors.bg}`
  }

  return priorityColors[type]
}
