'use client';

import { TicketMessage, TicketWithDetails } from '@/types/tickets';
import { format } from 'date-fns';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { Mail, MessageSquare, Lock } from 'lucide-react';

interface TicketConversationProps {
  ticket: TicketWithDetails;
  messages: TicketMessage[];
}

export function TicketConversation({ ticket, messages }: TicketConversationProps) {
  // Group messages by date
  const groupedMessages = messages.reduce<Record<string, TicketMessage[]>>((acc, message) => {
    const date = format(new Date(message.created_at), 'MMM d, yyyy');
    if (!acc[date]) {
      acc[date] = [];
    }
    acc[date].push(message);
    return acc;
  }, {});

  return (
    <div className="space-y-8">
      {Object.entries(groupedMessages).map(([date, dateMessages]) => (
        <div key={date} className="space-y-4">
          <div className="sticky top-0 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 z-10 py-2">
            <div className="text-sm text-muted-foreground">{date}</div>
          </div>
          <div className="space-y-4">
            {dateMessages.map((message) => (
              <div
                key={message.id}
                className={cn(
                  'flex gap-4 p-4 rounded-lg',
                  message.message_type === 'internal' && 'bg-muted/50'
                )}
              >
                <Avatar className="h-8 w-8">
                  <AvatarFallback>
                    {message.author_id.substring(0, 2).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium">
                      {/* TODO: Add author name from profile */}
                      {message.author_id}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      {format(new Date(message.created_at), 'h:mm a')}
                    </span>
                    <div className="flex gap-1">
                      {message.is_email && (
                        <Badge variant="secondary" className="gap-1">
                          <Mail className="h-3 w-3" />
                          Email
                        </Badge>
                      )}
                      {message.message_type === 'internal' ? (
                        <Badge variant="outline" className="gap-1">
                          <Lock className="h-3 w-3" />
                          Internal
                        </Badge>
                      ) : (
                        <Badge variant="outline" className="gap-1">
                          <MessageSquare className="h-3 w-3" />
                          Public
                        </Badge>
                      )}
                    </div>
                  </div>
                  <div className="text-sm prose prose-sm max-w-none">
                    {/* TODO: Replace with rich text renderer */}
                    {message.body}
                  </div>
                  {message.metadata && Object.keys(message.metadata).length > 0 && (
                    <div className="text-xs text-muted-foreground">
                      {/* TODO: Add metadata display */}
                      Additional Info
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
} 