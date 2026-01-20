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
      className="header-button header-button--accent h-[40px] w-[40px] rounded-full"
      title="Add PO"
      aria-label="Add purchase order"
    >
      <Plus className="h-6 w-6" strokeWidth={3} />
    </Button>
  )
}
