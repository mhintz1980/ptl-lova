// src/lib/export.ts
import Papa from 'papaparse'
import { Pump } from '../types'

/**
 * Helper to filter pump objects to only include specified columns
 */
function filterColumns(
  pumps: Pump[],
  columns?: string[]
): Record<string, unknown>[] {
  if (!columns || columns.length === 0) {
    // Return all columns - cast to Record type for papaparse compatibility
    return pumps as unknown as Record<string, unknown>[]
  }

  return pumps.map((pump) => {
    const filtered: Record<string, unknown> = {}
    columns.forEach((col) => {
      if (col in pump) {
        filtered[col] = pump[col as keyof Pump]
      }
    })
    return filtered
  })
}

/**
 * Generate a timestamp-based filename
 */
function generateFilename(extension: 'csv' | 'json'): string {
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19)
  return `pumptracker-export-${timestamp}.${extension}`
}

/**
 * Trigger browser download of a file
 */
function downloadFile(content: string, filename: string, mimeType: string) {
  const blob = new Blob([content], { type: mimeType })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
}

/**
 * Export pumps to CSV format
 * @param pumps - Array of pump objects to export
 * @param columns - Optional array of column names to include (exports all if not provided)
 * @returns The CSV string content
 */
export function exportToCsv(pumps: Pump[], columns?: string[]): string {
  const filtered = filterColumns(pumps, columns)
  const csv = Papa.unparse(filtered)
  return csv
}

/**
 * Export pumps to JSON format
 * @param pumps - Array of pump objects to export
 * @param columns - Optional array of column names to include (exports all if not provided)
 * @returns The JSON string content
 */
export function exportToJson(pumps: Pump[], columns?: string[]): string {
  const filtered = filterColumns(pumps, columns)
  const json = JSON.stringify(filtered, null, 2)
  return json
}

/**
 * Export pumps to CSV and trigger download
 * @param pumps - Array of pump objects to export
 * @param columns - Optional array of column names to include
 */
export function downloadCsv(pumps: Pump[], columns?: string[]) {
  const csv = exportToCsv(pumps, columns)
  const filename = generateFilename('csv')
  downloadFile(csv, filename, 'text/csv;charset=utf-8;')
}

/**
 * Export pumps to JSON and trigger download
 * @param pumps - Array of pump objects to export
 * @param columns - Optional array of column names to include
 */
export function downloadJson(pumps: Pump[], columns?: string[]) {
  const json = exportToJson(pumps, columns)
  const filename = generateFilename('json')
  downloadFile(json, filename, 'application/json;charset=utf-8;')
}
