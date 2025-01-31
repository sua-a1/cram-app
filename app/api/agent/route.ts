import { NextResponse } from 'next/server';

// Import stubs or actual implementations based on environment
const { ticketProcessor } = process.env.VERCEL
  ? require('../../lib/stubs/agent-stubs')
  : require('../../../agents/server');

export async function POST(request: Request) {
  try {
    const result = await ticketProcessor.invoke();
    return NextResponse.json(result);
  } catch (error) {
    console.error('Error in ticket processor:', error);
    return NextResponse.json(
      { error: 'Failed to process request' },
      { status: 500 }
    );
  }
} 