import { NextResponse } from 'next/server';
import { run } from '../../../../agents/workflows/hello-world';
import { env } from '../../../../agents/config/env';
import { langsmith } from '../../../../agents/utils/langsmith';

export async function POST(request: Request) {
  const requestId = crypto.randomUUID();
  console.log(`[${requestId}] Hello World Agent API route called`);
  
  try {
    const body = await request.json();
    console.log(`[${requestId}] Request body:`, body);

    if (!body.message) {
      console.warn(`[${requestId}] Missing message in request body`);
      return NextResponse.json(
        { error: 'Message is required' },
        { status: 400 }
      );
    }

    // Log LangSmith status
    if (langsmith && env.LANGSMITH_TRACING) {
      console.log(`[${requestId}] LangSmith tracing enabled for project: ${env.LANGSMITH_PROJECT}`);
    } else {
      console.log(`[${requestId}] LangSmith tracing disabled`);
    }

    const result = await run({ message: body.message });
    console.log(`[${requestId}] Processing result:`, result);

    if (result.status === 'error') {
      console.error(`[${requestId}] Workflow error:`, result.error);
      return NextResponse.json(result, { status: 500 });
    }

    return NextResponse.json(result);
  } catch (error) {
    console.error(`[${requestId}] Error processing request:`, error);
    return NextResponse.json(
      { 
        error: error instanceof Error ? error.message : 'Internal server error',
        requestId 
      },
      { status: 500 }
    );
  }
} 