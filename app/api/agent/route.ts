import { processTicket } from '../../../agents/server';

export async function POST(req: Request) {
  console.log('Agent API route called');
  try {
    const body = await req.json();
    console.log('Request body:', body);
    
    const { ticketId } = body;
    
    if (!ticketId) {
      console.log('No ticket ID provided');
      return new Response(JSON.stringify({ error: 'Ticket ID is required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    console.log('Processing ticket:', ticketId);
    const result = await processTicket(ticketId);
    console.log('Processing result:', result);
    
    return new Response(JSON.stringify(result), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error in agent route:', error);
    return new Response(JSON.stringify({ 
      error: 'Internal server error',
      details: error instanceof Error ? error.message : String(error)
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
} 