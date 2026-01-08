// src/lib/customerColors.ts
// Customer color assignments for schedule page visual grouping
// Edit docs/customer-colors.md to customize these colors

/**
 * Predefined customer colors from docs/customer-colors.md
 * Keys are exact customer names as they appear in the database
 */
export const CUSTOMER_COLORS: Record<string, string> = {
  'United Rentals': '#3B82F6', // Blue
  'Sunbelt Rentals': '#F59E0B', // Amber
  'Herc Rentals': '#10B981', // Emerald
  Valencourt: '#8B5CF6', // Purple
  'Rain For Rent': '#06B6D4', // Cyan
  'Equipment Share': '#F43F5E', // Rose
  'H&E Equipment': '#F97316', // Orange
  'Carter CAT': '#EAB308', // Yellow
  'Ring Power CAT': '#84CC16', // Lime
  'Thompson CAT': '#14B8A6', // Teal
  'Texas First CAT': '#6366F1', // Indigo
  'Yancey CAT': '#EC4899', // Pink
  'Pioneer Pump': '#0EA5E9', // Sky
  'Nat. Tank & Equip.': '#D946EF', // Fuchsia
  SunState: '#64748B', // Slate
}

/**
 * Generate a consistent color for unknown customers using name hash
 * Uses HSL color space for visually distinct colors
 */
function hashStringToHue(str: string): number {
  let hash = 0
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i)
    hash = (hash << 5) - hash + char
    hash = hash & hash // Convert to 32-bit integer
  }
  return Math.abs(hash) % 360
}

/**
 * Get the assigned color for a customer
 * Falls back to a generated color based on name hash if not in predefined list
 *
 * @param customer - Customer name exactly as it appears in data
 * @returns Hex color string (e.g., '#3B82F6')
 */
export function getCustomerColor(customer: string): string {
  if (!customer) {
    return '#6B7280' // Gray for unknown
  }

  // Check predefined colors first
  if (CUSTOMER_COLORS[customer]) {
    return CUSTOMER_COLORS[customer]
  }

  // Generate consistent color from name hash
  const hue = hashStringToHue(customer)
  // HSL to hex conversion with fixed saturation (65%) and lightness (55%)
  return hslToHex(hue, 65, 55)
}

/**
 * Convert HSL values to hex color string
 */
function hslToHex(h: number, s: number, l: number): string {
  s /= 100
  l /= 100
  const a = s * Math.min(l, 1 - l)
  const f = (n: number) => {
    const k = (n + h / 30) % 12
    const color = l - a * Math.max(Math.min(k - 3, 9 - k, 1), -1)
    return Math.round(255 * color)
      .toString(16)
      .padStart(2, '0')
  }
  return `#${f(0)}${f(8)}${f(4)}`
}

/**
 * Get all predefined customer names for legend display
 */
export function getPredefinedCustomers(): string[] {
  return Object.keys(CUSTOMER_COLORS)
}
