import { useEffect, useState } from 'react';
import { Card } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { formatDistanceToNow, format } from 'date-fns';
import type { TicketMessage, MessageType } from '@/types/tickets';
import { cn } from '@/lib/utils';
import {
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
} from "@/components/ui/hover-card";
import { InfoIcon } from 'lucide-react';
import { MessageComposer } from './message-composer';
import { useToast } from '@/hooks/use-toast';

interface TicketMessagesProps {
  messages: TicketMessage[];
  currentUserId: string;
  onSendMessage: (message: { body: string; messageType: MessageType }) => Promise<void>;
  className?: string;
  disabled?: boolean;
}

interface MessageItemProps {
  message: TicketMessage;
  isCurrentUser: boolean;
}

function MessageItem({ message, isCurrentUser }: MessageItemProps) {
  const displayName = isCurrentUser 
    ? 'You' 
    : message.author_role === 'customer'
      ? message.author_name || 'Unknown Customer'
      : message.author?.display_name || 'Unknown User';

  const avatarInitial = isCurrentUser 
    ? 'Y' 
    : message.author_role === 'customer'
      ? (message.author_name?.[0] || 'C')
      : message.author?.display_name?.[0] || 'U';

  return (
    <div className={cn(
      'flex gap-3 p-4 group',
      isCurrentUser ? 'flex-row-reverse' : 'flex-row'
    )}>
      <Avatar className="h-8 w-8">
        <AvatarFallback>
          {avatarInitial}
        </AvatarFallback>
      </Avatar>
      
      <div className={cn(
        'flex flex-col max-w-[80%] relative',
        isCurrentUser ? 'items-end' : 'items-start'
      )}>
        <div className="mb-1">
          <span className="text-sm font-medium">
            {displayName}
          </span>
          {message.author_role === 'customer' && message.author_email && (
            <span className="ml-2 text-xs text-muted-foreground">
              ({message.author_email})
            </span>
          )}
          {message.author?.role && message.author_role !== 'customer' && (
            <span className="ml-2 text-xs text-muted-foreground">
              ({message.author.role})
            </span>
          )}
        </div>

        <div className={cn(
          'rounded-lg p-3 group-hover:pr-8',
          isCurrentUser ? 'bg-primary text-primary-foreground' : 'bg-muted',
          message.message_type === 'internal' && 'border-2 border-yellow-500'
        )}>
          <p className="text-sm whitespace-pre-wrap">{message.body}</p>
          <HoverCard>
            <HoverCardTrigger asChild>
              <button className={cn(
                "absolute top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity",
                isCurrentUser ? "left-2" : "right-2"
              )}>
                <InfoIcon className="h-4 w-4 text-muted-foreground hover:text-foreground" />
              </button>
            </HoverCardTrigger>
            <HoverCardContent 
              className="w-80" 
              align={isCurrentUser ? "start" : "end"}
              side="top"
            >
              <div className="space-y-2">
                <h4 className="text-sm font-semibold">Message Details</h4>
                <div className="text-xs space-y-1.5">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Created:</span>
                    <span>{format(new Date(message.created_at), 'PPpp')}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Source:</span>
                    <span className="capitalize">{message.source}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Type:</span>
                    <span className="capitalize">{message.message_type}</span>
                  </div>
                  {message.is_email && (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Email:</span>
                      <span>Yes</span>
                    </div>
                  )}
                  {message.external_id && (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">External ID:</span>
                      <span className="font-mono text-[10px]">{message.external_id}</span>
                    </div>
                  )}
                </div>
              </div>
            </HoverCardContent>
          </HoverCard>
        </div>
        
        <div className={cn(
          'flex gap-2 mt-1 text-xs text-muted-foreground',
          isCurrentUser ? 'flex-row-reverse' : 'flex-row'
        )}>
          <time>
            {formatDistanceToNow(new Date(message.created_at), { addSuffix: true })}
          </time>
          {message.message_type === 'internal' && (
            <span className="text-yellow-500">(Internal Note)</span>
          )}
          {message.is_email && (
            <span className="text-blue-500">(Email)</span>
          )}
          {message.source !== 'web' && (
            <span className="text-blue-500">({message.source})</span>
          )}
        </div>
      </div>
    </div>
  );
}

export function TicketMessages({ 
  messages, 
  currentUserId, 
  onSendMessage,
  className,
  disabled = false
}: TicketMessagesProps) {
  console.log('TicketMessages received props:', { messages, currentUserId });
  
  return (
    <Card className={cn('flex flex-col h-[600px]', className)}>
      <ScrollArea className="flex-1">
        <div className="flex flex-col-reverse">
          {messages.map((message) => (
            <div key={message.id}>
              <MessageItem 
                message={message}
                isCurrentUser={message.author_id === currentUserId}
              />
              <Separator />
            </div>
          ))}
        </div>
      </ScrollArea>
      
      <div className="p-4 border-t">
        <MessageComposer
          ticketId={messages[0]?.ticket_id}
          onSendMessage={onSendMessage}
          disabled={disabled}
        />
      </div>
    </Card>
  );
} 