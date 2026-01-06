import { ChartSize } from './dashboardConfig'

/**
 * Centralized chart sizing configuration.
 * This is the SINGLE SOURCE OF TRUTH for chart heights.
 */

// Preset heights for common chart sizes (in pixels)
export const CHART_HEIGHTS: Record<ChartSize, number> = {
  mini: 350, // Compact donut charts
  quarter: 450, // Quarter-width cards (4 per row)
  third: 450, // Third-width cards (3 per row)
  small: 400, // Standard charts
  half: 450, // Half-width charts
  'three-quarter': 450, // 3/4 width (fits next to quarter)
  large: 500, // Expanded trend charts
  full: 450, // Full-width charts
  max: 600, // Full-featured panels
} as const

// Aspect ratio for donut SVG viewBox (width:height)
export const DONUT_ASPECT_RATIO = 400 / 360 // ≈1.11

/**
 * Get the height for a chart, with optional custom override.
 * @param size - The chart size preset
 * @param customHeight - Optional custom height to override the preset
 * @returns The height in pixels
 */
export function getChartHeight(
  size: ChartSize = 'small',
  customHeight?: number
): number {
  return customHeight ?? CHART_HEIGHTS[size] ?? CHART_HEIGHTS.small
}
