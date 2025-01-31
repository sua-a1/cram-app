import { AgentAPI, AgentError } from '@/lib/agent-api';
import { env } from '@/env.mjs';
import { createServiceClient } from '@/lib/server/supabase';
import { getSession } from '@/lib/server/auth-logic';

// Initialize agent API with validated environment variables
const agentApi = new AgentAPI({
  apiKey: env.LANGSMITH_API_KEY,
  projectId: env.LANGGRAPH_PROJECT,
  endpoint: env.LANGGRAPH_ENDPOINT,
  environment: env.LANGGRAPH_ENVIRONMENT,
});

export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    // Check for development testing header
    const isDevelopmentTest = request.headers.get('x-development-test') === 'true' && 
      process.env.NODE_ENV === 'development';

    // Get current session if not in development test mode
    let userId: string;
    if (!isDevelopmentTest) {
      const session = await getSession();
      if (!session) {
        return Response.json(
          { error: 'Unauthorized' },
          { status: 401 }
        );
      }
      userId = session.user.id;
    } else {
      // Use a test user ID for development
      userId = '00000000-0000-0000-0000-000000000000';
    }

    // Extract ticket ID from params
    const ticketId = params.id;
    
    if (!ticketId) {
      return Response.json(
        { error: 'Ticket ID is required' },
        { status: 400 }
      );
    }

    // Get ticket details
    const supabase = createServiceClient();
    const { data: ticket, error: ticketError } = await supabase
      .from('tickets')
      .select(`
        id,
        subject,
        description,
        user_id,
        handling_org_id
      `)
      .eq('id', ticketId)
      .single();

    if (ticketError || !ticket) {
      console.error('Error fetching ticket:', ticketError);
      return Response.json(
        { error: 'Failed to fetch ticket details' },
        { status: 500 }
      );
    }

    // Get previous messages
    const { data: messages, error: messagesError } = await supabase
      .from('ticket_messages')
      .select('*')
      .eq('ticket_id', ticketId)
      .order('created_at', { ascending: true });

    if (messagesError) {
      console.error('Error fetching messages:', messagesError);
      return Response.json(
        { error: 'Failed to fetch ticket messages' },
        { status: 500 }
      );
    }

    // Process the ticket with full context
    const result = await agentApi.processTicket({
      ticketId,
      userId,
      ticket: ticket.description || ticket.subject,
      previousMessages: messages || []
    });
    
    return Response.json(result);
  } catch (err: unknown) {
    console.error('Error processing ticket:', err);

    if (err instanceof AgentError) {
      return Response.json(
        { error: err.message, code: err.code },
        { status: err.status || 500 }
      );
    }

    return Response.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}