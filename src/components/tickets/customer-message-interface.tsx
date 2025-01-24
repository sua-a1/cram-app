'use client'

import { CustomerMessageComposer } from './customer-message-composer'
import { useToast } from '@/hooks/use-toast'

interface CustomerMessageInterfaceProps {
  ticketId: string
  onMessageSent?: () => void
  disabled?: boolean
}

export function CustomerMessageInterface({ 
  ticketId,
  onMessageSent,
  disabled = false 
}: CustomerMessageInterfaceProps) {
  const { toast } = useToast()

  async function handleSendMessage({ body }: { body: string }) {
    try {
      const response = await fetch('/api/tickets/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ticketId,
          content: body,
        }),
      })

      if (!response.ok) {
        const error = await response.text()
        throw new Error(error || 'Failed to send message')
      }

      const message = await response.json()
      
      toast({
        title: 'Message sent',
        description: 'Your message has been sent successfully.',
      })
      
      onMessageSent?.()
      return message
    } catch (error) {
      console.error('Error sending message:', error)
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to send message. Please try again.',
      })
      throw error
    }
  }

  return (
    <CustomerMessageComposer
      ticketId={ticketId}
      onSendMessage={handleSendMessage}
      disabled={disabled}
    />
  )
} 