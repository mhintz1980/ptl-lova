import { motion, AnimatePresence } from "motion/react";
import { Card } from "./ui/card";
import { Button } from "./ui/button";
import { ChevronRight, Home } from "lucide-react";
import { useState, useMemo } from "react";

export interface TreemapSegment {
  id: string;
  label: string;
  value: number;
  color: string;
  sublabel?: string;
}

interface DrilldownTreemapChartProps {
  data: TreemapSegment[];
  title: string;
  onSegmentClick?: (segment: TreemapSegment) => void;
  breadcrumbs?: string[];
  onBreadcrumbClick?: (index: number) => void;
  valueFormatter?: (value: number) => string;
}

interface TreemapRect {
  x: number;
  y: number;
  width: number;
  height: number;
  segment: TreemapSegment;
}

export function DrilldownTreemapChart({
  data,
  title,
  onSegmentClick,
  breadcrumbs = [],
  onBreadcrumbClick,
  valueFormatter = (v) => v.toString(),
}: DrilldownTreemapChartProps) {
  const [hoveredSegment, setHoveredSegment] = useState<string | null>(null);
  
  const width = 600;
  const height = 400;
  const padding = 4;

  // Simple squarified treemap algorithm
  const calculateTreemap = useMemo((): TreemapRect[] => {
    if (data.length === 0) return [];

    const total = data.reduce((sum, item) => sum + item.value, 0);
    const sortedData = [...data].sort((a, b) => b.value - a.value);
    
    const rectangles: TreemapRect[] = [];
    let currentX = 0;
    let currentY = 0;
    let remainingWidth = width;
    let remainingHeight = height;
    let rowHeight = 0;
    let row: TreemapSegment[] = [];
    let rowValue = 0;

    const layoutRow = (y: number, h: number, w: number) => {
      let x = currentX;
      row.forEach((segment) => {
        const segmentWidth = (segment.value / rowValue) * w;
        rectangles.push({
          x: x + padding / 2,
          y: y + padding / 2,
          width: segmentWidth - padding,
          height: h - padding,
          segment,
        });
        x += segmentWidth;
      });
      row = [];
      rowValue = 0;
    };

    sortedData.forEach((segment, index) => {
      if (row.length === 0) {
        row.push(segment);
        rowValue = segment.value;
        
        // Calculate height for this row
        const ratio = rowValue / total;
        rowHeight = ratio * height;
      } else {
        const newRowValue = rowValue + segment.value;
        const newRowHeight = (newRowValue / total) * height;
        
        // Check if adding this segment improves aspect ratio
        const currentAspectRatio = remainingWidth / rowHeight;
        const newAspectRatio = remainingWidth / newRowHeight;
        
        if (Math.abs(newAspectRatio - 1) < Math.abs(currentAspectRatio - 1) || 
            row.length < 2) {
          row.push(segment);
          rowValue = newRowValue;
          rowHeight = newRowHeight;
        } else {
          // Layout current row and start new one
          layoutRow(currentY, rowHeight, remainingWidth);
          currentY += rowHeight;
          remainingHeight -= rowHeight;
          
          row = [segment];
          rowValue = segment.value;
          rowHeight = (rowValue / total) * height;
        }
      }
      
      // Layout last row
      if (index === sortedData.length - 1 && row.length > 0) {
        layoutRow(currentY, rowHeight, remainingWidth);
      }
    });

    return rectangles;
  }, [data, width, height]);

  return (
    <Card className="p-6 overflow-hidden">
      {/* Header with Breadcrumbs */}
      <div className="mb-6">
        <h3 className="mb-2">{title}</h3>
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

      {/* 3D Treemap Chart */}
      <div className="relative" style={{ perspective: "1200px" }}>
        <AnimatePresence mode="wait">
          <motion.div
            key={breadcrumbs.join("-")}
            initial={{ opacity: 0, rotateX: -15, z: -100 }}
            animate={{ opacity: 1, rotateX: 0, z: 0 }}
            exit={{ opacity: 0, rotateX: 15, z: -100 }}
            transition={{ duration: 0.5, ease: "easeOut" }}
            className="relative"
          >
            <svg
              width={width}
              height={height}
              className="w-full h-auto drop-shadow-xl"
              style={{ transformStyle: "preserve-3d" }}
            >
              <defs>
                {/* Gradients for each segment */}
                {calculateTreemap.map((rect) => (
                  <linearGradient
                    key={`gradient-${rect.segment.id}`}
                    id={`treemap-gradient-${rect.segment.id}`}
                    x1="0%"
                    y1="0%"
                    x2="0%"
                    y2="100%"
                  >
                    <stop offset="0%" stopColor={rect.segment.color} stopOpacity="0.95" />
                    <stop offset="100%" stopColor={rect.segment.color} stopOpacity="0.85" />
                  </linearGradient>
                ))}

                {/* Shadow filter */}
                <filter id="treemap-shadow">
                  <feGaussianBlur in="SourceAlpha" stdDeviation="2" />
                  <feOffset dx="2" dy="2" result="offsetblur" />
                  <feComponentTransfer>
                    <feFuncA type="linear" slope="0.2" />
                  </feComponentTransfer>
                  <feMerge>
                    <feMergeNode />
                    <feMergeNode in="SourceGraphic" />
                  </feMerge>
                </filter>
              </defs>

              {/* 3D depth/shadow rectangles */}
              {calculateTreemap.map((rect, index) => (
                <motion.rect
                  key={`shadow-${rect.segment.id}`}
                  x={rect.x + 3}
                  y={rect.y + 3}
                  width={rect.width}
                  height={rect.height}
                  rx="6"
                  fill={rect.segment.color}
                  opacity="0.15"
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 0.15, scale: 1 }}
                  transition={{ delay: index * 0.03, duration: 0.4 }}
                />
              ))}

              {/* Main rectangles */}
              {calculateTreemap.map((rect, index) => {
                const isHovered = hoveredSegment === rect.segment.id;
                const total = data.reduce((sum, item) => sum + item.value, 0);
                const percentage = total > 0 ? (rect.segment.value / total) * 100 : 0;
                
                return (
                  <motion.g key={rect.segment.id}>
                    <motion.rect
                      x={rect.x}
                      y={rect.y}
                      width={rect.width}
                      height={rect.height}
                      rx="6"
                      fill={rect.segment.color}
                      stroke="white"
                      strokeWidth="2"
                      filter="url(#treemap-shadow)"
                      className={onSegmentClick ? "cursor-pointer" : ""}
                      initial={{ opacity: 0, scale: 0.5 }}
                      animate={{
                        opacity: 0.9,
                        scale: isHovered && onSegmentClick ? 1.02 : 1,
                      }}
                      transition={{
                        opacity: { delay: index * 0.03, duration: 0.4 },
                        scale: { duration: 0.2 },
                      }}
                      onMouseEnter={() => setHoveredSegment(rect.segment.id)}
                      onMouseLeave={() => setHoveredSegment(null)}
                      onClick={() => onSegmentClick?.(rect.segment)}
                      whileHover={
                        onSegmentClick
                          ? {
                              filter: "brightness(1.1)",
                              strokeWidth: 3,
                            }
                          : {}
                      }
                    />

                    {/* 3D Edge highlight */}
                    <motion.rect
                      x={rect.x}
                      y={rect.y}
                      width={rect.width}
                      height="8"
                      rx="6"
                      fill={rect.segment.color}
                      opacity="0.4"
                      className="pointer-events-none"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 0.4 }}
                      transition={{ delay: index * 0.03 + 0.2, duration: 0.3 }}
                    />

                    {/* Text label */}
                    {rect.width > 80 && rect.height > 50 && (
                      <motion.g
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: index * 0.03 + 0.3 }}
                        className="pointer-events-none"
                      >
                        <text
                          x={rect.x + rect.width / 2}
                          y={rect.y + rect.height / 2 - 15}
                          textAnchor="middle"
                          fill="white"
                          className="text-sm"
                        >
                          {rect.segment.label.length > 15
                            ? rect.segment.label.substring(0, 15) + "..."
                            : rect.segment.label}
                        </text>
                        <text
                          x={rect.x + rect.width / 2}
                          y={rect.y + rect.height / 2 + 5}
                          textAnchor="middle"
                          fill="white"
                          opacity="0.9"
                          className="text-xs"
                        >
                          {valueFormatter(rect.segment.value)}
                        </text>
                        <text
                          x={rect.x + rect.width / 2}
                          y={rect.y + rect.height / 2 + 22}
                          textAnchor="middle"
                          fill="white"
                          opacity="0.8"
                          className="text-xs"
                        >
                          {percentage.toFixed(1)}%
                        </text>
                      </motion.g>
                    )}

                    {/* Compact label for smaller rectangles */}
                    {(rect.width <= 80 || rect.height <= 50) && rect.width > 40 && rect.height > 30 && (
                      <motion.text
                        x={rect.x + rect.width / 2}
                        y={rect.y + rect.height / 2}
                        textAnchor="middle"
                        dominantBaseline="middle"
                        fill="white"
                        className="text-xs pointer-events-none"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: index * 0.03 + 0.3 }}
                      >
                        {percentage.toFixed(0)}%
                      </motion.text>
                    )}

                    {/* Shine effect */}
                    <motion.rect
                      x={rect.x}
                      y={rect.y}
                      width={rect.width}
                      height={rect.height}
                      rx="6"
                      fill="url(#shine)"
                      className="pointer-events-none"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: [0, 0.3, 0] }}
                      transition={{ delay: index * 0.03 + 0.4, duration: 0.8 }}
                    />
                  </motion.g>
                );
              })}

              {/* Shine gradient definition */}
              <defs>
                <linearGradient id="shine" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="white" stopOpacity="0" />
                  <stop offset="50%" stopColor="white" stopOpacity="0.4" />
                  <stop offset="100%" stopColor="white" stopOpacity="0" />
                </linearGradient>
              </defs>
            </svg>
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Legend/Summary */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="mt-6 pt-4 border-t"
      >
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {data.map((segment, index) => {
            const total = data.reduce((sum, item) => sum + item.value, 0);
            const percentage = total > 0 ? (segment.value / total) * 100 : 0;
            
            return (
              <motion.div
                key={segment.id}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: index * 0.05 }}
                className={`flex items-center gap-2 p-2 rounded-lg transition-colors ${
                  onSegmentClick ? "cursor-pointer hover:bg-muted" : ""
                } ${hoveredSegment === segment.id ? "bg-muted" : ""}`}
                onMouseEnter={() => setHoveredSegment(segment.id)}
                onMouseLeave={() => setHoveredSegment(null)}
                onClick={() => onSegmentClick?.(segment)}
              >
                <div
                  className="w-3 h-3 rounded-sm flex-shrink-0"
                  style={{ backgroundColor: segment.color }}
                />
                <div className="flex-1 min-w-0">
                  <div className="text-xs truncate">{segment.label}</div>
                  <div className="text-xs text-muted-foreground">
                    {percentage.toFixed(1)}%
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      </motion.div>
    </Card>
  );
}