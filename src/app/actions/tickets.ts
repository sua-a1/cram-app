'use server';

import { createClient } from '@supabase/supabase-js';
import { TicketWithDetails } from '@/types/tickets';

// Create a Supabase admin client with the service role key
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  }
);

export async function updateTicket(
  ticketId: string,
  updates: Partial<TicketWithDetails>
) {
  try {
    // Only send the basic fields that can be updated
    const updatePayload = {
      ...(updates.subject && { subject: updates.subject }),
      ...(updates.description && { description: updates.description }),
      ...(updates.status && { status: updates.status }),
      ...(updates.priority && { priority: updates.priority }),
      updated_at: new Date().toISOString()
    };

    const { error: updateError } = await supabaseAdmin
      .from('tickets')
      .update(updatePayload)
      .eq('id', ticketId);

    if (updateError) {
      throw updateError;
    }

    return { success: true };
  } catch (error: any) {
    console.error('Error updating ticket:', error);
    return { 
      success: false, 
      error: error?.message || 'Failed to update ticket'
    };
  }
} 