import { motion } from 'motion/react'
import { X } from 'lucide-react'
import { Pump } from '../../types'
import { Button } from '../ui/Button'
import { useApp } from '../../store'

interface QuickResolveDrawerProps {
  pump: Pump
  onClose: () => void
}

export function QuickResolveDrawer({ pump, onClose }: QuickResolveDrawerProps) {
  const { resumePump } = useApp()

  const handleResolve = () => {
    if (pump.isPaused) {
      resumePump(pump.id)
    }
    // TODO: Handle serial assignment if that's the blocker
    onClose()
  }

  return (
    <>
      <motion.div
        className="fixed inset-0 bg-background/80 backdrop-blur-sm z-40"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
      />
      <motion.div
        className="fixed bottom-0 left-0 right-0 max-w-2xl mx-auto bg-card border-t border-l border-r border-border rounded-t-[32px] z-50 p-6 shadow-2xl flex flex-col"
        initial={{ y: '100%' }}
        animate={{ y: 0 }}
        exit={{ y: '100%' }}
        transition={{ type: 'spring', damping: 25, stiffness: 200 }}
      >
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-bold flex items-center gap-2">
            Quick Resolve:{' '}
            <span className="text-primary">{pump.po || 'Unassigned'}</span>
          </h2>
          <button
            onClick={onClose}
            className="w-10 h-10 flex items-center justify-center rounded-full bg-muted/50 hover:bg-muted text-foreground transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto min-h-[30vh]">
          {/* Mock Form Content */}
          <div className="space-y-6">
            {pump.isPaused ? (
              <div className="space-y-3">
                <label className="text-xs font-bold uppercase tracking-wider text-red-500">
                  Resolve Bottleneck
                </label>
                <div className="p-4 rounded-xl border border-red-500/30 bg-red-500/10 text-sm text-red-200">
                  This order is currently paused. Please review the pause reason
                  and confirm resolution.
                </div>
              </div>
            ) : (
              <div className="space-y-3">
                <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                  Missing Serial Number
                </label>
                <input
                  type="text"
                  placeholder="Enter Serial Number (e.g., S/N 98374)"
                  className="w-full h-14 bg-background border border-border rounded-xl px-4 text-base focus:ring-2 focus:ring-primary focus:outline-none transition-all"
                />
              </div>
            )}

            <div className="space-y-3">
              <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                Assign Mechanic
              </label>
              <select className="w-full h-14 bg-background border border-border rounded-xl px-4 text-base focus:ring-2 focus:ring-primary focus:outline-none appearance-none">
                <option value="">Select Personnel...</option>
                <option value="1">Sarah J. (Maintenance)</option>
                <option value="2">Mike R. (Assembly)</option>
              </select>
            </div>
          </div>
        </div>

        <div className="mt-8 flex flex-col gap-3">
          <Button
            onClick={handleResolve}
            className="w-full h-14 text-base font-bold tracking-wider rounded-xl bg-primary text-primary-foreground hover:opacity-90 transition-opacity"
          >
            SAVE & UNBLOCK
          </Button>
          <Button
            variant="ghost"
            onClick={onClose}
            className="w-full h-14 text-base font-medium rounded-xl text-muted-foreground hover:text-foreground hover:bg-muted/50"
          >
            Cancel
          </Button>
        </div>
      </motion.div>
    </>
  )
}
