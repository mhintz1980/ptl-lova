// src/components/chat/VoiceInput.tsx
import { Mic } from 'lucide-react'
import { Button } from '../ui/Button'
import { Tooltip } from '../ui/Tooltip'

interface VoiceInputProps {
  disabled?: boolean
}

export function VoiceInput({ disabled = true }: VoiceInputProps) {
  return (
    <Tooltip content="Voice input coming soon" side="top">
      <div>
        <Button
          variant="ghost"
          size="icon"
          disabled={disabled}
          className="text-muted-foreground hover:text-foreground"
          aria-label="Voice input"
        >
          <Mic className="h-5 w-5" />
        </Button>
      </div>
    </Tooltip>
  )
}
