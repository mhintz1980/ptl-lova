import { useMemo } from 'react'
import { motion } from 'motion/react'
import { Pump } from '../../types'
import { PumpIcon } from './ArmyMenIcons'

interface ArmyMenGridProps {
  pumps: Pump[]
  onPumpSelect?: (pump: Pump) => void
}

export function ArmyMenGrid({ pumps, onPumpSelect }: ArmyMenGridProps) {
  // Split into the 3 zones
  const { queue, wip, shipped } = useMemo(() => {
    const q: Pump[] = []
    const w: Pump[] = []
    const s: Pump[] = []

    pumps.forEach((p) => {
      if (p.stage === 'QUEUE') {
        q.push(p)
      } else if (p.stage === 'SHIP' || p.stage === 'CLOSED') {
        s.push(p)
      } else {
        w.push(p)
      }
    })

    return { queue: q, wip: w, shipped: s }
  }, [pumps])

  const handlePumpClick = (pump: Pump) => {
    if (onPumpSelect) onPumpSelect(pump)
  }

  return (
    <div className="flex flex-col h-full bg-background relative pt-4">
      {/* The 3 Columns */}
      <div className="flex-1 grid grid-cols-1 md:grid-cols-3 gap-6 overflow-y-auto custom-scrollbar pb-24">
        <GridZone
          title="Not Started (Queue)"
          pumps={queue}
          zoneType="queue"
          onClick={handlePumpClick}
        />
        <GridZone
          title="In Production (WIP)"
          pumps={wip}
          zoneType="wip"
          onClick={handlePumpClick}
        />
        <GridZone
          title="Shipped / Closed"
          pumps={shipped}
          zoneType="shipped"
          onClick={handlePumpClick}
        />
      </div>

      {/* Legend */}
      <div className="fixed bottom-0 left-0 right-0 bg-card border-t border-border p-4 flex justify-center gap-8 text-xs text-muted-foreground z-20 overflow-x-auto">
        <div className="flex items-center gap-2">
          <PumpIcon
            abbreviation="HC15"
            className="w-10 h-10"
            baseColor="#888"
          />
          <span>Centrifugal (HC)</span>
        </div>
        <div className="flex items-center gap-2">
          <PumpIcon
            abbreviation="RL20"
            className="w-10 h-10"
            baseColor="#888"
          />
          <span>Rotary Lobe (RL)</span>
        </div>
        <div className="flex items-center gap-2">
          <PumpIcon
            abbreviation="DD04"
            className="w-10 h-10"
            baseColor="#888"
          />
          <span>Diaphragm (DD)</span>
        </div>
        <div className="flex items-center gap-2">
          <PumpIcon
            abbreviation="RL30"
            isSafe={true}
            className="w-10 h-10"
            baseColor="#888"
          />
          <span>SAFE Variant</span>
        </div>
      </div>
    </div>
  )
}

function GridZone({
  title,
  pumps,
  zoneType,
  onClick,
}: {
  title: string
  pumps: Pump[]
  zoneType: 'queue' | 'wip' | 'shipped'
  onClick: (p: Pump) => void
}) {
  return (
    <div className="flex flex-col h-full border border-border/50 rounded-xl bg-card/20 overflow-hidden">
      <div className="p-4 border-b border-border/50 bg-card/50 backdrop-blur-sm flex justify-between items-center">
        <h3 className="font-bold text-foreground text-sm tracking-widest uppercase">
          {title}
        </h3>
        <span className="px-2 py-0.5 rounded-full bg-background text-xs font-mono font-bold">
          {pumps.length}
        </span>
      </div>
      <div className="flex-1 p-4 flex flex-wrap content-start gap-2 overflow-y-auto">
        {pumps.map((p) => (
          <PumpGridItem
            key={p.id}
            pump={p}
            zoneType={zoneType}
            onClick={onClick}
          />
        ))}
      </div>
    </div>
  )
}

function getPumpAbbreviation(model: string): string {
  if (!model) return 'UNKN'
  const upper = model.toUpperCase()

  if (upper.includes('DD4')) return 'DD4'
  if (upper.includes('DD6')) return 'DD6'

  const lettersMatch = upper.match(/[A-Z]{2}/)
  const letters = lettersMatch ? lettersMatch[0] : 'XX'

  const digitsMatch = upper.match(/\d+/)
  let numbers = digitsMatch ? digitsMatch[0] : '00'

  if (numbers.length === 1) {
    numbers = '0' + numbers
  } else if (numbers.length > 2) {
    numbers = numbers.substring(0, 2)
  }

  return `${letters}${numbers}`
}

function PumpGridItem({
  pump,
  zoneType,
  onClick,
}: {
  pump: Pump
  zoneType: 'queue' | 'wip' | 'shipped'
  onClick: (p: Pump) => void
}) {
  const isSafe = pump.model?.toUpperCase().includes('SAFE')
  const abbreviation = getPumpAbbreviation(pump.model || '')

  let glowColor
  let baseColor = '#52525b' // zinc-600

  if (zoneType === 'wip') {
    baseColor = '#3b82f6' // blue-500
    glowColor = 'rgba(59, 130, 246, 0.4)'
  } else if (zoneType === 'shipped') {
    baseColor = '#22c55e' // green-500
    glowColor = 'rgba(34, 197, 94, 0.4)'
  }

  // To achieve the proportional packing (scaling based on count),
  // flex-grow and flex-shrink combined with flex-basis helps the items fill the space
  // The user wants dense packing. We'll use a responsive flex item.
  return (
    <motion.button
      layout
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.8 }}
      whileHover={{ scale: 1.1, zIndex: 10 }}
      whileTap={{ scale: 0.95 }}
      onClick={() => onClick(pump)}
      className="relative flex-grow min-w-[40px] max-w-[80px] aspect-[4/3] flex items-center justify-center p-1 group"
      title={`${pump.po} - ${pump.model} - ${pump.customer}\nStage: ${pump.stage}`}
    >
      <PumpIcon
        abbreviation={abbreviation}
        isSafe={isSafe}
        glowColor={glowColor}
        baseColor={baseColor}
        powderDotColor={pump.powder_color || undefined}
        className="w-full h-full drop-shadow-md transition-all duration-300"
      />
      {/* Optional: Add a subtle overlay for Priority if needed later */}
      {pump.priority === 'Rush' || pump.priority === 'Urgent' ? (
        <div className="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.8)]" />
      ) : null}
    </motion.button>
  )
}
