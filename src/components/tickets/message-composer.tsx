'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Loader2, Send } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { MessageType } from '@/types/tickets';

interface MessageComposerProps {
  ticketId: string;
  onSendMessage: (message: { body: string; messageType: MessageType }) => Promise<void>;
  className?: string;
  disabled?: boolean;
}

export function MessageComposer({ 
  ticketId, 
  onSendMessage, 
  className,
  disabled = false 
}: MessageComposerProps) {
  const [message, setMessage] = useState('');
  const [sending, setSending] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim() || sending || disabled) return;

    try {
      setSending(true);
      await onSendMessage({
        body: message.trim(),
        messageType: 'public' // Default to public messages for now
      });
      setMessage('');
    } finally {
      setSending(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className={cn('space-y-4', className)}>
      <Textarea
        placeholder="Type your message..."
        value={message}
        onChange={(e) => setMessage(e.target.value)}
        disabled={sending || disabled}
        className="min-h-[100px]"
      />
      <div className="flex justify-end">
        <Button 
          type="submit" 
          disabled={!message.trim() || sending || disabled}
          className="gap-2"
        >
          {sending ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Sending
            </>
          ) : (
            <>
              <Send className="h-4 w-4" />
              Send Message
            </>
          )}
        </Button>
      </div>
    </form>
  );
} 