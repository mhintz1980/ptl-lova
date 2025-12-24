import { motion, AnimatePresence } from 'motion/react'
import { Card, CardContent, CardHeader, CardTitle } from '../../ui/Card'
import { Button } from '../../ui/Button'
import { ChevronRight, Home } from 'lucide-react'
import { useState } from 'react'

export interface DonutSegment {
  id: string
  label: string
  value: number
  color: string
  sublabel?: string
}

interface DrilldownDonutChartProps {
  data: DonutSegment[]
  title: string
  onSegmentClick?: (segment: DonutSegment) => void
  breadcrumbs?: string[]
  onBreadcrumbClick?: (index: number) => void
  valueFormatter?: (value: number) => string
}

export function DrilldownDonutChart({
  data,
  title,
  onSegmentClick,
  breadcrumbs = [],
  onBreadcrumbClick,
  valueFormatter = (v) => v.toString(),
}: DrilldownDonutChartProps) {
  const [hoveredSegment, setHoveredSegment] = useState<string | null>(null)

  const total = data.reduce((sum, item) => sum + item.value, 0)
  const centerX = 200
  const centerY = 200
  const outerRadius = 140
  const innerRadius = 80
  const hoverScale = 1.08

  // Calculate path for segment
  const createSegmentPath = (
    startAngle: number,
    endAngle: number,
    outerR: number,
    innerR: number
  ): string => {
    const outerStart = {
      x: centerX + outerR * Math.cos(startAngle),
      y: centerY + outerR * Math.sin(startAngle),
    }
    const outerEnd = {
      x: centerX + outerR * Math.cos(endAngle),
      y: centerY + outerR * Math.sin(endAngle),
    }
    const innerStart = {
      x: centerX + innerR * Math.cos(endAngle),
      y: centerY + innerR * Math.sin(endAngle),
    }
    const innerEnd = {
      x: centerX + innerR * Math.cos(startAngle),
      y: centerY + innerR * Math.sin(startAngle),
    }

    const largeArcFlag = endAngle - startAngle > Math.PI ? 1 : 0

    return [
      `M ${outerStart.x} ${outerStart.y}`,
      `A ${outerR} ${outerR} 0 ${largeArcFlag} 1 ${outerEnd.x} ${outerEnd.y}`,
      `L ${innerStart.x} ${innerStart.y}`,
      `A ${innerR} ${innerR} 0 ${largeArcFlag} 0 ${innerEnd.x} ${innerEnd.y}`,
      'Z',
    ].join(' ')
  }

  // Calculate segments
  let currentAngle = -Math.PI / 2 // Start at top
  const segments = data.map((segment) => {
    const percentage = total > 0 ? segment.value / total : 0
    const angle = percentage * 2 * Math.PI
    const startAngle = currentAngle
    const endAngle = currentAngle + angle
    const midAngle = (startAngle + endAngle) / 2

    currentAngle = endAngle

    return {
      ...segment,
      startAngle,
      endAngle,
      midAngle,
      percentage: percentage * 100,
    }
  })

  return (
    <Card className="layer-l1 overflow-hidden">
      <CardHeader className="pb-2">
        <CardTitle className="text-lg">{title}</CardTitle>
        {breadcrumbs.length > 0 && (
          <div className="flex items-center gap-2 flex-wrap mt-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onBreadcrumbClick?.(0)}
              className="h-7 px-2"
            >
              <Home className="size-3" />
            </Button>
            {breadcrumbs.map((crumb, index) => (
              <div key={index} className="flex items-center gap-2">
                <ChevronRight className="size-3 text-muted-foreground" />
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => onBreadcrumbClick?.(index + 1)}
                  className="h-7 px-2 text-xs"
                >
                  {crumb}
                </Button>
              </div>
            ))}
          </div>
        )}
      </CardHeader>

      <CardContent>
        <div className="flex flex-col lg:flex-row gap-6 items-center">
          <AnimatePresence mode="wait">
            <motion.div
              key={breadcrumbs.join('-')}
              initial={{ opacity: 0, scale: 0.8, rotateY: -45 }}
              animate={{ opacity: 1, scale: 1, rotateY: 0 }}
              exit={{ opacity: 0, scale: 0.8, rotateY: 45 }}
              transition={{ duration: 0.5, ease: 'easeOut' }}
              className="relative"
              style={{ perspective: '1000px' }}
            >
              <svg
                width="300"
                height="300"
                viewBox="0 0 400 400"
                className="drop-shadow-2xl"
                role="graphics-document"
                aria-roledescription="donut chart"
                aria-label={`${title} - showing ${data.length} segments totaling ${valueFormatter(total)}`}
              >
                <title>{title}</title>
                <defs>
                  {/* Gradients for each segment */}
                  {segments.map((segment) => (
                    <linearGradient
                      key={`gradient-${segment.id}`}
                      id={`gradient-${segment.id}`}
                      x1="0%"
                      y1="0%"
                      x2="0%"
                      y2="100%"
                    >
                      <stop
                        offset="0%"
                        stopColor={segment.color}
                        stopOpacity="1"
                      />
                      <stop
                        offset="100%"
                        stopColor={segment.color}
                        stopOpacity="0.7"
                      />
                    </linearGradient>
                  ))}

                  {/* Drop shadow */}
                  <filter
                    id="donut-shadow"
                    x="-50%"
                    y="-50%"
                    width="200%"
                    height="200%"
                  >
                    <feGaussianBlur in="SourceAlpha" stdDeviation="3" />
                    <feOffset dx="0" dy="4" result="offsetblur" />
                    <feComponentTransfer>
                      <feFuncA type="linear" slope="0.3" />
                    </feComponentTransfer>
                    <feMerge>
                      <feMergeNode />
                      <feMergeNode in="SourceGraphic" />
                    </feMerge>
                  </filter>
                </defs>

                {/* 3D depth/shadow segments */}
                {segments.map((segment, index) => (
                  <motion.path
                    key={`shadow-${segment.id}`}
                    d={createSegmentPath(
                      segment.startAngle,
                      segment.endAngle,
                      outerRadius,
                      innerRadius
                    )}
                    fill={segment.color}
                    opacity="0.3"
                    transform="translate(0, 8) scale(1.02, 1.02)"
                    style={{ transformOrigin: '200px 200px' }}
                    initial={{ pathLength: 0 }}
                    animate={{ pathLength: 1 }}
                    transition={{ delay: index * 0.05, duration: 0.6 }}
                  />
                ))}

                {/* Main donut segments */}
                {segments.map((segment, index) => {
                  const isHovered = hoveredSegment === segment.id
                  const scale = isHovered && onSegmentClick ? hoverScale : 1

                  return (
                    <motion.g key={segment.id}>
                      <motion.path
                        d={createSegmentPath(
                          segment.startAngle,
                          segment.endAngle,
                          outerRadius,
                          innerRadius
                        )}
                        fill={`url(#gradient-${segment.id})`}
                        stroke="white"
                        strokeWidth="2"
                        filter="url(#donut-shadow)"
                        className={onSegmentClick ? 'cursor-pointer' : ''}
                        style={{ transformOrigin: '200px 200px' }}
                        role="graphics-symbol"
                        aria-label={`${segment.label}: ${valueFormatter(segment.value)} (${segment.percentage.toFixed(1)}%)`}
                        tabIndex={onSegmentClick ? 0 : undefined}
                        initial={{ pathLength: 0, opacity: 0 }}
                        animate={{
                          pathLength: 1,
                          opacity: 1,
                          scale: scale,
                        }}
                        transition={{
                          pathLength: { delay: index * 0.05, duration: 0.6 },
                          opacity: { delay: index * 0.05, duration: 0.3 },
                          scale: { duration: 0.2 },
                        }}
                        onMouseEnter={() => setHoveredSegment(segment.id)}
                        onMouseLeave={() => setHoveredSegment(null)}
                        onClick={() => onSegmentClick?.(segment)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' || e.key === ' ') {
                            e.preventDefault()
                            onSegmentClick?.(segment)
                          }
                        }}
                        onFocus={() => setHoveredSegment(segment.id)}
                        onBlur={() => setHoveredSegment(null)}
                        whileHover={
                          onSegmentClick
                            ? {
                                filter: 'brightness(1.1)',
                              }
                            : {}
                        }
                      />

                      {/* Percentage label in the middle of segment */}
                      {segment.percentage > 5 && (
                        <motion.text
                          x={
                            centerX +
                            ((outerRadius + innerRadius) / 2) *
                              Math.cos(segment.midAngle)
                          }
                          y={
                            centerY +
                            ((outerRadius + innerRadius) / 2) *
                              Math.sin(segment.midAngle)
                          }
                          textAnchor="middle"
                          dominantBaseline="middle"
                          fill="white"
                          className="text-xs pointer-events-none font-medium"
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          transition={{ delay: index * 0.05 + 0.3 }}
                        >
                          {segment.percentage.toFixed(0)}%
                        </motion.text>
                      )}
                    </motion.g>
                  )
                })}

                {/* Center circle with total */}
                <motion.circle
                  cx={centerX}
                  cy={centerY}
                  r={innerRadius - 5}
                  fill="hsl(var(--card))"
                  stroke="hsl(var(--border))"
                  strokeWidth="2"
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: 0.3, duration: 0.5 }}
                />

                <motion.text
                  x={centerX}
                  y={centerY - 10}
                  textAnchor="middle"
                  dominantBaseline="middle"
                  className="text-xs"
                  fill="hsl(var(--muted-foreground))"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.5 }}
                >
                  Total
                </motion.text>

                <motion.text
                  x={centerX}
                  y={centerY + 15}
                  textAnchor="middle"
                  dominantBaseline="middle"
                  fill="hsl(var(--foreground))"
                  className="text-base font-semibold"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.5 }}
                >
                  {valueFormatter(total)}
                </motion.text>
              </svg>
            </motion.div>
          </AnimatePresence>

          {/* Legend */}
          <div className="flex-1 space-y-2 max-h-64 overflow-y-auto">
            <AnimatePresence mode="wait">
              {segments.map((segment, index) => (
                <motion.div
                  key={segment.id}
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className={`flex items-center gap-3 p-2 rounded-lg transition-colors ${
                    onSegmentClick ? 'cursor-pointer hover:bg-muted' : ''
                  } ${hoveredSegment === segment.id ? 'bg-muted' : ''}`}
                  onMouseEnter={() => setHoveredSegment(segment.id)}
                  onMouseLeave={() => setHoveredSegment(null)}
                  onClick={() => onSegmentClick?.(segment)}
                >
                  <div
                    className="w-4 h-4 rounded-sm flex-shrink-0"
                    style={{ backgroundColor: segment.color }}
                  />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-sm truncate">{segment.label}</span>
                      {onSegmentClick && (
                        <ChevronRight className="size-3 text-muted-foreground flex-shrink-0" />
                      )}
                    </div>
                    {segment.sublabel && (
                      <div className="text-xs text-muted-foreground truncate">
                        {segment.sublabel}
                      </div>
                    )}
                  </div>
                  <div className="text-sm text-right flex-shrink-0">
                    <div>{valueFormatter(segment.value)}</div>
                    <div className="text-xs text-muted-foreground">
                      {segment.percentage.toFixed(1)}%
                    </div>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
