import { NextResponse } from 'next/server';
import { ticketProcessor } from '../../lib/stubs/agent-stubs';

export async function POST(request: Request) {
  const requestId = crypto.randomUUID();
  console.log(`[${requestId}] Ticket Processor API route called`);

  try {
    const result = await ticketProcessor.invoke();
    console.log(`[${requestId}] Processing result:`, result);
    return NextResponse.json(result);
  } catch (error) {
    console.error(`[${requestId}] Error in ticket processor:`, error);
    return NextResponse.json(
      { 
        error: error instanceof Error ? error.message : 'Internal server error',
        requestId 
      },
      { status: 500 }
    );
  }
} 