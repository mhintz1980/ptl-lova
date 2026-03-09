import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'motion/react'
import { Search, X, Clock, Settings, Plus, Users } from 'lucide-react'
import { Pump } from '../../types'

interface GlobalSearchModalProps {
  isOpen: boolean
  onClose: () => void
  pumps: Pump[]
  onSelectPump: (pump: Pump) => void
}

export function GlobalSearchModal({
  isOpen,
  onClose,
  pumps,
  onSelectPump,
}: GlobalSearchModalProps) {
  const [query, setQuery] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)

  // Auto-focus the input when modal opens
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 100)
    } else {
      setQuery('')
    }
  }, [isOpen])

  // Handle Escape key to close
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [onClose])

  const searchResults =
    query.length > 1
      ? pumps
          .filter((p) => {
            const q = query.toLowerCase()
            return (
              (p.po || '').toLowerCase().includes(q) ||
              (p.model || '').toLowerCase().includes(q) ||
              (p.customer || '').toLowerCase().includes(q)
            )
          })
          .slice(0, 8)
      : []

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            className="fixed inset-0 bg-background/80 backdrop-blur-md z-50 flex items-start justify-center pt-[10vh] px-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
          >
            <motion.div
              className="w-full max-w-2xl bg-card border border-border/50 rounded-2xl shadow-2xl overflow-hidden shadow-[0_0_50px_rgba(0,0,0,0.5)]"
              initial={{ scale: 0.95, opacity: 0, y: -20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: -20 }}
              transition={{ duration: 0.2 }}
              onClick={(e) => e.stopPropagation()}
            >
              {/* Search Header */}
              <div className="relative border-b border-border/50">
                <Search className="absolute left-6 top-1/2 -translate-y-1/2 w-6 h-6 text-primary drop-shadow-[0_0_8px_rgba(56,189,248,0.5)]" />
                <input
                  ref={inputRef}
                  type="text"
                  placeholder="Type a PO, Model, or Customer (e.g., #P-9084)..."
                  className="w-full h-20 bg-transparent pl-16 pr-12 text-xl font-medium text-foreground placeholder-muted-foreground focus:outline-none"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                />
                <button
                  onClick={onClose}
                  className="absolute right-6 top-1/2 -translate-y-1/2 p-2 rounded-full hover:bg-muted/50 text-muted-foreground transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Body */}
              <div className="p-4 max-h-[60vh] overflow-y-auto custom-scrollbar">
                {query.length > 1 ? (
                  // Search Results
                  <div className="space-y-2">
                    <div className="px-4 py-2 text-xs font-bold uppercase tracking-wider text-muted-foreground">
                      Search Results
                    </div>
                    {searchResults.length > 0 ? (
                      searchResults.map((pump) => (
                        <button
                          key={pump.id}
                          className="w-full text-left p-4 rounded-xl hover:bg-muted/50 transition-colors flex items-center justify-between group"
                          onClick={() => {
                            onSelectPump(pump)
                            onClose()
                          }}
                        >
                          <div className="flex flex-col">
                            <span className="text-lg font-bold text-foreground group-hover:text-primary transition-colors">
                              PO {pump.po || 'Unassigned'}
                            </span>
                            <span className="text-sm text-muted-foreground">
                              {pump.model} • {pump.customer}
                            </span>
                          </div>
                          <div
                            className={`px-3 py-1 rounded-full text-xs font-bold border ${pump.isPaused ? 'bg-red-500/10 text-red-500 border-red-500/20' : 'bg-primary/10 text-primary border-primary/20'}`}
                          >
                            {pump.stage}
                          </div>
                        </button>
                      ))
                    ) : (
                      <div className="p-8 text-center text-muted-foreground">
                        No orders found matching "{query}".
                      </div>
                    )}
                  </div>
                ) : (
                  // Default View (Recent & Quick Actions)
                  <div className="space-y-6 px-2">
                    <div>
                      <div className="px-2 py-2 text-xs font-bold uppercase tracking-wider text-muted-foreground mb-2">
                        Recent Searches
                      </div>
                      <div className="space-y-1">
                        <RecentSearchItem
                          po="PO-2023-11-A"
                          model="RL300"
                          time="2 hours ago"
                        />
                        <RecentSearchItem
                          po="PO-9084"
                          model="DD4"
                          time="Yesterday"
                        />
                        <RecentSearchItem
                          po="MX-Delta"
                          model="SAFE Variant"
                          time="Tuesday"
                        />
                      </div>
                    </div>

                    <div>
                      <div className="px-2 py-2 text-xs font-bold uppercase tracking-wider text-muted-foreground mb-2">
                        Quick Actions
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <QuickActionItem
                          icon={<Plus className="w-5 h-5" />}
                          label="New Order"
                          color="text-green-500"
                          bg="bg-green-500/10 border-green-500/20"
                        />
                        <QuickActionItem
                          icon={<Settings className="w-5 h-5" />}
                          label="Capacity Settings"
                          color="text-primary"
                          bg="bg-primary/10 border-primary/20"
                        />
                        <QuickActionItem
                          icon={<Users className="w-5 h-5" />}
                          label="Manager Approvals"
                          color="text-yellow-500"
                          bg="bg-yellow-500/10 border-yellow-500/20"
                        />
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </motion.div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}

function RecentSearchItem({
  po,
  model,
  time,
}: {
  po: string
  model: string
  time: string
}) {
  return (
    <button className="w-full flex items-center justify-between p-3 rounded-lg hover:bg-muted/50 transition-colors text-left group">
      <div className="flex items-center gap-4">
        <Clock className="w-4 h-4 text-muted-foreground group-hover:text-primary transition-colors" />
        <span className="font-medium text-foreground">
          {po}{' '}
          <span className="text-muted-foreground font-normal ml-2">
            ({model})
          </span>
        </span>
      </div>
      <span className="text-xs text-muted-foreground">{time}</span>
    </button>
  )
}

function QuickActionItem({
  icon,
  label,
  color,
  bg,
}: {
  icon: React.ReactNode
  label: string
  color: string
  bg: string
}) {
  return (
    <button
      className={`flex items-center gap-3 p-4 rounded-xl border ${bg} hover:bg-muted/50 transition-colors text-left`}
    >
      <div className={`${color}`}>{icon}</div>
      <span className="font-medium text-foreground text-sm">{label}</span>
    </button>
  )
}
