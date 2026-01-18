import { useMemo } from 'react'

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
  return useMemo(() => {
    if (points.length === 0) return 'No data available'

    const min = Math.min(...points)
    const max = Math.max(...points)
    const count = points.length

    const rangeText = `ranging from ${formatValue(min)} to ${formatValue(max)}`

    if (labels && labels.length >= 2) {
      return `${count} data points from ${labels[0]} to ${labels[labels.length - 1]}, ${rangeText}`
    }

    return `${count} data points, ${rangeText}`
  }, [points, formatValue, labels])
}
