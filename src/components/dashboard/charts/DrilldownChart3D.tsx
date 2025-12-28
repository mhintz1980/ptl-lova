import { motion, AnimatePresence } from 'motion/react'
import { Card } from '../../ui/Card'
import { Button } from '../../ui/Button'
import { ChevronRight, Home } from 'lucide-react'

export interface DrilldownSegment {
  id: string
  label: string
  value: number
  color: string
  sublabel?: string
}

interface DrilldownChart3DProps {
  data: DrilldownSegment[]
  title: string
  onSegmentClick?: (segment: DrilldownSegment) => void
  breadcrumbs?: string[]
  onBreadcrumbClick?: (index: number) => void
  valueFormatter?: (value: number) => string
}

export function DrilldownChart3D({
  data,
  title,
  onSegmentClick,
  breadcrumbs = [],
  onBreadcrumbClick,
  valueFormatter = (v) => v.toString(),
}: DrilldownChart3DProps) {
  const total = data.reduce((sum, item) => sum + item.value, 0)

  return (
    <Card className="layer-l1 overflow-hidden !bg-card !relative">
      <style>{`.layer-l1-drilldown-3d { isolation: isolate; }`}</style>

      {/* Header with Breadcrumbs */}
      <div className="!relative z-20 mb-6 px-6 pt-6">
        <h3 className="text-lg font-semibold text-foreground mb-2">{title}</h3>
        {breadcrumbs.length > 0 && (
          <div className="flex items-center gap-2 flex-wrap">
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
                  className="h-7 px-2"
                >
                  {crumb}
                </Button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* 3D Bar Chart */}
      <div className="!relative z-10 px-6 pb-6 min-h-[300px]" style={{ perspective: '1000px' }}>
        <AnimatePresence mode="wait">
          <motion.div
            key={breadcrumbs.join('-')}
            initial={{ opacity: 0, rotateY: -15, z: -100 }}
            animate={{ opacity: 1, rotateY: 0, z: 0 }}
            exit={{ opacity: 0, rotateY: 15, z: -100 }}
            transition={{ duration: 0.5, ease: 'easeOut' }}
            className="space-y-3"
          >
            {data.map((segment, index) => {
              const percentage = total > 0 ? (segment.value / total) * 100 : 0
              const height = Math.max(percentage, 5) // Minimum 5% height for visibility

              return (
                <motion.div
                  key={segment.id}
                  initial={{ opacity: 0, x: -50, scale: 0.9 }}
                  animate={{ opacity: 1, x: 0, scale: 1 }}
                  transition={{ delay: index * 0.05, duration: 0.3 }}
                  className={`relative group ${onSegmentClick ? 'cursor-pointer' : ''}`}
                  onClick={() => onSegmentClick?.(segment)}
                  style={{ perspective: '800px' }}
                >
                  {/* 3D Bar Container */}
                  <div className="relative">
                    {/* Label */}
                    <div className="flex items-center justify-between mb-1.5">
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <span className="text-sm text-foreground">{segment.label}</span>
                          {onSegmentClick && (
                            <ChevronRight className="size-3 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                          )}
                        </div>
                        {segment.sublabel && (
                          <div className="text-xs text-muted-foreground">
                            {segment.sublabel}
                          </div>
                        )}
                      </div>
                      <div className="text-sm text-foreground">
                        <span>{valueFormatter(segment.value)}</span>
                        <span className="text-muted-foreground ml-2">
                          {percentage.toFixed(1)}%
                        </span>
                      </div>
                    </div>

                    {/* 3D Bar with Shadow */}
                    <div className="relative h-12">
                      {/* Shadow/Depth Layer */}
                      <motion.div
                        className="absolute inset-0 rounded-lg"
                        style={{
                          background: `${segment.color}`,
                          opacity: 0.15,
                          transform: 'translateY(4px) translateX(4px) rotateX(5deg)',
                          transformStyle: 'preserve-3d',
                        }}
                        initial={{ width: '0%' }}
                        animate={{ width: `${height}%` }}
                        transition={{ delay: index * 0.05 + 0.2, duration: 0.6 }}
                      />

                      {/* Main Bar */}
                      <motion.div
                        className="absolute inset-0 rounded-lg overflow-hidden group-hover:shadow-lg transition-all duration-300"
                        style={{
                          background: segment.color,
                          opacity: 0.9,
                          transformStyle: 'preserve-3d',
                          boxShadow: `0 4px 8px ${segment.color}40`,
                        }}
                        initial={{ width: '0%' }}
                        animate={{ width: `${height}%` }}
                        transition={{ delay: index * 0.05 + 0.2, duration: 0.6 }}
                        whileHover={
                          onSegmentClick
                            ? {
                                scale: 1.02,
                                rotateY: 2,
                                translateZ: 10,
                                boxShadow: `0 8px 16px ${segment.color}60`,
                              }
                            : {}
                        }
                      >
                        {/* Shine Effect */}
                        <motion.div
                          className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent"
                          initial={{ x: '-100%' }}
                          animate={{ x: '100%' }}
                          transition={{
                            delay: index * 0.05 + 0.5,
                            duration: 0.8,
                          }}
                        />

                        {/* 3D Edge Highlight */}
                        <div
                          className="absolute top-0 left-0 right-0 h-2"
                          style={{
                            background: segment.color,
                            opacity: 0.4,
                          }}
                        />
                      </motion.div>
                    </div>
                  </div>
                </motion.div>
              )
            })}
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Legend/Summary */}
      {data.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="!relative z-10 px-6 pb-6 pt-4 border-t border-border flex items-center justify-between"
        >
          <span className="text-sm text-muted-foreground">
            Total: {valueFormatter(total)}
          </span>
          <span className="text-sm text-muted-foreground">
            {data.length} {data.length === 1 ? 'item' : 'items'}
          </span>
        </motion.div>
      )}
    </Card>
  )
}
