// src/components/toolbar/AddPoButton.tsx
import { Button } from '../ui/Button'
import { Plus } from 'lucide-react'

interface AddPoButtonProps {
  onClick: () => void
}

export function AddPoButton({ onClick }: AddPoButtonProps) {
  return (
    <Button
      onClick={onClick}
      size="icon"
      variant="default"
      className="header-button header-button--accent h-[60px] w-[60px] rounded-full"
      title="Add PO"
      aria-label="Add purchase order"
    >
      <Plus className="h-16 w-16" strokeWidth={3} />
    </Button>
  )
}
