import { format } from 'date-fns'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { cn } from '@/lib/utils'
import type { TicketMessage } from '@/types/tickets'

interface MessageListProps {
  messages: TicketMessage[]
  currentUserId: string
}

export function MessageList({ messages, currentUserId }: MessageListProps) {
  return (
    <div className="space-y-4">
      {messages.map((message) => (
        <div
          key={message.id}
          className={cn(
            'flex gap-3',
            message.author_id === currentUserId ? 'flex-row-reverse' : 'flex-row'
          )}
        >
          <Avatar className="h-8 w-8">
            <AvatarFallback>
              {message.author_role?.[0]?.toUpperCase() || '?'}
            </AvatarFallback>
          </Avatar>
          <div className={cn(
            'flex flex-col gap-1',
            message.author_id === currentUserId ? 'items-end' : 'items-start'
          )}>
            <div className="mb-1 flex flex-col">
              <span className="text-sm font-medium">
                {message.author_id === currentUserId ? 'You' : message.author_name || 'Unknown User'}
              </span>
              {message.author_email && (
                <span className="text-xs text-muted-foreground">
                  {message.author_email}
                </span>
              )}
            </div>
            <div className={cn(
              'rounded-lg px-3 py-2 text-sm',
              message.author_id === currentUserId
                ? 'bg-slate-200 dark:bg-slate-700 text-slate-900 dark:text-slate-100'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-slate-100'
            )}>
              <div 
                className="prose prose-sm max-w-none [&>:first-child]:mt-0 [&>:last-child]:mb-0 prose-p:text-inherit prose-headings:text-inherit"
                dangerouslySetInnerHTML={{ __html: message.body }} 
              />
            </div>
            <span className="text-xs text-muted-foreground">
              {format(new Date(message.created_at), 'MMM d, h:mm a')}
            </span>
          </div>
        </div>
      ))}
      {messages.length === 0 && (
        <p className="text-center text-sm text-muted-foreground">
          No messages yet
        </p>
      )}
    </div>
  )
} 