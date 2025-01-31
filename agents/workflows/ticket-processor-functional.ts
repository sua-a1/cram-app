import { ChatOpenAI } from "@langchain/openai";
import { 
  BaseMessage, 
  AIMessage, 
  SystemMessage, 
  HumanMessage,
  ToolMessage,
  type BaseMessageLike 
} from "@langchain/core/messages";
import { type ToolCall } from "@langchain/core/messages/tool";
import { 
  task, 
  entrypoint, 
  addMessages,
  MemorySaver,
  getPreviousState 
} from "@langchain/langgraph";
import { z } from 'zod';
import { env } from '../config/env';
import { analyzeTicketTool } from '../tools/analyze-ticket';
import { documentRetrievalTool } from '../tools/document-retrieval-tool';
import { tool } from "@langchain/core/tools";
import { storeTicketMessage } from '../utils/ticket-messages';

// Define input schema
const InputSchema = z.object({
  ticket: z.string().min(1, 'Ticket content is required'),
  ticketId: z.string().uuid('Valid ticket ID is required'),
  userId: z.string().uuid('Valid user ID is required'),
  messages: z.array(z.object({
    type: z.enum(['system', 'human', 'ai']),
    content: z.string(),
    metadata: z.record(z.any()).optional()
  })).optional()
});

type InputType = z.infer<typeof InputSchema>;

// Define tools
export const closeTicketTool = tool(async ({ ticketId, reason }: { ticketId: string, reason: string }, config) => {
  try {
    // Return a properly formatted response for LangGraph
    return {
      content: JSON.stringify({
        status: 'closed',
        message: `Ticket closed. Reason: ${reason}`
      }),
      metadata: {
        status: 'closed',
        ticketId,
        reason,
        timestamp: new Date().toISOString(),
        tool_name: 'close_ticket'
      }
    };
  } catch (error) {
    console.error('Error closing ticket:', error);
    throw new Error('Failed to close ticket. Please try again or escalate to human agent.');
  }
}, {
  name: 'close_ticket',
  description: 'Close the ticket when the issue is resolved and the user agrees to close it.',
  schema: z.object({
    ticketId: z.string().uuid('Valid ticket ID is required'),
    reason: z.string().min(1, 'Closing reason is required')
  })
});

export const processRefundTool = tool(async ({ 
  ticketId, 
  amount, 
  reason,
  orderReference
}: { 
  ticketId: string, 
  amount: number,
  reason: string,
  orderReference: string
}, config) => {
  try {
    return {
      content: `Refund of $${amount.toFixed(2)} processed successfully for order ${orderReference}`,
      metadata: {
        status: 'in-progress',
        ticketId,
        refundAmount: amount,
        orderReference,
        reason,
        refundTimestamp: new Date().toISOString()
      }
    };
  } catch (error) {
    console.error('Error processing refund:', error);
    throw new Error('Failed to process refund. Please escalate to a supervisor.');
  }
}, {
  name: 'process_refund',
  description: 'Process a refund for a customer if their request meets our refund policy criteria.',
  schema: z.object({
    ticketId: z.string().uuid('Valid ticket ID is required'),
    amount: z.number().positive('Refund amount must be positive'),
    reason: z.string().min(1, 'Refund reason is required'),
    orderReference: z.string().min(1, 'Order reference is required')
  })
});

// Create model and tools array
const tools = [analyzeTicketTool, documentRetrievalTool, closeTicketTool, processRefundTool];
const toolsByName = Object.fromEntries(tools.map((tool) => [tool.name, tool]));

const model = new ChatOpenAI({
  modelName: env.OPENAI_MODEL,
  temperature: env.OPENAI_TEMPERATURE,
  openAIApiKey: env.OPENAI_API_KEY,
}).bind({
  tools: tools,
  tool_choice: "auto"
});

// Define tasks
const callModel = task("callModel", async (messages: BaseMessageLike[]) => {
  console.log('Calling model with messages:', messages.map(m => ({
    type: m instanceof BaseMessage ? m.constructor.name : 'string',
    content: m instanceof BaseMessage ? m.content : m
  })));
  const response = await model.invoke(messages);
  console.log('Model response:', {
    content: response.content,
    tool_calls: response.tool_calls
  });
  return response;
});

const callTool = task(
  "callTool",
  async (toolCall: ToolCall): Promise<ToolMessage> => {
    console.log('Calling tool:', {
      name: toolCall.name,
      args: toolCall.args
    });

    const tool = toolsByName[toolCall.name];
    // Parse and validate the arguments based on the tool's schema
    const args = typeof toolCall.args === 'string' ? JSON.parse(toolCall.args) : toolCall.args;
    const observation = await tool.invoke(args);
    
    console.log('Tool response:', {
      name: toolCall.name,
      content: observation.content,
      metadata: observation.metadata
    });

    // Ensure tool_call_id is always a string
    const tool_call_id = toolCall.id || `call_${Date.now()}_${Math.random().toString(36).slice(2)}`;
    
    // Create the tool message with proper metadata
    const message = new ToolMessage({ 
      content: observation.content || observation,
      tool_call_id,
      name: toolCall.name,  // Add the tool name
      additional_kwargs: {
        name: toolCall.name,  // Also add it here for consistency
        metadata: {
          ...observation.metadata,
          tool_name: toolCall.name  // Add tool name to metadata
        }
      }
    });

    console.log('Created tool message:', {
      name: message.name,
      content: message.content,
      metadata: message.additional_kwargs?.metadata
    });

    return message;
  }
);

// Create memory saver for persistence
const checkpointer = new MemorySaver();

// Define the agent entrypoint
const agent = entrypoint({
  name: "ticketProcessor",
  checkpointer
}, async (input: InputType) => {
  // Validate input
  const validatedInput = InputSchema.parse(input);
  
  // Get previous state or initialize new conversation
  const previous = getPreviousState<BaseMessage[]>() ?? [];
  
  // Initialize messages
  let currentMessages = addMessages(previous, [
    new SystemMessage(
      "You are a helpful customer support agent for a fashion retailer. Process the ticket and provide a clear, professional response. " +
      "Consider:\n" +
      "1. The customer's issue or question\n" +
      "2. Any relevant context or history\n" +
      "3. Appropriate solutions or next steps\n\n" +
      "Important guidelines:\n" +
      "- You MUST use the analyze_ticket tool FIRST for EVERY new customer message\n" +
      "- For damaged items, high-value issues ($200+), or urgent requests, the analyze_ticket tool will determine if human intervention is needed\n" +
      "- When a customer indicates they want to close the ticket, you MUST use the close_ticket tool with a proper reason\n" +
      "- For refunds and returns, use the process_refund tool after verifying eligibility\n" +
      "- Always provide clear next steps and set proper expectations\n\n" +
      "Tool Usage:\n" +
      "1. analyze_ticket: Use this FIRST for every customer message\n" +
      "2. close_ticket: Use when customer confirms resolution\n" +
      "3. process_refund: Use for valid refund requests\n" +
      "4. document_retrieval: Use to get policy information"
    ),
    new HumanMessage(validatedInput.ticket)
  ]);

  // Add any additional messages from the input
  if (validatedInput.messages?.length) {
    currentMessages = addMessages(
      currentMessages,
      validatedInput.messages.map(msg => {
        if (msg.type === 'human') {
          return new HumanMessage(msg.content);
        } else if (msg.type === 'ai') {
          return new AIMessage(msg.content);
        }
        return new SystemMessage(msg.content);
      })
    );
  }

  // Start the conversation loop
  let llmResponse = await callModel(currentMessages);
  
  while (true) {
    // If no tool calls, we're done
    if (!llmResponse.tool_calls?.length) {
      break;
    }

    // Execute tools in parallel
    const toolResults = await Promise.all(
      llmResponse.tool_calls.map((toolCall) => callTool(toolCall))
    );

    // Append messages
    currentMessages = addMessages(currentMessages, [llmResponse, ...toolResults]);

    // Call model again
    llmResponse = await callModel(currentMessages);
  }

  // Store the final message
  await storeTicketMessage({
    ticketId: validatedInput.ticketId,
    message: llmResponse,
    metadata: { 
      ticketId: validatedInput.ticketId,
      final: true
    },
    userId: validatedInput.userId
  });

  // Append final response and save state
  currentMessages = addMessages(currentMessages, llmResponse);

  // Return final state
  return entrypoint.final({
    value: {
      messages: currentMessages,
      final_answer: llmResponse.content,
      status: getTicketStatus(currentMessages),
      requires_human: requiresHumanIntervention(currentMessages)
    },
    save: currentMessages
  });
});

// Helper functions
function getTicketStatus(messages: BaseMessage[]): 'open' | 'in-progress' | 'closed' {
  // Look for tool messages in reverse order to get the most recent status
  for (let i = messages.length - 1; i >= 0; i--) {
    const msg = messages[i];
    if (msg instanceof ToolMessage) {
      // Check if this is a close_ticket tool response
      if (msg.additional_kwargs?.name === 'close_ticket') {
        return 'closed';
      }

      // Try to get status from metadata
      const metadata = msg.additional_kwargs?.metadata as { status?: 'open' | 'in-progress' | 'closed' };
      if (metadata?.status) {
        return metadata.status;
      }
      
      // Try to parse status from content if it's a JSON string
      if (typeof msg.content === 'string') {
        try {
          const parsed = JSON.parse(msg.content) as { status?: 'open' | 'in-progress' | 'closed' };
          if (parsed.status) {
            return parsed.status;
          }
        } catch (e) {
          // If it's not JSON but contains "closed", consider it closed
          if (msg.content.toLowerCase().includes('ticket closed')) {
            return 'closed';
          }
        }
      }
    }
  }
  
  return 'open';
}

function requiresHumanIntervention(messages: BaseMessage[]): boolean {
  // Look for analyze_ticket tool messages in reverse order
  for (let i = messages.length - 1; i >= 0; i--) {
    const msg = messages[i];
    if (msg instanceof ToolMessage && msg.additional_kwargs?.name === 'analyze_ticket') {
      // Try to get requires_human from metadata
      const metadata = msg.additional_kwargs?.metadata as { requires_human?: boolean };
      if (metadata?.requires_human !== undefined) {
        return Boolean(metadata.requires_human);
      }
      
      // Try to parse requires_human from content if it's a JSON string
      if (typeof msg.content === 'string') {
        try {
          const parsed = JSON.parse(msg.content) as { requires_human?: boolean };
          if (parsed.requires_human !== undefined) {
            return Boolean(parsed.requires_human);
          }
        } catch (e) {
          // If it's not JSON but contains keywords indicating human intervention
          const content = msg.content.toLowerCase();
          return content.includes('requires human') || 
                 content.includes('human intervention') || 
                 content.includes('escalate');
        }
      }
    }
  }
  
  return false;
}

export { agent as ticketProcessorAgent }; 
