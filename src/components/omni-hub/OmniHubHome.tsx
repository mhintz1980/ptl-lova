import { useMemo, useState } from 'react'
import { motion, AnimatePresence } from 'motion/react'
import { CheckCircle2, Search } from 'lucide-react'
import { Pump } from '../../types'
import { ActionCard } from './ActionCard'
import { QuickResolveDrawer } from './QuickResolveDrawer'
import { GlobalSearchModal } from './GlobalSearchModal'
import { ArmyMenGrid } from './ArmyMenGrid'

interface OmniHubHomeProps {
  pumps: Pump[]
}

type TabType = 'INBOX' | 'ON_TRACK'

export function OmniHubHome({ pumps }: OmniHubHomeProps) {
  const [selectedPump, setSelectedPump] = useState<Pump | null>(null)
  const [isSearchOpen, setIsSearchOpen] = useState(false)
  const [activeTab, setActiveTab] = useState<TabType>('INBOX')

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

  // Sort pumps to show critical first for the Action Inbox
  const actionInboxPumps = useMemo(() => {
    return pumps
      .filter((p) => {
        const now = Date.now()
        const isCritical =
          p.isPaused || (p.serial === null && p.stage !== 'QUEUE')
        const isOffTrack =
          p.promiseDate && new Date(p.promiseDate).getTime() < now
        return isCritical || isOffTrack
      })
      .sort((a, b) => {
        const aCritical =
          a.isPaused || (a.serial === null && a.stage !== 'QUEUE') ? 1 : 0
        const bCritical =
          b.isPaused || (b.serial === null && b.stage !== 'QUEUE') ? 1 : 0
        return bCritical - aCritical
      })
      .slice(0, 50) // limit to top 50 for performance
  }, [pumps])

  // Extract ON-TRACK pumps for the Army Men Grid
  const onTrackPumps = useMemo(() => {
    return pumps.filter((p) => {
      const now = Date.now()
      const isCritical =
        p.isPaused || (p.serial === null && p.stage !== 'QUEUE')
      const isOffTrack =
        p.promiseDate && new Date(p.promiseDate).getTime() < now
      return !isCritical && !isOffTrack
    })
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

  // Process filtered pumps to pass directly to grids where needed
  const finalOnTrackPumps = useMemo(() => {
    return onTrackPumps.filter((p) => {
      const matchesSearch =
        searchFilter === '' ||
        p.po.toLowerCase().includes(searchFilter.toLowerCase()) ||
        p.customer.toLowerCase().includes(searchFilter.toLowerCase())
      const matchesModel = modelFilter === '' || p.model === modelFilter
      return matchesSearch && matchesModel
    })
  }, [onTrackPumps, searchFilter, modelFilter])

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
          isActive={activeTab === 'INBOX'}
          onClick={() => setActiveTab('INBOX')}
        />
        <StatusToggle
          label="OFF-TRACK"
          count={offTrackCount}
          colorClass="border-yellow-500/50 shadow-[0_0_15px_rgba(234,179,8,0.2)]"
          dotClass="bg-yellow-500 shadow-[0_0_10px_rgba(234,179,8,0.8)]"
          textClass="text-yellow-500 text-shadow-sm"
          isActive={activeTab === 'INBOX'}
          onClick={() => setActiveTab('INBOX')}
        />
        <StatusToggle
          label="ON-TRACK"
          count={onTrackCount}
          colorClass="border-green-500/50 shadow-[0_0_15px_rgba(34,197,94,0.2)]"
          dotClass="bg-green-500 shadow-[0_0_10px_rgba(34,197,94,0.8)]"
          textClass="text-green-500 text-shadow-sm"
          isActive={activeTab === 'ON_TRACK'}
          onClick={() => setActiveTab('ON_TRACK')}
        />
      </div>

      {/* Tab Navigation */}
      <div className="flex items-center justify-between mb-4 border-b border-border">
        <div className="flex gap-6">
          <button
            className={`pb-3 text-sm font-bold tracking-wider uppercase transition-colors relative ${
              activeTab === 'INBOX'
                ? 'text-primary'
                : 'text-muted-foreground hover:text-foreground'
            }`}
            onClick={() => setActiveTab('INBOX')}
          >
            Action Inbox ({criticalCount + offTrackCount})
            {activeTab === 'INBOX' && (
              <motion.div
                layoutId="tab-indicator"
                className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary"
              />
            )}
          </button>
          <button
            className={`pb-3 text-sm font-bold tracking-wider uppercase transition-colors relative ${
              activeTab === 'ON_TRACK'
                ? 'text-green-500'
                : 'text-muted-foreground hover:text-foreground'
            }`}
            onClick={() => setActiveTab('ON_TRACK')}
          >
            On-Track ({onTrackCount})
            {activeTab === 'ON_TRACK' && (
              <motion.div
                layoutId="tab-indicator"
                className="absolute bottom-0 left-0 right-0 h-0.5 bg-green-500"
              />
            )}
          </button>
        </div>

        {/* Inline Filters */}
        <div className="flex items-center gap-3 pb-2">
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
          {/* TAB: INBOX */}
          {activeTab === 'INBOX' && (
            <motion.div
              key="inbox"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              transition={{ duration: 0.2 }}
              className="flex flex-col gap-4 h-full"
            >
              {actionInboxPumps.length > 0 ? (
                actionInboxPumps.map((pump) => (
                  <motion.div
                    key={pump.id}
                    layout
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    style={{
                      contentVisibility: 'auto',
                      containIntrinsicHeight: '180px',
                    }}
                  >
                    <ActionCard
                      pump={pump}
                      onActionClick={() => setSelectedPump(pump)}
                    />
                  </motion.div>
                ))
              ) : (
                <div className="flex flex-col items-center justify-center h-full text-center opacity-80 mt-12">
                  <div className="w-32 h-32 rounded-full bg-green-500/10 flex items-center justify-center mb-6 shadow-[0_0_50px_rgba(34,197,94,0.2)] border border-green-500/30">
                    <CheckCircle2 className="w-16 h-16 text-green-500 drop-shadow-[0_0_15px_rgba(34,197,94,0.8)]" />
                  </div>
                  <h2 className="text-3xl font-bold text-foreground mb-2 tracking-tight">
                    INBOX ZERO
                  </h2>
                  <p className="text-muted-foreground text-lg max-w-md">
                    All Clear! The manufacturing floor is running smoothly. No
                    critical actions required.
                  </p>
                </div>
              )}
            </motion.div>
          )}

          {/* TAB: ON-TRACK */}
          {activeTab === 'ON_TRACK' && (
            <motion.div
              key="ontrack"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.2 }}
              className="flex flex-col gap-4 h-full"
            >
              <div className="h-full">
                <ArmyMenGrid
                  pumps={finalOnTrackPumps}
                  onPumpSelect={(pump) => setSelectedPump(pump)}
                />
              </div>
            </motion.div>
          )}
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
