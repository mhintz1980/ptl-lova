// src/components/chat/ChatAssistant.tsx
import { useState, useRef, useEffect } from 'react'
import { useChat, type ChatMessage } from './useChat'
import { Send, X, MessageSquare, Loader2 } from 'lucide-react'
import { Button } from '../ui/Button'
import { cn } from '../../lib/utils'
import { VoiceInput } from './VoiceInput'

interface ChatAssistantProps {
  className?: string
}

export function ChatAssistant({ className }: ChatAssistantProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [isOnline, setIsOnline] = useState(navigator.onLine)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  const { messages, input, handleInputChange, handleSubmit, isLoading, error } =
    useChat({
      api: '/api/chat',
    })

  // Monitor online/offline status
  useEffect(() => {
    const handleOnline = () => setIsOnline(true)
    const handleOffline = () => setIsOnline(false)
    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)
    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, [])

  // Scroll to bottom when new messages appear
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' })
    }
  }, [messages])

  const toggleChat = () => setIsOpen(!isOpen)

  return (
    <div className={cn('fixed bottom-4 right-4 z-50', className)}>
      {/* Chat Button */}
      {!isOpen && (
        <Button
          onClick={toggleChat}
          className="h-12 w-12 rounded-full shadow-lg"
          size="icon"
          aria-label="Open chat"
        >
          <MessageSquare className="h-6 w-6" />
        </Button>
      )}

      {/* Chat Window */}
      {isOpen && (
        <div
          className="bg-card border border-border rounded-xl shadow-2xl w-[360px] h-[480px] flex flex-col overflow-hidden animate-in slide-in-from-bottom-4 duration-200"
          role="dialog"
          aria-label="AI Assistant Chat"
        >
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-border bg-muted/50">
            <div className="flex items-center gap-2">
              <MessageSquare className="h-5 w-5 text-primary" />
              <span className="font-semibold text-sm">AI Assistant</span>
              {!isOnline && (
                <span className="text-xs text-warning">Offline</span>
              )}
            </div>
            <div className="flex items-center gap-1">
              <Button
                onClick={toggleChat}
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                aria-label="Close chat"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {messages.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-center text-muted-foreground text-sm">
                <MessageSquare className="h-10 w-10 mb-3 opacity-50" />
                <p className="text-xs">Ask me about pumps, orders,</p>
                <p className="text-xs">or shop capacity.</p>
              </div>
            ) : (
              messages.map((message: ChatMessage) => (
                <div
                  key={message.id}
                  className={cn(
                    'flex gap-2 max-w-[85%]',
                    message.role === 'user' ? 'ml-auto flex-row-reverse' : ''
                  )}
                >
                  <div
                    className={cn(
                      'px-3 py-2 rounded-lg text-sm',
                      message.role === 'user'
                        ? 'bg-primary text-white'
                        : 'bg-muted text-foreground'
                    )}
                  >
                    {message.content}
                  </div>
                </div>
              ))
            )}
            {isLoading && (
              <div className="flex gap-2 max-w-[85%]">
                <div className="bg-muted px-3 py-2 rounded-lg text-sm flex items-center gap-2">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span className="text-muted-foreground text-xs">
                    Thinking...
                  </span>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
            {error && (
              <div className="text-destructive text-xs px-4 py-2 bg-destructive/10 rounded">
                {error}
              </div>
            )}
          </div>

          {/* Input Area */}
          <form onSubmit={handleSubmit} className="border-t border-border p-3">
            <div className="flex items-center gap-2">
              <VoiceInput />
              <input
                type="text"
                value={input}
                onChange={handleInputChange}
                placeholder="Type your message..."
                className="flex-1 h-9 px-3 text-sm bg-background border border-input rounded-md focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-1"
                disabled={isLoading || !isOnline}
              />
              <Button
                type="submit"
                size="icon"
                className="h-9 w-9"
                disabled={isLoading || !input.trim() || !isOnline}
                aria-label="Send message"
              >
                <Send className="h-4 w-4" />
              </Button>
            </div>
          </form>
        </div>
      )}
    </div>
  )
}
