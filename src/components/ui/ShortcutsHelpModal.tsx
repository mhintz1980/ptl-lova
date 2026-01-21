import { X, Keyboard } from 'lucide-react'
import { Button } from './Button'

interface ShortcutsHelpModalProps {
  isOpen: boolean
  onClose: () => void
}

interface ShortcutItem {
  keys: string[]
  description: string
  category: string
}

const SHORTCUTS: ShortcutItem[] = [
  {
    keys: ['Ctrl', 'N'],
    description: 'Open Add PO modal',
    category: 'Navigation',
  },
  {
    keys: ['Ctrl', 'F'],
    description: 'Focus search',
    category: 'Navigation',
  },
  {
    keys: ['Ctrl', '/'],
    description: 'Show keyboard shortcuts',
    category: 'Navigation',
  },
  {
    keys: ['Esc'],
    description: 'Close any modal',
    category: 'General',
  },
]

export function ShortcutsHelpModal({
  isOpen,
  onClose,
}: ShortcutsHelpModalProps) {
  if (!isOpen) return null

  const categories = Array.from(new Set(SHORTCUTS.map((s) => s.category)))

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm px-4">
      <div
        className="relative w-full max-w-2xl flex flex-col overflow-hidden rounded-3xl border border-border bg-card shadow-2xl outline-none max-h-[85vh]"
        onClick={(e) => e.stopPropagation()}
        onKeyDown={(e) => {
          if (e.key === 'Escape') {
            e.preventDefault()
            onClose()
          }
        }}
        tabIndex={-1}
      >
        <div className="flex-shrink-0 border-b border-border bg-card px-6 py-[5px]">
          <div className="flex items-center justify-between min-h-[50px]">
            <div className="flex items-center gap-3">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 text-primary">
                <Keyboard className="h-4 w-4" />
              </div>
              <div>
                <h2 className="text-xl font-bold tracking-tight text-foreground">
                  Keyboard Shortcuts
                </h2>
                <p className="text-xs text-muted-foreground">
                  Quick reference for navigation and actions
                </p>
              </div>
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={onClose}
              className="rounded-full h-8 w-8 hover:bg-muted/50"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>

        <div className="flex-1 overflow-auto bg-muted/5 p-6 space-y-6">
          {categories.map((category) => (
            <section key={category}>
              <h3 className="mb-3 text-xs font-black text-muted-foreground uppercase tracking-wider border-b border-border/50 pb-1">
                {category}
              </h3>
              <div className="space-y-2">
                {SHORTCUTS.filter((s) => s.category === category).map(
                  (shortcut, idx) => (
                    <div
                      key={idx}
                      className="flex items-center justify-between rounded-md border border-border/50 bg-muted/30 p-2.5 transition-colors hover:border-border/80"
                    >
                      <span className="text-sm font-medium text-foreground">
                        {shortcut.description}
                      </span>
                      <div className="flex items-center gap-1">
                        {shortcut.keys.map((key, keyIdx) => (
                          <span key={keyIdx} className="flex items-center">
                            <kbd className="inline-flex h-6 min-w-[24px] items-center justify-center rounded border border-border bg-background px-1.5 text-xs font-mono font-bold text-foreground shadow-sm">
                              {key}
                            </kbd>
                            {keyIdx < shortcut.keys.length - 1 && (
                              <span className="mx-1 text-[10px] text-muted-foreground/50">
                                +
                              </span>
                            )}
                          </span>
                        ))}
                      </div>
                    </div>
                  )
                )}
              </div>
            </section>
          ))}
        </div>

        <div className="flex-shrink-0 border-t border-border bg-muted/40 px-6 py-[5px]">
          <div className="flex items-center justify-end gap-3 min-h-[50px]">
            <Button onClick={onClose} className="min-w-[100px]">
              Close
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
