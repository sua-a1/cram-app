import { createServiceClient } from '@/lib/server/supabase';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import type { Database } from '@/types/database.types';

export type NotificationFilters = {
  read?: boolean;
  type?: Database['public']['Tables']['notifications']['Row']['type'];
  limit?: number;
  offset?: number;
};

export type Notification = Database['public']['Tables']['notifications']['Row'];

/**
 * Fetch notifications for the current user with filtering and pagination
 */
export async function getUserNotifications(filters?: NotificationFilters): Promise<Notification[]> {
    const supabase = await createServerSupabaseClient();
    const serviceClient = createServiceClient();

    // Get the current session
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();
    if (sessionError || !session?.user) {
        throw new Error('Not authenticated');
    }

    // Build the query
    let query = serviceClient
        .from('notifications')
        .select('id, user_id, ticket_id, type, message, read, message_id, created_at, metadata')
        .eq('user_id', session.user.id)
        .order('created_at', { ascending: false });

    // Apply filters if provided
    if (filters?.read !== undefined) {
        query = query.eq('read', filters.read);
    }
    if (filters?.type) {
        query = query.eq('type', filters.type);
    }
    if (filters?.limit) {
        query = query.limit(filters.limit);
    }
    if (filters?.offset) {
        query = query.range(filters.offset, filters.offset + (filters.limit || 10) - 1);
    }

    const { data, error } = await query;
    if (error) {
        throw new Error(`Failed to fetch notifications: ${error.message}`);
    }

    return data as unknown as Notification[];
}

/**
 * Get the count of unread notifications for a user
 */
export async function getUnreadCount(): Promise<number> {
    const supabase = await createServerSupabaseClient();
    const serviceClient = createServiceClient();

    // Get the current session
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();
    if (sessionError || !session?.user) {
        throw new Error('Not authenticated');
    }

    const { count, error } = await serviceClient
        .from('notifications')
        .select('id', { count: 'exact', head: true })
        .eq('user_id', session.user.id)
        .eq('read', false);

    if (error) {
        throw new Error(`Failed to get unread count: ${error.message}`);
    }

    return count || 0;
}

/**
 * Mark specific notifications as read
 */
export async function markNotificationsAsRead(notificationIds: string[]): Promise<void> {
    const supabase = await createServerSupabaseClient();
    const serviceClient = createServiceClient();

    // Get the current session
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();
    if (sessionError || !session?.user) {
        throw new Error('Not authenticated');
    }

    const { error } = await serviceClient
        .from('notifications')
        .update({ read: true } as Database['public']['Tables']['notifications']['Update'])
        .in('id', notificationIds)
        .eq('user_id', session.user.id);

    if (error) {
        throw new Error(`Failed to mark notifications as read: ${error.message}`);
    }
}

/**
 * Mark all notifications as read for a user
 */
export async function markAllNotificationsAsRead(): Promise<void> {
    const supabase = await createServerSupabaseClient();
    const serviceClient = createServiceClient();

    // Get the current session
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();
    if (sessionError || !session?.user) {
        throw new Error('Not authenticated');
    }

    const { error } = await serviceClient
        .from('notifications')
        .update({ read: true } as Database['public']['Tables']['notifications']['Update'])
        .eq('user_id', session.user.id)
        .eq('read', false);

    if (error) {
        throw new Error(`Failed to mark all notifications as read: ${error.message}`);
    }
}

/**
 * Delete old notifications for a user
 * This is typically called periodically or when needed to clean up old notifications
 */
export async function deleteOldNotifications(olderThan: Date): Promise<void> {
    const supabase = await createServerSupabaseClient();
    const serviceClient = createServiceClient();

    // Get the current session
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();
    if (sessionError || !session?.user) {
        throw new Error('Not authenticated');
    }

    const { error } = await serviceClient
        .from('notifications')
        .delete()
        .eq('user_id', session.user.id)
        .eq('read', true)
        .lt('created_at', olderThan.toISOString());

    if (error) {
        throw new Error(`Failed to delete old notifications: ${error.message}`);
    }
} 
