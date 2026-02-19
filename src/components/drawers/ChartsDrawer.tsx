import { useEffect, useRef } from 'react'
import { X } from 'lucide-react'
import { Button } from '../ui/Button'
import { DashboardEngine } from '../dashboard/DashboardEngine'
import type { Pump } from '../../types'

interface ChartsDrawerProps {
  isOpen: boolean
  onClose: () => void
  onSelectPump?: (pump: Pump) => void
}

export function ChartsDrawer({
  isOpen,
  onClose,
  onSelectPump,
}: ChartsDrawerProps) {
  const drawerRef = useRef<HTMLDivElement>(null)

  // Close on ESC key
  useEffect(() => {
    if (!isOpen) return
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [isOpen, onClose])

  // Focus trap: focus drawer when opened
  useEffect(() => {
    if (isOpen && drawerRef.current) {
      drawerRef.current.focus()
    }
  }, [isOpen])

  return (
    <>
      {/* Backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/20 backdrop-blur-sm md:hidden"
          onClick={onClose}
          aria-hidden="true"
        />
      )}

      {/* Drawer panel */}
      <div
        ref={drawerRef}
        tabIndex={-1}
        role="dialog"
        aria-label="Charts Drawer"
        aria-modal="true"
        className={`fixed right-0 top-[60px] z-50 h-[calc(100vh-60px)] w-full border-l border-border/60 bg-background/95 backdrop-blur-xl shadow-2xl transition-transform duration-300 ease-in-out md:w-[420px] ${
          isOpen ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        {/* Drawer header */}
        <div className="flex items-center justify-between border-b border-border/60 px-4 py-3">
          <div className="flex items-center gap-2">
            <span className="text-lg">📊</span>
            <h2 className="text-sm font-semibold tracking-tight text-foreground">
              Charts & Analytics
            </h2>
          </div>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 rounded-full"
            onClick={onClose}
            aria-label="Close charts drawer"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>

        {/* Scrollable chart content */}
        <div className="h-[calc(100%-56px)] overflow-y-auto p-4 scrollbar-themed">
          {isOpen && <DashboardEngine onSelectPump={onSelectPump} />}
        </div>
      </div>
    </>
  )
}
