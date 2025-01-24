import { supabaseClient } from '@/lib/supabase-client';
import type { Database } from '@/types/database.types';

export type NotificationFilters = {
  read?: boolean;
  type?: Database['public']['Tables']['notifications']['Row']['type'];
  limit?: number;
  offset?: number;
};

export type Notification = Database['public']['Tables']['notifications']['Row'];

/**
 * Mark specific notifications as read
 */
export async function markNotificationsAsRead(notificationIds: string[]): Promise<void> {
  const { error } = await supabaseClient
    .from('notifications')
    .update({ read: true })
    .in('id', notificationIds);

  if (error) {
    throw new Error(`Failed to mark notifications as read: ${error.message}`);
  }
}

/**
 * Mark all notifications as read for the current user
 */
export async function markAllNotificationsAsRead(): Promise<void> {
  const { error } = await supabaseClient
    .from('notifications')
    .update({ read: true })
    .eq('read', false);

  if (error) {
    throw new Error(`Failed to mark all notifications as read: ${error.message}`);
  }
} 