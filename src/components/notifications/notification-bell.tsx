'use client';

import * as React from 'react';
import { Bell, Loader2 } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/hooks/use-toast';
import { NotificationItem } from './notification-item';
import type { Database } from '@/types/database.types';
import { useAuth } from '@/providers/supabase-auth-provider';

type Notification = Database['public']['Tables']['notifications']['Row'];

export function NotificationBell() {
  const router = useRouter();
  const { toast } = useToast();
  const { supabase } = useAuth();
  const [notifications, setNotifications] = React.useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = React.useState(0);
  const [loading, setLoading] = React.useState(true);
  const [loadingMore, setLoadingMore] = React.useState(false);
  const [hasMore, setHasMore] = React.useState(true);
  const [page, setPage] = React.useState(1);
  const [open, setOpen] = React.useState(false);

  const ITEMS_PER_PAGE = 10;

  // Fetch notifications with pagination
  const fetchNotifications = React.useCallback(async (pageNumber: number, append = false) => {
    try {
      const isFirstPage = pageNumber === 1;
      if (isFirstPage) setLoading(true);
      else setLoadingMore(true);

      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user) return;

      const from = (pageNumber - 1) * ITEMS_PER_PAGE;
      const to = from + ITEMS_PER_PAGE - 1;

      const { data, error } = await supabase
        .from('notifications')
        .select('*')
        .order('created_at', { ascending: false })
        .range(from, to);

      if (error) throw error;

      // Update notifications state
      setNotifications(prev => append ? [...prev, ...(data || [])] : (data || []));
      setHasMore(data?.length === ITEMS_PER_PAGE);

      // Only fetch unread count on initial load
      if (isFirstPage) {
        const { count, error: countError } = await supabase
          .from('notifications')
          .select('id', { count: 'exact', head: true })
          .eq('read', false);

        if (countError) throw countError;
        setUnreadCount(count || 0);
      }
    } catch (error: any) {
      console.error('Error fetching notifications:', error);
      toast({
        title: 'Error',
        description: 'Failed to load notifications',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  }, [supabase, toast]);

  // Handle scroll for infinite loading
  const handleScroll = React.useCallback((event: React.UIEvent<HTMLDivElement>) => {
    const target = event.target as HTMLDivElement;
    const reachedBottom = Math.abs(target.scrollHeight - target.scrollTop - target.clientHeight) < 1;
    
    if (reachedBottom && hasMore && !loadingMore) {
      setPage(prev => prev + 1);
    }
  }, [hasMore, loadingMore]);

  // Load more when page changes
  React.useEffect(() => {
    if (page > 1) {
      fetchNotifications(page, true);
    }
  }, [page, fetchNotifications]);

  // Initial load and subscription setup
  React.useEffect(() => {
    let mounted = true;

    const setupSubscription = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user) return;

      const channel = supabase
        .channel('notifications')
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'notifications',
            filter: `user_id=eq.${session.user.id}`,
          },
          async (payload) => {
            if (!mounted) return;

            if (payload.eventType === 'INSERT') {
              const newNotification = payload.new as Notification;
              toast({
                title: 'New Notification',
                description: newNotification.message,
              });

              // Play notification sound (optional)
              const audio = new Audio('/sounds/notification.mp3');
              audio.volume = 0.5;
              try {
                await audio.play();
              } catch (error) {
                console.log('Audio play failed:', error);
              }

              // Add to beginning of list and maintain limit
              setNotifications(prev => [newNotification, ...prev]);
              setUnreadCount(prev => prev + 1);
            } 
            else if (payload.eventType === 'UPDATE') {
              const updatedNotification = payload.new as Notification;
              setNotifications(prev => 
                prev.map(n => n.id === updatedNotification.id ? updatedNotification : n)
              );
              
              if (payload.old.read !== updatedNotification.read) {
                setUnreadCount(prev => 
                  updatedNotification.read ? Math.max(0, prev - 1) : prev + 1
                );
              }
            }
            else if (payload.eventType === 'DELETE') {
              setNotifications(prev => 
                prev.filter(n => n.id !== payload.old.id)
              );
              
              if (!payload.old.read) {
                setUnreadCount(prev => Math.max(0, prev - 1));
              }
            }
          }
        )
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
    };

    // Initial fetch
    fetchNotifications(1);
    const cleanup = setupSubscription();

    return () => {
      mounted = false;
      cleanup.then(fn => fn?.());
    };
  }, [supabase, toast, fetchNotifications]);

  // Mark all as read
  const markAllAsRead = async () => {
    try {
      const { error } = await supabase
        .from('notifications')
        .update({ read: true })
        .eq('read', false);

      if (error) throw error;

      setNotifications(prev => prev.map(n => ({ ...n, read: true })));
      setUnreadCount(0);
      toast({
        title: 'Success',
        description: 'All notifications marked as read',
      });
    } catch (error: any) {
      console.error('Error marking notifications as read:', error);
      toast({
        title: 'Error',
        description: 'Failed to mark notifications as read',
        variant: 'destructive',
      });
    }
  };

  // Handle notification click
  const handleNotificationClick = async (notification: Notification) => {
    try {
      // Mark as read if unread
      if (!notification.read) {
        const { error } = await supabase
          .from('notifications')
          .update({ read: true })
          .eq('id', notification.id);

        if (error) throw error;

        setNotifications(prev =>
          prev.map(n =>
            n.id === notification.id ? { ...n, read: true } : n
          )
        );
        setUnreadCount(prev => Math.max(0, prev - 1));
      }

      // Navigate based on notification type
      if (notification.type === 'new_message' && notification.message_id) {
        router.push(`/org/tickets/${notification.ticket_id}?message=${notification.message_id}`);
      } else {
        router.push(`/org/tickets/${notification.ticket_id}`);
      }

      setOpen(false);
    } catch (error: any) {
      console.error('Error handling notification click:', error);
      toast({
        title: 'Error',
        description: 'Failed to process notification',
        variant: 'destructive',
      });
    }
  };

  return (
    <DropdownMenu open={open} onOpenChange={setOpen}>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <Badge
              variant="destructive"
              className="absolute -top-1 -right-1 h-5 w-5 rounded-full p-0 text-xs flex items-center justify-center"
            >
              {unreadCount}
            </Badge>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-80">
        <DropdownMenuLabel className="flex items-center justify-between">
          <span>Notifications</span>
          {unreadCount > 0 && (
            <Button
              variant="ghost"
              size="sm"
              className="h-auto p-0 text-sm font-normal"
              onClick={markAllAsRead}
            >
              Mark all as read
            </Button>
          )}
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <ScrollArea className="h-[300px]" onScroll={handleScroll}>
          {loading ? (
            <div className="space-y-2 p-2">
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="flex items-center space-x-4">
                  <Skeleton className="h-12 w-12 rounded-full" />
                  <div className="space-y-2">
                    <Skeleton className="h-4 w-[200px]" />
                    <Skeleton className="h-4 w-[160px]" />
                  </div>
                </div>
              ))}
            </div>
          ) : notifications.length > 0 ? (
            <DropdownMenuGroup className="p-2">
              {notifications.map((notification) => (
                <DropdownMenuItem
                  key={notification.id}
                  className="cursor-pointer"
                  onClick={() => handleNotificationClick(notification)}
                >
                  <NotificationItem notification={notification} />
                </DropdownMenuItem>
              ))}
              {loadingMore && (
                <div className="py-2 text-center">
                  <Loader2 className="h-4 w-4 animate-spin mx-auto" />
                </div>
              )}
            </DropdownMenuGroup>
          ) : (
            <div className="p-4 text-center text-sm text-muted-foreground">
              No notifications
            </div>
          )}
        </ScrollArea>
      </DropdownMenuContent>
    </DropdownMenu>
  );
} 

