import { ChatOpenAI } from  "@langchain/openai";
import { HumanMessage, AIMessage, BaseMessage, SystemMessage, AIMessageChunk } from "@langchain/core/messages";
import { StateGraph, Annotation, Command } from "@langchain/langgraph";
import { DynamicTool } from "@langchain/core/tools";
import { ToolNode } from "@langchain/langgraph/prebuilt";
import { z } from 'zod';
import { env } from '../config/env';
import { traceWorkflow } from '../utils/langsmith';
import { analyzeTicketTool } from '../tools/analyze-ticket';
import { documentRetrievalTool } from '../tools/document-retrieval-tool';
import { storeTicketMessages, getTicketMessages, storeTicketMessage } from '../utils/ticket-messages';
import { tool } from "@langchain/core/tools";

// Define input/output schemas
const InputSchema = z.object({
  ticket: z.string().min(1, 'Ticket content is required'),
  ticketId: z.string().uuid('Valid ticket ID is required'),
  userId: z.string().uuid('Valid user ID is required'),
  previousMessages: z.array(z.any()).optional(),
  messages: z.array(z.object({
    type: z.enum(['system', 'human', 'ai']),
    content: z.string(),
    metadata: z.record(z.any()).optional()
  })).optional()
});

const OutputSchema = z.object({
  messages: z.array(z.any()),
  final_answer: z.string(),
  status: z.enum(['open', 'in-progress', 'closed']),
  requires_human: z.boolean(),
});

type InputType = z.infer<typeof InputSchema>;
type OutputType = z.infer<typeof OutputSchema>;

// Define message type
type MessageLike = {
  type?: string;
  content: string | Record<string, unknown>;
  metadata?: Record<string, unknown>;
  _getType?: () => string;
};

// Define the graph state
const StateAnnotation = Annotation.Root({
  messages: Annotation<BaseMessage[]>({
    reducer: (x, y) => x.concat(y),
  }),
  ticketId: Annotation<string>(),
  userId: Annotation<string>(),
  requires_human: Annotation<boolean>({
    value: (x, y) => y,
    default: () => false
  }),
  status: Annotation<'open' | 'in-progress' | 'closed'>({
    value: (x, y) => y,
    default: () => 'open'
  }),
  context: Annotation<string>({
    value: (x, y) => y,
    default: () => ''
  }),
  conversationHistory: Annotation<BaseMessage[]>({
    reducer: (x, y) => x.concat(y),
    default: () => []
  })
});

// Define tools for ticket processing
export const closeTicketTool = tool(async ({ ticketId, reason }: { ticketId: string, reason: string }, config) => {
  try {
    // Return a properly formatted response for LangGraph Cloud
    return {
      tool_calls: [{
        id: `close_ticket_${Date.now()}`,
        type: 'function',
        function: {
          name: 'close_ticket',
          arguments: JSON.stringify({ ticketId, reason })
        }
      }],
      update: {
        status: 'closed',
        messages: [{
          type: 'system',
          content: `Ticket closed. Reason: ${reason}`,
          metadata: { ticketId }
        }]
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

// Define the process refund tool
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
    // Mock successful refund processing
    console.log(`[MOCK] Processing refund for ticket ${ticketId}:`, {
      amount,
      reason,
      orderReference,
      timestamp: new Date().toISOString()
    });

    // Return a properly formatted response for LangGraph Cloud
    return {
      tool_calls: [{
        id: `process_refund_${Date.now()}`,
        type: 'function',
        function: {
          name: 'process_refund',
          arguments: JSON.stringify({ ticketId, amount, reason, orderReference })
        }
      }],
      update: {
        status: 'in-progress',
        messages: [{
          type: 'system',
          content: `Refund of $${amount.toFixed(2)} processed successfully for order ${orderReference}. Reason: ${reason}`,
          metadata: { 
            ticketId,
            refundAmount: amount,
            orderReference,
            refundTimestamp: new Date().toISOString()
          }
        }]
      }
    };
  } catch (error) {
    console.error('Error processing refund:', error);
    throw new Error('Failed to process refund. Please escalate to a supervisor.');
  }
}, {
  name: 'process_refund',
  description: 'Process a refund for a customer if their request meets our refund policy criteria. Only use this if you are confident the refund request is valid according to our policies.',
  schema: z.object({
    ticketId: z.string().uuid('Valid ticket ID is required'),
    amount: z.number().positive('Refund amount must be positive'),
    reason: z.string().min(1, 'Refund reason is required'),
    orderReference: z.string().min(1, 'Order reference is required')
  })
});

const tools = [analyzeTicketTool, documentRetrievalTool, closeTicketTool, processRefundTool];
const toolNode = new ToolNode(tools);

// Create a model and give it access to the tools
const model = new ChatOpenAI({
  modelName: env.OPENAI_MODEL,
  temperature: env.OPENAI_TEMPERATURE,
  openAIApiKey: env.OPENAI_API_KEY,
}).bindTools(tools);

// Define the function that determines whether to continue or not
function shouldContinue(state: typeof StateAnnotation.State) {
  const lastMessage = state.messages[state.messages.length - 1] as AIMessage;
  // If the LLM makes a tool call, then we route to the "tools" node
  if (lastMessage.tool_calls?.length) {
    return "tools";
  }
  // Otherwise, we stop using the special "__end__" node
  return "__end__";
}

// Define the function that calls the model
async function callModel(state: typeof StateAnnotation.State) {
  try {
    // Debug logging
    console.log('State received:', {
      messages: state.messages?.length || 0,
      ticketId: state.ticketId,
      userId: state.userId,
      conversationHistory: state.conversationHistory?.length || 0
    });

    // Initialize messages array with system message if empty
    let messages: BaseMessage[] = [];
    
    // Always ensure we have a system message first
    const systemMessage = new SystemMessage(
      "You are a helpful customer support agent. Process the ticket and provide a clear, professional response. " +
      "Consider:\n1. The customer's issue or question\n2. Any relevant context or history\n3. Appropriate solutions or next steps\n" +
      "Use the analyze_ticket tool to determine if human intervention is needed."
    );
    
    messages.push(systemMessage);

    // Add any existing messages from state
    if (state.messages && Array.isArray(state.messages)) {
      const validMessages = state.messages
        .filter(msg => msg !== null && msg !== undefined)
        .map(msg => {
          if (msg instanceof BaseMessage) {
            return msg;
          }
          
          // Convert plain objects to BaseMessage instances
          if (msg && typeof msg === 'object' && 'content' in msg) {
            const msgObj = msg as MessageLike & { 
              additional_kwargs?: { 
                tool_calls?: Array<{
                  id: string;
                  type: string;
                  function: {
                    name: string;
                    arguments: string;
                  };
                }>;
              };
              metadata?: Record<string, unknown>;
            };
            
            const content = typeof msgObj.content === 'string' ? msgObj.content : JSON.stringify(msgObj.content);
            
            if (msgObj._getType?.() === 'system' || msgObj.type === 'system') {
              return new SystemMessage(content);
            } else if (msgObj._getType?.() === 'ai' || msgObj.type === 'ai') {
              // Ensure tool calls are properly preserved for AI messages
              const toolCalls = msgObj.additional_kwargs?.tool_calls || msgObj.metadata?.tool_calls as any[] || [];
              
              // Only create AI message with tool calls if they exist
              if (toolCalls && toolCalls.length > 0) {
                return new AIMessage({
                  content,
                  additional_kwargs: {
                    tool_calls: toolCalls.map(call => ({
                      id: call.id || `call_${Date.now()}`,
                      type: call.type || 'function',
                      function: {
                        name: call.function.name,
                        arguments: call.function.arguments
                      }
                    }))
                  }
                });
              }
              
              // For AI messages without tool calls, create a regular message
              return new AIMessage(content);
            } else {
              return new HumanMessage(content);
            }
          }
          
          // Convert strings to HumanMessage
          return new HumanMessage(String(msg));
        });

      messages.push(...validMessages);
    }

    // Call the model with the prepared messages
    const response = await model.invoke(messages);
    return response;
  } catch (error) {
    console.error('Error in callModel:', error);
    throw error;
  }
}

// Define workflow configuration schema
export const ConfigurationSchema = Annotation.Root({
  systemPromptTemplate: Annotation<string>(),
  model: Annotation<string>(),
});

// Define workflow name constant
const WORKFLOW_NAME = 'ticket-processor';

// Create and compile the graph
const workflow = new StateGraph(StateAnnotation, ConfigurationSchema)
  .addNode("agent", callModel)
  .addNode("tools", toolNode)
  .addEdge("tools", "agent")
  .addEdge("__start__", "agent")
  .addConditionalEdges("agent", shouldContinue);

export const graph = workflow.compile();

// Export the entrypoint function
export async function run(input: InputType): Promise<OutputType> {
  return traceWorkflow(
    WORKFLOW_NAME,
    async () => {
      try {
        // Validate input
        const validatedInput = InputSchema.parse(input);
        
        console.log(`[${env.NODE_ENV}] Processing ticket: ${validatedInput.ticket.substring(0, 50)}...`);
        console.log('Input messages:', validatedInput.messages);

        // Create base messages array
        const baseMessages: BaseMessage[] = [];

        // Add system message
        baseMessages.push(new SystemMessage(
          "You are a helpful customer support agent. Process the ticket and provide a clear, professional response. " +
          "Consider:\n1. The customer's issue or question\n2. Any relevant context or history\n3. Appropriate solutions or next steps\n" +
          "Use the analyze_ticket tool to determine if human intervention is needed."
        ));

        // Add previous messages if they exist, filtering out problematic messages
        if (validatedInput.messages?.length) {
          for (const msg of validatedInput.messages) {
            try {
              if (msg instanceof BaseMessage) {
                // For existing BaseMessage instances, ensure tool calls are valid
                if (msg instanceof AIMessage) {
                  const toolCalls = msg.additional_kwargs?.tool_calls;
                  if (!toolCalls || toolCalls.length === 0) {
                    // Skip AI messages with empty tool calls
                    continue;
                  }
                }
                baseMessages.push(msg);
                continue;
              }

              const content = typeof msg.content === 'string' ? msg.content : JSON.stringify(msg.content);
              if (!content) {
                console.warn('Skipping message with empty content:', msg);
                continue;
              }

              switch (msg.type) {
                case 'system':
                  baseMessages.push(new SystemMessage(content));
                  break;
                case 'ai':
                  // Only add AI messages with valid tool calls
                  const toolCalls = msg.metadata?.tool_calls;
                  if (toolCalls && toolCalls.length > 0) {
                    baseMessages.push(new AIMessage({
                      content,
                      additional_kwargs: {
                        tool_calls: toolCalls.map(call => ({
                          id: call.id || `call_${Date.now()}`,
                          type: call.type || 'function',
                          function: {
                            name: call.function.name,
                            arguments: call.function.arguments
                          }
                        }))
                      }
                    }));
                  } else if (!msg.metadata?.is_chunk) {
                    // For non-chunk AI messages without tool calls, convert to human messages
                    baseMessages.push(new HumanMessage(content));
                  }
                  break;
                case 'human':
                  baseMessages.push(new HumanMessage(content));
                  break;
                default:
                  console.warn('Unknown message type:', msg.type);
              }
            } catch (error) {
              console.error('Error converting message:', error, msg);
            }
          }
        }

        // Always add the current ticket as a human message if it's not already the last message
        const lastMessage = baseMessages[baseMessages.length - 1];
        if (!lastMessage || !(lastMessage instanceof HumanMessage) || lastMessage.content !== validatedInput.ticket) {
          baseMessages.push(new HumanMessage(validatedInput.ticket));
        }

        // Debug log the final message array
        console.log('Final messages array:', baseMessages.map(msg => ({
          type: msg.constructor.name,
          content: msg.content,
          tool_calls: msg instanceof AIMessage ? msg.additional_kwargs?.tool_calls : undefined
        })));

        // Initialize state with converted messages
        const initialState = {
          messages: baseMessages,
          ticketId: validatedInput.ticketId,
          userId: validatedInput.userId,
          conversationHistory: []
        };

        // Validate initial state
        if (!initialState.messages || !Array.isArray(initialState.messages) || initialState.messages.length === 0) {
          throw new Error('Invalid initial state: messages must be a non-empty array');
        }

        console.log('Running workflow with state:', {
          messageCount: initialState.messages.length,
          messageTypes: initialState.messages.map(msg => msg.constructor.name),
          ticketId: initialState.ticketId,
          userId: initialState.userId,
          historyCount: initialState.conversationHistory.length
        });

        const finalState = await graph.invoke(initialState);

        // Store final AI message with proper ticket ID
        const lastAIMessage = finalState.messages[finalState.messages.length - 1];
        if (lastAIMessage instanceof AIMessage || lastAIMessage instanceof AIMessageChunk) {
          await storeTicketMessage({
            ticketId: validatedInput.ticketId.trim(),
            message: lastAIMessage,
            metadata: { ticketId: validatedInput.ticketId.trim() },
            userId: validatedInput.userId.trim()
          });
        }

        const finalContent = typeof lastAIMessage.content === 'string' 
          ? lastAIMessage.content.trim()
          : JSON.stringify(lastAIMessage.content);

        // Parse tool outputs from the conversation
        const toolOutputs = finalState.messages
          .filter(msg => msg instanceof AIMessage && msg.additional_kwargs?.tool_calls)
          .flatMap(msg => (msg as AIMessage).additional_kwargs?.tool_calls || [])
          .filter(call => call.function.name === 'analyze_ticket')
          .map(call => JSON.parse(call.function.arguments))
          .pop() || { requires_human: false, status: 'open' };

        // Return formatted response
        return OutputSchema.parse({
          messages: finalState.messages,
          final_answer: finalContent,
          status: toolOutputs.status as OutputType['status'],
          requires_human: toolOutputs.requires_human,
        });

      } catch (error) {
        console.error('Workflow error:', error);
        throw error;
      }
    },
    {
      tags: ['agent', 'ticket-processor'],
      metadata: {
        input_ticket: input.ticket,
        ticket_id: input.ticketId,
        user_id: input.userId,
      }
    }
  );
}
