// src/components/toolbar/ExportButton.tsx
import { Button } from '../ui/Button'
import { Download } from 'lucide-react'

interface ExportButtonProps {
  onClick: () => void
}

export function ExportButton({ onClick }: ExportButtonProps) {
  return (
    <Button
      onClick={onClick}
      size="icon"
      variant="default"
      className="header-button header-button--accent h-[60px] w-[60px] rounded-full"
      title="Export Data"
      aria-label="Export purchase orders"
    >
      <Download className="h-16 w-16" strokeWidth={3} />
    </Button>
  )
}
