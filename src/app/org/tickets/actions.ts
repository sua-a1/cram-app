'use server';

import { createServerClient, type CookieOptions } from '@supabase/ssr';
import { createClient } from '@supabase/supabase-js';
import { cookies } from 'next/headers';
import { BulkOperationResponse, BulkTicketUpdate } from '@/types/tickets';
import { revalidatePath } from 'next/cache';
import type { Database } from '@/types/database.types';

export async function bulkUpdateTickets(
  data: BulkTicketUpdate
): Promise<BulkOperationResponse> {
  try {
    const cookieStore = cookies();

    const supabase = createServerClient<Database>(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          get(name: string) {
            return cookieStore.get(name)?.value;
          },
          set(name: string, value: string, options: CookieOptions) {
            try {
              cookieStore.set({ name, value, ...options });
            } catch (error) {
              // Handle cookie setting error
            }
          },
          remove(name: string, options: CookieOptions) {
            try {
              cookieStore.set({ name, value: '', ...options });
            } catch (error) {
              // Handle cookie removal error
            }
          },
        },
      }
    );

    // Get the current user
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();
    if (sessionError || !session?.user) {
      console.error('Session error:', sessionError);
      return {
        success: false,
        updatedCount: 0,
        errors: ['Not authenticated'],
      };
    }

    // Get the current user's profile to check permissions
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('role, org_id')
      .eq('user_id', session.user.id)
      .single();

    if (profileError || !profile || !profile.org_id || !['employee', 'admin'].includes(profile.role)) {
      console.log('Profile check failed:', { profileError, profile });
      return {
        success: false,
        updatedCount: 0,
        errors: ['Unauthorized: Only employees and admins can perform bulk updates'],
      };
    }

    // Create service role client for admin operations
    const serviceClient = createClient<Database>(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false,
        },
      }
    );

    // Verify all tickets belong to the user's organization
    const { data: tickets, error: ticketsError } = await serviceClient
      .from('tickets')
      .select('id, handling_org_id')
      .in('id', data.ticketIds)
      .eq('handling_org_id', profile.org_id);

    if (ticketsError || !tickets || tickets.length !== data.ticketIds.length) {
      console.log('Ticket verification failed:', { ticketsError, ticketsCount: tickets?.length });
      return {
        success: false,
        updatedCount: 0,
        errors: ['Some tickets do not exist or do not belong to your organization'],
      };
    }

    // Perform the bulk update using service role client
    const { error: updateError } = await serviceClient
      .from('tickets')
      .update({
        ...data.updates,
        updated_at: new Date().toISOString(),
      })
      .in('id', data.ticketIds)
      .eq('handling_org_id', profile.org_id);

    if (updateError) {
      console.error('Bulk update error:', updateError);
      return {
        success: false,
        updatedCount: 0,
        errors: [updateError.message],
      };
    }

    // Revalidate the tickets page
    revalidatePath('/org/tickets');
    revalidatePath('/org/dashboard');

    return {
      success: true,
      updatedCount: data.ticketIds.length,
    };
  } catch (error) {
    console.error('Bulk update error:', error);
    return {
      success: false,
      updatedCount: 0,
      errors: ['An unexpected error occurred'],
    };
  }
} 