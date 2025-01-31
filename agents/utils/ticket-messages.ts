import { BaseMessage, AIMessage, HumanMessage, SystemMessage } from "@langchain/core/messages";
import { ToolMessage } from "@langchain/core/messages";
import { AIMessageChunk } from "@langchain/core/messages";
import { createServiceClient } from '../lib/server/supabase';

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

  // Enhanced debug logging
  console.log('Message details:', {
    type: message.constructor.name,
    content: message.content,
    additional_kwargs: message.additional_kwargs,
    _type: message._getType?.() || 'unknown' // Get internal type if available
  });

  // Determine the author and message type based on message type
  let authorId: string;
  let messageType: 'public' | 'internal' = 'public';
  let authorRole: 'customer' | 'employee' | 'admin' = 'employee';

  // Handle all possible message types
  if (message instanceof AIMessage || message instanceof AIMessageChunk) {
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
    // For unknown message types, treat them as system messages
    console.warn('Unknown message type, treating as system message:', {
      type: message.constructor.name,
      _type: message._getType?.() || 'unknown'
    });
    authorId = AI_AGENT_ID;
    authorRole = 'employee';
    messageType = 'internal';
  }

  // Extract content, handling both string and structured content
  let body: string;
  try {
    body = typeof message.content === 'string' 
      ? message.content 
      : JSON.stringify(message.content);
  } catch (error) {
    console.error('Error stringifying message content:', error);
    body = 'Error: Could not process message content';
  }

  // Store the message with enhanced metadata
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
        message_type: message.constructor.name,
        is_ai_generated: message instanceof AIMessage || message instanceof AIMessageChunk,
        is_chunk: message instanceof AIMessageChunk,
        tool_calls: message.additional_kwargs?.tool_calls || [],
        original_type: message._getType?.() || message.constructor.name,
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
      if (msg.metadata?.is_chunk) {
        return new AIMessageChunk({ content, additional_kwargs: additionalKwargs });
      }
      return msg.message_type === 'internal'
        ? new SystemMessage(content, additionalKwargs)
        : new AIMessage(content, additionalKwargs);
    } else {
      return new HumanMessage(content, additionalKwargs);
    }
  });
} 
