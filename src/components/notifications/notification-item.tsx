'use client';

import { formatDistanceToNow } from 'date-fns';
import { MessageSquare, AlertCircle } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { cn } from '@/lib/utils';
import type { Database } from '@/types/database.types';
import { markNotificationsAsRead } from '@/lib/client/notifications';

type Notification = Database['public']['Tables']['notifications']['Row'];

interface NotificationItemProps {
  notification: Notification;
  className?: string;
  onRead?: () => void;
}

export function NotificationItem({ notification, className, onRead }: NotificationItemProps) {
  const router = useRouter();
  const isRead = notification.read;
  const isNewMessage = notification.type === 'new_message';
  const metadata = notification.metadata as {
    old_status?: string;
    new_status?: string;
    updated_by?: string;
    author_id?: string;
    author_role?: string;
    message_preview?: string;
  };

  const handleClick = async () => {
    try {
      // Mark as read if not already read
      if (!isRead) {
        await markNotificationsAsRead([notification.id]);
        onRead?.();
      }

      // For both message and status updates, just navigate to the ticket page
      router.push(`/tickets/${notification.ticket_id}`);
    } catch (error) {
      console.error('Error handling notification click:', error);
    }
  };

  return (
    <div
      onClick={handleClick}
      className={cn(
        'flex items-start gap-3 py-2 px-1 cursor-pointer hover:bg-muted/70 transition-colors',
        !isRead && 'bg-muted/50',
        className
      )}
    >
      <div className="flex-shrink-0">
        {isNewMessage ? (
          <MessageSquare className="h-5 w-5 text-blue-500" />
        ) : (
          <AlertCircle className="h-5 w-5 text-yellow-500" />
        )}
      </div>
      <div className="flex-1 space-y-1">
        <p className={cn('text-sm', !isRead && 'font-medium')}>
          {notification.message}
          {isNewMessage && metadata.message_preview && (
            <span className="block text-xs text-muted-foreground mt-1">
              {metadata.message_preview}
            </span>
          )}
          {!isNewMessage && metadata.old_status && metadata.new_status && (
            <span className="block text-xs text-muted-foreground mt-1">
              From {metadata.old_status} to {metadata.new_status}
            </span>
          )}
        </p>
        <p className="text-xs text-muted-foreground">
          {formatDistanceToNow(new Date(notification.created_at), { addSuffix: true })}
        </p>
      </div>
      {!isRead && (
        <div className="flex-shrink-0">
          <div className="h-2 w-2 rounded-full bg-blue-500" />
        </div>
      )}
    </div>
  );
} 
