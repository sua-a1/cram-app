'use server';

import { createClient } from '@supabase/supabase-js';
import { TicketWithDetails } from '@/types/tickets';
import { z } from 'zod';

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

const createTicketSchema = z.object({
  subject: z.string().min(1, 'Subject is required'),
  description: z.string().min(1, 'Description is required'),
});

export type CreateTicketInput = z.infer<typeof createTicketSchema>;

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

export async function createTicket(input: CreateTicketInput) {
  const result = createTicketSchema.safeParse(input);
  
  if (!result.success) {
    throw new Error(result.error.errors[0].message);
  }

  // TODO: Implement actual ticket creation with database
  // For now, just validate and return
  return { success: true };
} 