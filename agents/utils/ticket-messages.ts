import { BaseMessage, AIMessage, HumanMessage, SystemMessage } from "@langchain/core/messages";
import { ToolMessage } from "@langchain/core/messages";
import { createServiceClient } from '@/lib/server/supabase';

// AI agent profile ID (created in migration)
const AI_AGENT_ID = '00000000-0000-0000-0000-000000000000';

interface StoreMessageOptions {
  ticketId: string;
  message: BaseMessage;
  metadata?: Record<string, any>;
  userId?: string;
}

/**
 * Stores a message in the ticket_messages table
 */
export async function storeTicketMessage({ ticketId, message, metadata = {}, userId }: StoreMessageOptions) {
  const supabase = createServiceClient();

  // Debug log
  console.log('Message type:', message.constructor.name);
  console.log('Message content:', message.content);

  // Determine the author and message type based on message type
  let authorId: string;
  let messageType: 'public' | 'internal' = 'public';
  let authorRole: 'customer' | 'employee' | 'admin' = 'employee';

  if (message instanceof AIMessage) {
    authorId = AI_AGENT_ID;
    authorRole = 'employee';
  } else if (message instanceof SystemMessage || message instanceof ToolMessage) {
    authorId = AI_AGENT_ID;
    authorRole = 'employee';
    messageType = 'internal';
  } else if (message instanceof HumanMessage) {
    if (!userId) {
      throw new Error('userId is required for human messages');
    }
    authorId = userId;
    authorRole = 'customer';
  } else {
    console.error('Unsupported message type:', message);
    throw new Error('Unsupported message type');
  }

  // Extract content
  const body = typeof message.content === 'string' 
    ? message.content 
    : JSON.stringify(message.content);

  // Store the message
  const { error } = await supabase
    .from('ticket_messages')
    .insert({
      ticket_id: ticketId,
      author_id: authorId,
      author_role: authorRole,
      body,
      message_type: messageType,
      source: 'web',
      metadata: {
        ...metadata,
        is_ai_generated: message instanceof AIMessage,
        tool_calls: message.additional_kwargs?.tool_calls || [],
        ...message.additional_kwargs
      }
    });

  if (error) {
    console.error('Error storing ticket message:', error);
    throw error;
  }
}

/**
 * Stores multiple messages in the ticket_messages table
 */
export async function storeTicketMessages(
  ticketId: string, 
  messages: BaseMessage[], 
  metadata: Record<string, any> = {},
  userId?: string
) {
  await Promise.all(
    messages.map(message => storeTicketMessage({ ticketId, message, metadata, userId }))
  );
}

/**
 * Retrieves ticket messages from the database
 */
export async function getTicketMessages(ticketId: string): Promise<BaseMessage[]> {
  const supabase = createServiceClient();
  
  const { data: messages, error } = await supabase
    .from('ticket_messages')
    .select('*')
    .eq('ticket_id', ticketId)
    .order('created_at', { ascending: true });

  if (error) {
    console.error('Error fetching ticket messages:', error);
    return [];
  }

  return messages.map(msg => {
    const content = msg.body;
    const additionalKwargs = msg.metadata || {};

    if (msg.author_id === AI_AGENT_ID) {
      return msg.message_type === 'internal'
        ? new SystemMessage(content, additionalKwargs)
        : new AIMessage(content, additionalKwargs);
    } else {
      return new HumanMessage(content, additionalKwargs);
    }
  });
} 
