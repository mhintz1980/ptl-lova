import { ChartSize } from './dashboardConfig'

/**
 * Centralized chart sizing configuration.
 * This is the SINGLE SOURCE OF TRUTH for chart heights.
 */

// Preset heights for common chart sizes (in pixels)
// STANDARDIZED: All charts use 450px for consistent visual alignment
export const CHART_HEIGHTS: Record<ChartSize, number> = {
  mini: 450,
  quarter: 450,
  third: 450,
  small: 450,
  half: 450,
  'three-quarter': 450,
  large: 450,
  full: 450,
  max: 600, // Full-featured panels (e.g., drill-down mode)
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
