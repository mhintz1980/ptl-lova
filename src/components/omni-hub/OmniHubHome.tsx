import { useMemo, useState } from 'react'
import { motion, AnimatePresence } from 'motion/react'
import { CheckCircle2, Search } from 'lucide-react'
import { Pump } from '../../types'
import { QuickResolveDrawer } from './QuickResolveDrawer'
import { GlobalSearchModal } from './GlobalSearchModal'
import { ArmyMenGrid } from './ArmyMenGrid'

interface OmniHubHomeProps {
  pumps: Pump[]
}

type FilterType = 'ALL' | 'CRITICAL' | 'OFF_TRACK' | 'ON_TRACK'

export function OmniHubHome({ pumps }: OmniHubHomeProps) {
  const [selectedPump, setSelectedPump] = useState<Pump | null>(null)
  const [isSearchOpen, setIsSearchOpen] = useState(false)
  const [activeFilter, setActiveFilter] = useState<FilterType>('ALL')

  // Derive simple metrics for the top toggles
  const { criticalCount, offTrackCount, onTrackCount } = useMemo(() => {
    let critical = 0
    let offTrack = 0
    let onTrack = 0

    const now = Date.now()
    pumps.forEach((pump) => {
      if (pump.isPaused || (pump.serial === null && pump.stage !== 'QUEUE')) {
        critical++
      } else if (
        pump.promiseDate &&
        new Date(pump.promiseDate).getTime() < now
      ) {
        offTrack++
      } else {
        onTrack++
      }
    })

    return {
      criticalCount: critical,
      offTrackCount: offTrack,
      onTrackCount: onTrack,
    }
  }, [pumps])

  const [searchFilter, setSearchFilter] = useState('')
  const [modelFilter, setModelFilter] = useState('')

  // Unique models for the filter dropdown
  const uniqueModels = useMemo(() => {
    const models = new Set<string>()
    pumps.forEach((p) => {
      if (p.model) models.add(p.model)
    })
    return Array.from(models).sort()
  }, [pumps])

  // Process filtered pumps to pass directly to grid
  const finalPumps = useMemo(() => {
    return pumps.filter((p) => {
      // Apply KPI Filter
      const now = Date.now()
      const isCritical =
        p.isPaused || (p.serial === null && p.stage !== 'QUEUE')
      const isOffTrack =
        !isCritical && p.promiseDate && new Date(p.promiseDate).getTime() < now
      const isOnTrack = !isCritical && !isOffTrack

      if (activeFilter === 'CRITICAL' && !isCritical) return false
      if (activeFilter === 'OFF_TRACK' && !isOffTrack) return false
      if (activeFilter === 'ON_TRACK' && !isOnTrack) return false

      // Apply Inline Filters
      const matchesSearch =
        searchFilter === '' ||
        p.po.toLowerCase().includes(searchFilter.toLowerCase()) ||
        p.customer.toLowerCase().includes(searchFilter.toLowerCase())
      const matchesModel = modelFilter === '' || p.model === modelFilter

      return matchesSearch && matchesModel
    })
  }, [pumps, activeFilter, searchFilter, modelFilter])

  const toggleFilter = (filter: FilterType) => {
    setActiveFilter((prev) => (prev === filter ? 'ALL' : filter))
  }

  return (
    <div className="flex flex-col h-full w-full max-w-6xl mx-auto pt-4 px-2 md:px-6">
      {/* Massive Status Toggles */}
      <div className="grid grid-cols-3 gap-3 md:gap-6 mb-6 flex-shrink-0">
        <StatusToggle
          label="CRITICAL"
          count={criticalCount}
          colorClass="border-red-500/50 shadow-[0_0_15px_rgba(239,68,68,0.2)]"
          dotClass="bg-red-500 shadow-[0_0_10px_rgba(239,68,68,0.8)]"
          textClass="text-red-500 text-shadow-sm"
          isActive={activeFilter === 'CRITICAL'}
          onClick={() => toggleFilter('CRITICAL')}
        />
        <StatusToggle
          label="OFF-TRACK"
          count={offTrackCount}
          colorClass="border-yellow-500/50 shadow-[0_0_15px_rgba(234,179,8,0.2)]"
          dotClass="bg-yellow-500 shadow-[0_0_10px_rgba(234,179,8,0.8)]"
          textClass="text-yellow-500 text-shadow-sm"
          isActive={activeFilter === 'OFF_TRACK'}
          onClick={() => toggleFilter('OFF_TRACK')}
        />
        <StatusToggle
          label="ON-TRACK"
          count={onTrackCount}
          colorClass="border-green-500/50 shadow-[0_0_15px_rgba(34,197,94,0.2)]"
          dotClass="bg-green-500 shadow-[0_0_10px_rgba(34,197,94,0.8)]"
          textClass="text-green-500 text-shadow-sm"
          isActive={activeFilter === 'ON_TRACK'}
          onClick={() => toggleFilter('ON_TRACK')}
        />
      </div>

      {/* Inline Filters */}
      <div className="flex items-center justify-between mb-4 pb-2 border-b border-border">
        <div className="flex items-center gap-3">
          <div className="relative w-48 md:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search PO or Customer..."
              value={searchFilter}
              onChange={(e) => setSearchFilter(e.target.value)}
              className="w-full h-8 pl-9 pr-4 rounded-md bg-card border border-border text-xs focus:outline-none focus:ring-1 focus:ring-primary"
            />
          </div>
          <select
            value={modelFilter}
            onChange={(e) => setModelFilter(e.target.value)}
            className="h-8 px-3 rounded-md bg-card border border-border text-xs focus:outline-none focus:ring-1 focus:ring-primary appearance-none cursor-pointer w-28 md:w-32"
          >
            <option value="">All Models</option>
            {uniqueModels.map((m) => (
              <option key={m} value={m}>
                {m}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Content Area */}
      <div className="flex-1 overflow-y-auto pb-24 custom-scrollbar pr-2 min-h-0">
        <AnimatePresence mode="wait">
          <motion.div
            key={activeFilter}
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.98 }}
            transition={{ duration: 0.15 }}
            className="flex flex-col gap-4 h-full"
          >
            {finalPumps.length > 0 ? (
              <div className="h-full">
                <ArmyMenGrid
                  pumps={finalPumps}
                  onPumpSelect={(pump) => setSelectedPump(pump)}
                />
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center h-full text-center opacity-80 mt-12">
                <div className="w-32 h-32 rounded-full bg-border/20 flex items-center justify-center mb-6 shadow-[0_0_50px_rgba(0,0,0,0.1)] border border-border/50">
                  <CheckCircle2 className="w-16 h-16 text-muted-foreground drop-shadow-sm" />
                </div>
                <h2 className="text-3xl font-bold text-foreground mb-2 tracking-tight">
                  NO PUMPS FOUND
                </h2>
                <p className="text-muted-foreground text-lg max-w-md">
                  There are no pumps matching the current filters.
                </p>
              </div>
            )}
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Overlays */}
      <GlobalSearchModal
        isOpen={isSearchOpen}
        onClose={() => setIsSearchOpen(false)}
        pumps={pumps}
        onSelectPump={(pump) => setSelectedPump(pump)}
      />

      <AnimatePresence>
        {selectedPump && (
          <QuickResolveDrawer
            pump={selectedPump}
            onClose={() => setSelectedPump(null)}
          />
        )}
      </AnimatePresence>
    </div>
  )
}

function StatusToggle({
  label,
  count,
  colorClass,
  dotClass,
  textClass,
  isActive,
  onClick,
}: {
  label: string
  count: number
  colorClass: string
  dotClass: string
  textClass: string
  isActive?: boolean
  onClick?: () => void
}) {
  return (
    <button
      onClick={onClick}
      className={`flex items-center justify-between p-3 md:px-6 md:py-1 h-[40px] rounded-full border bg-card/40 backdrop-blur-sm transition-transform active:scale-95 ${colorClass} ${isActive ? 'ring-2 ring-primary ring-offset-2 ring-offset-background' : 'opacity-80 hover:opacity-100'}`}
    >
      <div className="flex items-center gap-3">
        <div className={`w-3 h-3 md:w-5 md:h-5 rounded-full ${dotClass}`} />
        <div className="flex flex-col items-start leading-none">
          <span className="text-[10px] md:text-sm font-medium text-muted-foreground tracking-wider">
            {label}
          </span>
        </div>
      </div>
      <div className={`text-xl md:text-2xl font-bold ${textClass}`}>
        {count}
      </div>
    </button>
  )
}
