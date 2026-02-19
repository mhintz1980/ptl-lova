import { useEffect, useRef } from 'react'
import { X } from 'lucide-react'
import { Button } from '../ui/Button'
import { SchedulingView } from '../scheduling/SchedulingView'
import type { Pump } from '../../types'

interface ScheduleModalProps {
  isOpen: boolean
  onClose: () => void
  pumps: Pump[]
}

export function ScheduleModal({ isOpen, onClose, pumps }: ScheduleModalProps) {
  const closeButtonRef = useRef<HTMLButtonElement>(null)

  // Close on ESC key
  useEffect(() => {
    if (!isOpen) return
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [isOpen, onClose])

  // Focus close button when modal opens
  useEffect(() => {
    if (isOpen && closeButtonRef.current) {
      closeButtonRef.current.focus()
    }
  }, [isOpen])

  // Lock body scroll when open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }
    return () => {
      document.body.style.overflow = ''
    }
  }, [isOpen])

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-[60] flex flex-col bg-background/98 backdrop-blur-xl">
      {/* Modal header */}
      <div className="flex items-center justify-between border-b border-border/60 px-6 py-3">
        <div className="flex items-center gap-2">
          <span className="text-lg">📅</span>
          <h2 className="text-sm font-semibold tracking-tight text-foreground">
            Schedule Forecast
          </h2>
        </div>
        <Button
          ref={closeButtonRef}
          variant="ghost"
          size="icon"
          className="h-8 w-8 rounded-full"
          onClick={onClose}
          tabIndex={0}
          aria-label="Close schedule modal"
        >
          <X className="h-4 w-4" />
        </Button>
      </div>

      {/* Scheduling content - full remaining height */}
      <div className="flex-1 overflow-auto p-4">
        <SchedulingView pumps={pumps} />
      </div>
    </div>
  )
}
