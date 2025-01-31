import { fetch } from 'cross-fetch';
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';
import { Database } from '../types/supabase';

// Add fetch to global scope
global.fetch = fetch;

dotenv.config({ path: path.resolve(process.cwd(), '.env.test') });

// Verify environment variables
if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
  throw new Error('Missing required environment variables. Check .env.test file.');
}

const ORG_ID = '123ea677-a7c1-44b3-984b-12b8528397e2';
const USER_ID = 'fcaa3560-88cc-422b-a5ea-1ed89c07a6b0';

const supabase = createClient<Database>(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  {
    auth: {
      persistSession: false,
      autoRefreshToken: false
    }
  }
);

async function delay(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function createTestTicket() {
  try {
    const { data: ticket, error } = await supabase
      .from('tickets')
      .insert({
        user_id: USER_ID,
        subject: 'Refund Request for Order #12345',
        description: 'I would like to request a refund for my recent order.',
        status: 'open',
        priority: 'medium',
        handling_org_id: ORG_ID
      })
      .select()
      .single();

    if (error) throw error;
    if (!ticket) throw new Error('No ticket data returned');
    
    console.log('Created ticket:', ticket);
    return ticket;
  } catch (error) {
    console.error('Error creating ticket:', error);
    throw error;
  }
}

async function getNewMessages(ticketId: string, afterTimestamp?: string) {
  const { data: messages, error } = await supabase
    .from('ticket_messages')
    .select('*')
    .eq('ticket_id', ticketId)
    .gt('created_at', afterTimestamp || '1970-01-01')
    .order('created_at', { ascending: true });

  if (error) throw error;
  
  // Filter out chunks and AI messages with empty tool calls
  return messages?.filter(msg => {
    const metadata = msg.metadata as { 
      is_chunk?: boolean;
      tool_calls?: any[];
      message_type?: string;
      original_type?: string;
    } | null;

    // Skip chunks
    if (metadata?.is_chunk) return false;

    // Skip AI messages with empty tool calls
    if (metadata?.original_type === 'ai' && (!metadata.tool_calls || metadata.tool_calls.length === 0)) {
      return false;
    }

    return true;
  }) || [];
}

async function waitForAgentResponse(ticketId: string, afterTimestamp: string, maxAttempts = 30) {
  console.log(`\nWaiting for messages after ${afterTimestamp}...`);
  
  for (let i = 0; i < maxAttempts; i++) {
    const messages = await getNewMessages(ticketId, afterTimestamp);
    if (messages && messages.length > 0) {
      console.log('\nNew messages found:');
      messages.forEach(msg => {
        console.log('-------------------');
        console.log(`Time: ${new Date(msg.created_at).toLocaleTimeString()}`);
        console.log(`Author Role: ${msg.author_role}`);
        console.log(`Message Type: ${msg.message_type}`);
        console.log(`Content: ${msg.body}`);
        if (msg.metadata && Object.keys(msg.metadata).length > 0) {
          console.log('Metadata:', JSON.stringify(msg.metadata, null, 2));
        }
        console.log('-------------------\n');
      });
      return messages;
    }
    process.stdout.write('.');
    await delay(2000); // Wait 2 seconds before checking again
  }
  console.log('\nNo new messages received after maximum attempts');
  return null;
}

async function processTicket(ticketId: string) {
  try {
    const timestamp = new Date().toISOString();
    console.log(`\nProcessing ticket at ${timestamp}`);
    
    // Get existing messages and filter out problematic ones
    const { data: messages, error: msgError } = await supabase
      .from('ticket_messages')
      .select('*')
      .eq('ticket_id', ticketId)
      .order('created_at', { ascending: true });

    if (msgError) throw msgError;

    // Filter out AI messages with empty tool calls
    const validMessages = messages?.filter(msg => {
      const metadata = msg.metadata as { 
        is_chunk?: boolean;
        tool_calls?: any[];
        message_type?: string;
        original_type?: string;
      } | null;

      // Keep non-AI messages
      if (!metadata?.original_type || metadata.original_type !== 'ai') {
        return true;
      }

      // For AI messages, only keep ones with non-empty tool calls
      return metadata.tool_calls && metadata.tool_calls.length > 0;
    }) || [];

    const response = await fetch(`http://localhost:3000/api/tickets/${ticketId}/process`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-development-test': 'true'
      },
      body: JSON.stringify({ 
        ticketId,
        messages: validMessages.map(msg => ({
          type: msg.author_role === 'customer' ? 'human' : 'ai',
          content: msg.body,
          metadata: msg.metadata || {}
        }))
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`HTTP error! status: ${response.status}, body: ${errorText}`);
    }

    const result = await response.json();
    console.log('Process response:', JSON.stringify(result, null, 2));
    
    // Wait for and display agent responses
    await waitForAgentResponse(ticketId, timestamp);
    
    return result;
  } catch (error) {
    console.error('Error processing ticket:', error);
    throw error;
  }
}

async function addCustomerReply(ticketId: string, message: string) {
  try {
    const { data: reply, error } = await supabase
      .from('ticket_messages')
      .insert({
        ticket_id: ticketId,
        author_id: USER_ID,
        author_role: 'customer',
        body: message,
        message_type: 'public',
        is_email: false,
        metadata: {},
        source: 'web'
      })
      .select()
      .single();

    if (error) throw error;
    if (!reply) throw new Error('No reply data returned');
    
    console.log('Added customer reply:', reply);
    return reply;
  } catch (error) {
    console.error('Error adding customer reply:', error);
    throw error;
  }
}

async function runConversation() {
  try {
    // Create a new ticket
    const ticket = await createTestTicket();
    console.log('Step 1: Created ticket');
    await delay(1000);

    // Process the ticket with the agent
    await processTicket(ticket.id);
    console.log('Step 2: Initial agent processing');
    await delay(2000);

    // Add customer confirmation
    await addCustomerReply(ticket.id, 'Yes, I would like a refund for the full amount of $50.');
    console.log('Step 3: Added customer confirmation');
    await delay(1000);

    // Process the ticket again with the agent
    await processTicket(ticket.id);
    console.log('Step 4: Final agent processing');
    
    console.log('Test conversation completed successfully');
  } catch (error) {
    console.error('Error in conversation flow:', error);
    process.exit(1);
  }
}

runConversation().catch(console.error); 
