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

    // If the ticket is being closed, create a notification for feedback
    if (updates.status === 'closed') {
      // First get the ticket details to get the user_id
      const { data: ticket, error: ticketError } = await supabaseAdmin
        .from('tickets')
        .select('user_id')
        .eq('id', ticketId)
        .single();

      if (!ticketError && ticket) {
        // Create a notification for feedback
        const { error: notificationError } = await supabaseAdmin
          .from('notifications')
          .insert({
            user_id: ticket.user_id,
            ticket_id: ticketId,
            type: 'status_update',
            message: 'Your ticket has been closed. Please take a moment to provide feedback on your experience.',
            metadata: {
              action: 'request_feedback',
              status: 'closed'
            }
          });

        if (notificationError) {
          console.error('Error creating feedback notification:', notificationError);
        }
      }
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

export async function closeTicket(
  ticketId: string,
  userId: string
) {
  try {
    // Verify the user owns the ticket
    const { data: ticket, error: ticketError } = await supabaseAdmin
      .from('tickets')
      .select('status, user_id')
      .eq('id', ticketId)
      .single();

    if (ticketError || !ticket) {
      throw new Error('Ticket not found');
    }

    if (ticket.user_id !== userId) {
      throw new Error('Not authorized to close this ticket');
    }

    if (ticket.status === 'closed') {
      throw new Error('Ticket is already closed');
    }

    // Update the ticket status
    const { error: updateError } = await supabaseAdmin
      .from('tickets')
      .update({
        status: 'closed',
        updated_at: new Date().toISOString()
      })
      .eq('id', ticketId);

    if (updateError) {
      throw updateError;
    }

    return { success: true };
  } catch (error: any) {
    console.error('Error closing ticket:', error);
    return {
      success: false,
      error: error?.message || 'Failed to close ticket'
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

export type SubmitFeedbackInput = {
  ticketId: string;
  userId: string;
  rating: number;
  feedback?: string;
};

export async function submitFeedback({
  ticketId,
  userId,
  rating,
  feedback
}: SubmitFeedbackInput) {
  try {
    // Verify the ticket exists, is closed, and belongs to the user
    const { data: ticket, error: ticketError } = await supabaseAdmin
      .from('tickets')
      .select('status, user_id')
      .eq('id', ticketId)
      .single();

    if (ticketError || !ticket) {
      throw new Error('Ticket not found');
    }

    if (ticket.user_id !== userId) {
      throw new Error('Not authorized to submit feedback for this ticket');
    }

    if (ticket.status !== 'closed') {
      throw new Error('Can only submit feedback for closed tickets');
    }

    // Check if feedback already exists
    const { data: existingFeedback, error: feedbackError } = await supabaseAdmin
      .from('ticket_feedback')
      .select()
      .eq('ticket_id', ticketId)
      .single();

    if (feedbackError && feedbackError.code !== 'PGRST116') { // PGRST116 means no rows returned
      throw feedbackError;
    }

    if (existingFeedback) {
      // Update existing feedback
      const { error: updateError } = await supabaseAdmin
        .from('ticket_feedback')
        .update({
          rating,
          feedback,
          updated_at: new Date().toISOString()
        })
        .eq('ticket_id', ticketId);

      if (updateError) {
        throw updateError;
      }
    } else {
      // Insert new feedback
      const { error: insertError } = await supabaseAdmin
        .from('ticket_feedback')
        .insert({
          ticket_id: ticketId,
          user_id: userId,
          rating,
          feedback
        });

      if (insertError) {
        throw insertError;
      }
    }

    return { success: true };
  } catch (error: any) {
    console.error('Error submitting feedback:', error);
    return {
      success: false,
      error: error?.message || 'Failed to submit feedback'
    };
  }
} 