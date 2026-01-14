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
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-md animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div
        className="surface-elevated shadow-frame border border-border/40 rounded-2xl w-full max-w-2xl p-6 m-4 max-h-[90vh] overflow-y-auto animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
        onKeyDown={(e) => {
          if (e.key === 'Escape') {
            e.preventDefault()
            onClose()
          }
        }}
        tabIndex={-1}
      >
        <div className="mb-6 flex items-center justify-between border-b border-border/40 pb-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-primary">
              <Keyboard className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-foreground">
                Keyboard Shortcuts
              </h2>
              <p className="text-sm text-muted-foreground">
                Quick reference for navigation and actions
              </p>
            </div>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={onClose}
            className="h-8 w-8 rounded-full hover:bg-muted"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>

        <div className="space-y-6">
          {categories.map((category) => (
            <section key={category}>
              <h3 className="mb-3 text-sm font-medium text-muted-foreground uppercase tracking-wider">
                {category}
              </h3>
              <div className="space-y-2">
                {SHORTCUTS.filter((s) => s.category === category).map(
                  (shortcut, idx) => (
                    <div
                      key={idx}
                      className="flex items-center justify-between rounded-lg border border-border/40 bg-card/50 p-3 hover:bg-card/70 transition-colors"
                    >
                      <span className="text-sm text-foreground">
                        {shortcut.description}
                      </span>
                      <div className="flex items-center gap-1">
                        {shortcut.keys.map((key, keyIdx) => (
                          <span key={keyIdx} className="flex items-center">
                            <kbd className="inline-flex h-7 min-w-[28px] items-center justify-center rounded border border-border bg-muted px-2 text-xs font-semibold text-foreground shadow-sm">
                              {key}
                            </kbd>
                            {keyIdx < shortcut.keys.length - 1 && (
                              <span className="mx-1 text-xs text-muted-foreground">
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

        <div className="mt-6 flex items-center justify-end border-t border-border/40 pt-4">
          <Button onClick={onClose} className="gap-2 min-w-[100px]">
            Close
          </Button>
        </div>
      </div>
    </div>
  )
}
