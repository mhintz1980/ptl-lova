import { motion } from 'motion/react'
import { useState, useMemo, useCallback } from 'react'

// --- Types ---
export interface SparklineDataPoint {
  label: string
  value: number
  [key: string]: any
}

interface SparklineAreaChartProps {
  data: SparklineDataPoint[]
  color?: string
  height?: number
  valueFormatter?: (val: number) => string
  onPointClick?: (point: SparklineDataPoint, index: number) => void
  showXAxis?: boolean
  showYAxis?: boolean
  /** Chart title for accessibility (visible in tooltip on hover) */
  title?: string
  /** Externally controlled focused index for keyboard navigation */
  focusedIndex?: number
}

// --- Utility: Catmull-Rom to Cubic Bezier ---
function catmullRomToBezier(
  points: { x: number; y: number }[],
  tension = 0.5
): string {
  if (points.length < 2) return ''
  if (points.length === 2) {
    return `M ${points[0].x} ${points[0].y} L ${points[1].x} ${points[1].y}`
  }

  let path = `M ${points[0].x} ${points[0].y}`

  for (let i = 0; i < points.length - 1; i++) {
    const p0 = points[Math.max(0, i - 1)]
    const p1 = points[i]
    const p2 = points[i + 1]
    const p3 = points[Math.min(points.length - 1, i + 2)]

    // Calculate control points using Catmull-Rom formula
    const cp1x = p1.x + ((p2.x - p0.x) * tension) / 6
    const cp1y = p1.y + ((p2.y - p0.y) * tension) / 6
    const cp2x = p2.x - ((p3.x - p1.x) * tension) / 6
    const cp2y = p2.y - ((p3.y - p1.y) * tension) / 6

    path += ` C ${cp1x} ${cp1y}, ${cp2x} ${cp2y}, ${p2.x} ${p2.y}`
  }

  return path
}

// --- Main Component ---
export function SparklineAreaChart({
  data,
  color = '#06b6d4',
  height = 200,
  valueFormatter = (val) => val.toLocaleString(),
  onPointClick,
  showXAxis = true,
  showYAxis = false,
  title,
  focusedIndex: externalFocusedIndex,
}: SparklineAreaChartProps) {
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null)
  const [mouseX, setMouseX] = useState<number | null>(null)

  // Combine external focused index with internal hover
  const activeIndex = externalFocusedIndex ?? hoveredIndex

  // Chart dimensions
  const padding = {
    top: 20,
    right: 20,
    bottom: showXAxis ? 30 : 10,
    left: showYAxis ? 50 : 10,
  }
  const width = 400
  const chartWidth = width - padding.left - padding.right
  const chartHeight = height - padding.top - padding.bottom

  // Calculate scales and points
  const { points, minVal, maxVal } = useMemo(() => {
    if (data.length === 0)
      return { points: [], minVal: 0, maxVal: 0, yScale: () => 0 }

    const values = data.map((d) => d.value)
    const min = Math.min(...values)
    const max = Math.max(...values)
    const range = max - min || 1

    // Add 10% padding to y-axis range
    const paddedMin = min - range * 0.1
    const paddedMax = max + range * 0.1
    const paddedRange = paddedMax - paddedMin

    const scale = (val: number) =>
      chartHeight - ((val - paddedMin) / paddedRange) * chartHeight

    const pts = data.map((d, i) => ({
      x: padding.left + (i / Math.max(1, data.length - 1)) * chartWidth,
      y: padding.top + scale(d.value),
      data: d,
      index: i,
    }))

    return { points: pts, minVal: min, maxVal: max, yScale: scale }
  }, [data, chartWidth, chartHeight, padding.left, padding.top])

  // Generate smooth curve path
  const linePath = useMemo(() => {
    if (points.length < 2) return ''
    return catmullRomToBezier(
      points.map((p) => ({ x: p.x, y: p.y })),
      3 // Tension for smooth curves
    )
  }, [points])

  // Generate filled area path
  const areaPath = useMemo(() => {
    if (points.length < 2) return ''
    const baseline = padding.top + chartHeight
    return `${linePath} L ${points[points.length - 1].x} ${baseline} L ${
      points[0].x
    } ${baseline} Z`
  }, [linePath, points, padding.top, chartHeight])

  // Find nearest point to mouse position
  const nearestPoint = useMemo(() => {
    if (mouseX === null || points.length === 0) return null

    let nearest = points[0]
    let minDist = Math.abs(points[0].x - mouseX)

    for (const pt of points) {
      const dist = Math.abs(pt.x - mouseX)
      if (dist < minDist) {
        minDist = dist
        nearest = pt
      }
    }

    return nearest
  }, [mouseX, points])

  // Mouse handlers
  const handleMouseMove = useCallback(
    (e: React.MouseEvent<SVGSVGElement>) => {
      const rect = e.currentTarget.getBoundingClientRect()
      const x = ((e.clientX - rect.left) / rect.width) * width
      setMouseX(x)
      if (nearestPoint) {
        setHoveredIndex(nearestPoint.index)
      }
    },
    [width, nearestPoint]
  )

  const handleMouseLeave = useCallback(() => {
    setMouseX(null)
    setHoveredIndex(null)
  }, [])

  const handleClick = useCallback(() => {
    if (nearestPoint && onPointClick) {
      onPointClick(nearestPoint.data, nearestPoint.index)
    }
  }, [nearestPoint, onPointClick])

  // Generate gradient ID
  const gradientId = `sparkline-gradient-${color.replace('#', '')}`
  const glowFilterId = `sparkline-glow-${color.replace('#', '')}`

  if (data.length === 0) {
    return (
      <div
        className="flex items-center justify-center text-muted-foreground"
        style={{ height }}
      >
        No data
      </div>
    )
  }

  return (
    <motion.div
      className="w-full relative"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3 }}
    >
      <svg
        viewBox={`0 0 ${width} ${height}`}
        className="w-full h-auto"
        style={{ maxHeight: height }}
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
        onClick={handleClick}
        role="graphics-document"
        aria-roledescription="line chart"
        aria-label={title || 'Sparkline area chart'}
      >
        {title && <title>{title}</title>}
        <defs>
          {/* Vertical gradient for area fill */}
          <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={color} stopOpacity="0.4" />
            <stop offset="50%" stopColor={color} stopOpacity="0.15" />
            <stop offset="100%" stopColor={color} stopOpacity="0" />
          </linearGradient>

          {/* Glow filter for hover dot */}
          <filter
            id={glowFilterId}
            x="-50%"
            y="-50%"
            width="200%"
            height="200%"
          >
            <feGaussianBlur stdDeviation="4" result="coloredBlur" />
            <feMerge>
              <feMergeNode in="coloredBlur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>

          {/* Drop shadow for 3D depth */}
          <filter
            id="sparkline-shadow"
            x="-10%"
            y="-10%"
            width="120%"
            height="130%"
          >
            <feGaussianBlur in="SourceAlpha" stdDeviation="2" />
            <feOffset dx="0" dy="4" result="offsetblur" />
            <feComponentTransfer>
              <feFuncA type="linear" slope="0.2" />
            </feComponentTransfer>
            <feMerge>
              <feMergeNode />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        {/* Y-Axis */}
        {showYAxis && (
          <g className="text-muted-foreground">
            <text
              x={padding.left - 8}
              y={padding.top}
              textAnchor="end"
              fontSize="10"
              fill="currentColor"
            >
              {valueFormatter(maxVal)}
            </text>
            <text
              x={padding.left - 8}
              y={padding.top + chartHeight}
              textAnchor="end"
              fontSize="10"
              fill="currentColor"
            >
              {valueFormatter(minVal)}
            </text>
          </g>
        )}

        {/* X-Axis labels */}
        {showXAxis && (
          <g className="text-muted-foreground">
            {points.map((pt, i) => {
              // Show every nth label to avoid crowding
              const step = Math.max(1, Math.floor(points.length / 6))
              if (i % step !== 0 && i !== points.length - 1) return null
              return (
                <text
                  key={i}
                  x={pt.x}
                  y={height - 8}
                  textAnchor="middle"
                  fontSize="10"
                  fill="currentColor"
                >
                  {pt.data.label}
                </text>
              )
            })}
          </g>
        )}

        {/* 3D Shadow layer (offset beneath) */}
        <motion.path
          d={areaPath}
          fill={color}
          opacity="0.15"
          transform="translate(0, 6)"
          initial={{ pathLength: 0, opacity: 0 }}
          animate={{ pathLength: 1, opacity: 0.15 }}
          transition={{ duration: 1, ease: 'easeOut' }}
        />

        {/* Filled area with gradient */}
        <motion.path
          d={areaPath}
          fill={`url(#${gradientId})`}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.8, delay: 0.3 }}
        />

        {/* Main line path with drawing animation */}
        <motion.path
          d={linePath}
          fill="none"
          stroke={color}
          strokeWidth="3"
          strokeLinecap="round"
          strokeLinejoin="round"
          filter="url(#sparkline-shadow)"
          initial={{ pathLength: 0, opacity: 0 }}
          animate={{ pathLength: 1, opacity: 1 }}
          transition={{
            pathLength: { duration: 1.2, ease: 'easeOut' },
            opacity: { duration: 0.4 },
          }}
        />

        {/* Hover scanner line */}
        {nearestPoint && mouseX !== null && (
          <motion.line
            x1={nearestPoint.x}
            y1={padding.top}
            x2={nearestPoint.x}
            y2={padding.top + chartHeight}
            stroke={color}
            strokeWidth="1"
            strokeDasharray="4 4"
            opacity="0.5"
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.5 }}
            transition={{ duration: 0.15 }}
          />
        )}

        {/* Data points (appear after line draws) */}
        {points.map((pt, i) => (
          <motion.circle
            key={i}
            cx={pt.x}
            cy={pt.y}
            r={activeIndex === i ? 8 : 4}
            fill={activeIndex === i ? color : 'hsl(var(--card))'}
            stroke={color}
            strokeWidth="2"
            className={onPointClick ? 'cursor-pointer' : ''}
            filter={activeIndex === i ? `url(#${glowFilterId})` : undefined}
            role="graphics-symbol"
            aria-label={`${pt.data.label}: ${valueFormatter(pt.data.value)}`}
            initial={{ scale: 0, opacity: 0 }}
            animate={{
              scale: 1,
              opacity: activeIndex === i ? 1 : 0.7,
            }}
            transition={{
              scale: { delay: 0.8 + i * 0.05, duration: 0.3, type: 'spring' },
              opacity: { duration: 0.2 },
            }}
            whileHover={{ scale: 1.3 }}
          />
        ))}

        {/* Hover tooltip */}
        {nearestPoint && mouseX !== null && (
          <motion.g
            initial={{ opacity: 0, y: 5 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.15 }}
          >
            {/* Tooltip background */}
            <rect
              x={Math.min(
                Math.max(nearestPoint.x - 45, padding.left),
                width - padding.right - 90
              )}
              y={Math.max(nearestPoint.y - 55, padding.top)}
              width="90"
              height="45"
              rx="8"
              fill="hsl(var(--popover))"
              stroke="hsl(var(--border))"
              strokeWidth="1"
              filter="url(#sparkline-shadow)"
            />
            {/* Label */}
            <text
              x={Math.min(
                Math.max(nearestPoint.x, padding.left + 45),
                width - padding.right - 45
              )}
              y={Math.max(nearestPoint.y - 38, padding.top + 12)}
              textAnchor="middle"
              fontSize="11"
              fill="hsl(var(--muted-foreground))"
            >
              {nearestPoint.data.label}
            </text>
            {/* Value */}
            <text
              x={Math.min(
                Math.max(nearestPoint.x, padding.left + 45),
                width - padding.right - 45
              )}
              y={Math.max(nearestPoint.y - 20, padding.top + 30)}
              textAnchor="middle"
              fontSize="14"
              fontWeight="600"
              fill={color}
            >
              {valueFormatter(nearestPoint.data.value)}
            </text>
          </motion.g>
        )}
      </svg>
    </motion.div>
  )
}
