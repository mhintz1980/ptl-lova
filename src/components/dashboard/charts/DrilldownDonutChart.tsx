import { motion } from 'motion/react'
import { Card, CardContent, CardHeader, CardTitle } from '../../ui/Card'
import { Button } from '../../ui/Button'
import { ChevronRight, Home, X } from 'lucide-react'
import { useState, useCallback, memo } from 'react'
import { cn } from '../../../lib/utils'

export interface DonutSegment {
  id: string
  label: string
  value: number
  color: string
  sublabel?: string
}

export interface DonutTab {
  id: string
  label: string
}

export interface DetailRow {
  id: string
  label: string
  value: string
  sublabel?: string
}

interface DrilldownDonutChartProps {
  data: DonutSegment[]
  title: string
  onSegmentClick?: (segment: DonutSegment) => void
  onSegmentSelect?: (segment: DonutSegment | null) => void
  breadcrumbs?: string[]
  onBreadcrumbClick?: (index: number) => void
  valueFormatter?: (value: number) => string
  className?: string
  height?: number
  // Tab support
  tabs?: DonutTab[]
  activeTab?: string
  onTabChange?: (tabId: string) => void
  // Inline detail table
  detailData?: DetailRow[]
  selectedSegmentId?: string | null
}

export const DrilldownDonutChart = memo(function DrilldownDonutChart({
  data,
  title,
  onSegmentClick,
  onSegmentSelect,
  breadcrumbs = [],
  onBreadcrumbClick,
  valueFormatter = (v) => v.toString(),
  className,
  height = 375,
  tabs,
  activeTab,
  onTabChange,
  detailData,
  selectedSegmentId,
}: DrilldownDonutChartProps) {
  const [hoveredSegment, setHoveredSegment] = useState<string | null>(null)
  const [internalActiveTab, setInternalActiveTab] = useState(
    tabs?.[0]?.id || ''
  )

  // Use controlled tab if provided, otherwise internal state
  const currentTab = activeTab ?? internalActiveTab

  // ═══════════════════════════════════════════════════════════════════════════
  // SVG DISPLAY DIMENSIONS - Width controls donut size, height is cropped
  // ═══════════════════════════════════════════════════════════════════════════
  // Reserve space for tabs and detail panel
  const hasDetail = detailData && detailData.length > 0 && selectedSegmentId
  // Fixed width to maintain exact donut size (was 242px at height=375, ratio=0.58)
  const svgDisplayWidth = 242
  // Reduced height ratio to give more room for legend (third row)
  const svgHeightRatio = hasDetail ? 0.45 : 0.5
  const svgDisplayHeight = Math.round(height * svgHeightRatio)

  const total = data.reduce((sum, item) => sum + item.value, 0)
  // ═══════════════════════════════════════════════════════════════════════════
  // DONUT GEOMETRY SETTINGS (coordinates within the 400x400 viewBox)
  // ═══════════════════════════════════════════════════════════════════════════
  const centerX = 200
  const centerY = 162
  const outerRadius = 153
  const innerRadius = 85
  const hoverScale = 1.08

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
  let currentAngle = -Math.PI / 2
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

  const handleSegmentInteraction = useCallback(
    (segment: DonutSegment) => {
      // If onSegmentSelect is provided, use it (new behavior for inline detail)
      if (onSegmentSelect) {
        onSegmentSelect(selectedSegmentId === segment.id ? null : segment)
      }
      // If onSegmentClick is provided, call it (legacy drill-down behavior)
      if (onSegmentClick) {
        onSegmentClick(segment)
      }
    },
    [onSegmentSelect, onSegmentClick, selectedSegmentId]
  )

  const handleTabChangeMemo = useCallback(
    (tabId: string) => {
      if (onTabChange) {
        onTabChange(tabId)
      } else {
        setInternalActiveTab(tabId)
      }
      // Clear selection when tab changes
      if (onSegmentSelect) {
        onSegmentSelect(null)
      }
    },
    [onTabChange, onSegmentSelect]
  )

  return (
    <Card
      className={cn(
        'layer-l1 overflow-hidden !bg-card !relative flex flex-col',
        className
      )}
      style={{ height: `${height}px` }}
    >
      <style>{`.layer-l1 { isolation: isolate; }`}</style>

      <CardHeader className="p-0 !relative z-0">
        {title && <CardTitle className="text-sm">{title}</CardTitle>}
        {breadcrumbs.length > 0 && (
          <div className="flex items-center gap-1 flex-wrap mt-0">
            <Button
              variant="ghost"
              size="icon"
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
                  size="icon"
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

      <CardContent className="p-0 flex flex-col justify-center flex-1 overflow-hidden">
        {/* Tab Bar (if tabs provided) */}
        {tabs && tabs.length > 0 && (
          <div className="flex gap-1 px-2 pt-2 flex-shrink-0">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => handleTabChangeMemo(tab.id)}
                className={`
                  px-3 py-1.5 text-xs font-medium rounded-lg transition-all duration-200 backdrop-blur-sm
                  ${
                    currentTab === tab.id
                      ? 'bg-cyan-500/20 text-cyan-400 shadow-[0_0_10px_rgba(6,182,212,0.3)] border border-cyan-500/30'
                      : 'text-muted-foreground hover:text-foreground hover:bg-muted/50 border border-transparent'
                  }
                `}
              >
                {tab.label}
              </button>
            ))}
          </div>
        )}

        <div className="flex flex-col gap-2 items-center justify-center flex-1 min-h-0">
          <div className="relative z-10" style={{ perspective: '1000px' }}>
            <svg
              width={svgDisplayWidth}
              height={svgDisplayHeight}
              viewBox="0 0 400 320"
              className="drop-shadow-lg"
              role="graphics-document"
              aria-roledescription="donut chart"
              aria-label={`${title} - showing ${
                data.length
              } segments totaling ${valueFormatter(total)}`}
            >
              <title>{title}</title>
              <defs>
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
                    <feFuncA type="linear" slope="0.2" />
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
                  opacity="0.15"
                  transform="translate(0, 8) scale(1.02, 1.02)"
                  style={{ transformOrigin: `${centerX}px ${centerY}px` }}
                  initial={{ pathLength: 0 }}
                  animate={{ pathLength: 1 }}
                  transition={{ delay: index * 0.05, duration: 0.6 }}
                />
              ))}

              {/* Main donut segments */}
              {segments.map((segment, index) => {
                const isHovered = hoveredSegment === segment.id
                const isSelected = selectedSegmentId === segment.id
                const isClickable = onSegmentClick || onSegmentSelect
                const scale =
                  (isHovered || isSelected) && isClickable ? hoverScale : 1

                return (
                  <g key={segment.id}>
                    <motion.path
                      d={createSegmentPath(
                        segment.startAngle,
                        segment.endAngle,
                        outerRadius,
                        innerRadius
                      )}
                      fill={segment.color}
                      fillOpacity={isSelected ? 1 : 0.9}
                      stroke={isSelected ? 'white' : 'white'}
                      strokeWidth={isSelected ? 3 : 2}
                      filter="url(#donut-shadow)"
                      className={isClickable ? 'cursor-pointer' : ''}
                      style={{ transformOrigin: `${centerX}px ${centerY}px` }}
                      role="graphics-symbol"
                      aria-label={`${segment.label}: ${valueFormatter(
                        segment.value
                      )} (${segment.percentage.toFixed(1)}%)`}
                      tabIndex={isClickable ? 0 : undefined}
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
                      onClick={() => handleSegmentInteraction(segment)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' || e.key === ' ') {
                          e.preventDefault()
                          handleSegmentInteraction(segment)
                        }
                      }}
                      onFocus={() => setHoveredSegment(segment.id)}
                      onBlur={() => setHoveredSegment(null)}
                      whileHover={
                        isClickable
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
                        className="text-[17px] pointer-events-none font-medium"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: index * 0.05 + 0.3 }}
                      >
                        {segment.percentage.toFixed(0)}%
                      </motion.text>
                    )}
                  </g>
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
                className="text-[16px] text-muted-foreground"
                fill="hsl(var(--muted-foreground))"
                key={hoveredSegment ? 'hover-label' : 'total-label'}
                initial={{ opacity: 0, y: 5 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -5 }}
                transition={{ duration: 0.2 }}
              >
                {hoveredSegment
                  ? data.find((s) => s.id === hoveredSegment)?.label
                  : 'Total'}
              </motion.text>

              <motion.text
                x={centerX}
                y={centerY + 15}
                textAnchor="middle"
                dominantBaseline="middle"
                fill="hsl(var(--foreground))"
                className="text-2xl font-bold"
                key={hoveredSegment ? 'hover-value' : 'total-value'}
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
                transition={{ duration: 0.2 }}
              >
                {valueFormatter(
                  hoveredSegment
                    ? data.find((s) => s.id === hoveredSegment)?.value || 0
                    : total
                )}
              </motion.text>
            </svg>
          </div>

          {/* Legend - only show if no detail panel */}
          {!hasDetail && (
            <div className="w-full flex-1 min-h-0 overflow-y-auto custom-scrollbar px-2 mt-2">
              <div className="flex flex-wrap gap-x-1 gap-y-0.5 justify-center">
                {segments.map((segment, index) => (
                  <motion.div
                    key={segment.id}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: index * 0.03 }}
                    className={`flex items-center gap-1 px-1 py-0.5 rounded transition-colors ${
                      onSegmentClick || onSegmentSelect
                        ? 'cursor-pointer hover:bg-muted'
                        : ''
                    } ${
                      hoveredSegment === segment.id ||
                      selectedSegmentId === segment.id
                        ? 'bg-muted'
                        : ''
                    }`}
                    onMouseEnter={() => setHoveredSegment(segment.id)}
                    onMouseLeave={() => setHoveredSegment(null)}
                    onClick={() => handleSegmentInteraction(segment)}
                  >
                    <div
                      className="w-2 h-2 rounded-sm flex-shrink-0"
                      style={{ backgroundColor: segment.color }}
                    />
                    <span className="text-[10px] truncate max-w-[60px]">
                      {segment.label}
                    </span>
                    <span className="text-[10px] text-muted-foreground">
                      {valueFormatter(segment.value)}
                    </span>
                    {segment.sublabel && (
                      <span className="text-[9px] text-orange-500 truncate">
                        {segment.sublabel}
                      </span>
                    )}
                  </motion.div>
                ))}
              </div>
            </div>
          )}

          {/* Inline Detail Panel (when segment selected) */}
          {hasDetail && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 10 }}
              className="w-full px-2 flex-1 min-h-0 overflow-hidden"
            >
              <div className="h-full flex flex-col border border-border/40 rounded-lg bg-muted/30 overflow-hidden">
                <div className="flex items-center justify-between px-3 py-1.5 border-b border-border/40 flex-shrink-0">
                  <span className="text-xs font-medium text-muted-foreground">
                    {data.find((s) => s.id === selectedSegmentId)?.label}{' '}
                    Details
                  </span>
                  <button
                    onClick={() => onSegmentSelect?.(null)}
                    className="p-0.5 rounded hover:bg-muted transition-colors"
                    aria-label="Close detail panel"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </div>
                <div className="flex-1 overflow-y-auto">
                  <table className="w-full text-xs">
                    <tbody>
                      {detailData?.map((row, i) => (
                        <tr
                          key={row.id}
                          className={
                            i % 2 === 0 ? 'bg-transparent' : 'bg-muted/20'
                          }
                        >
                          <td className="px-3 py-1.5 truncate max-w-[120px]">
                            {row.label}
                          </td>
                          <td className="px-3 py-1.5 text-right font-medium">
                            {row.value}
                          </td>
                          {row.sublabel && (
                            <td className="px-3 py-1.5 text-right text-muted-foreground">
                              {row.sublabel}
                            </td>
                          )}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </motion.div>
          )}
        </div>
      </CardContent>
    </Card>
  )
})
