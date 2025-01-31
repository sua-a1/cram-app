import { ChatOpenAI } from "@langchain/openai";
import { HumanMessage, AIMessage, BaseMessage, SystemMessage, AIMessageChunk } from "@langchain/core/messages";
import { StateGraph, Annotation } from "@langchain/langgraph";
import { DynamicTool } from "@langchain/core/tools";
import { ToolNode } from "@langchain/langgraph/prebuilt";
import { z } from 'zod';
import { env } from '../config/env';
import { traceWorkflow } from '../utils/langsmith';
import { analyzeTicketTool } from '../tools/analyze-ticket';
import { documentRetrievalTool } from '../tools/document-retrieval-tool';
import { storeTicketMessages, getTicketMessages, storeTicketMessage } from '../utils/ticket-messages';

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
const tools = [analyzeTicketTool, documentRetrievalTool];
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
    // Ensure state.messages exists and is an array
    if (!state?.messages || !Array.isArray(state.messages)) {
      console.error('Invalid state.messages:', state?.messages);
      throw new Error('state.messages must be a non-null array');
    }

    // Debug logging
    console.log('State received:', {
      messages: state.messages?.length || 0,
      ticketId: state.ticketId,
      userId: state.userId,
      conversationHistory: state.conversationHistory?.length || 0
    });

    // Debug logging for messages
    console.log('Messages before model invocation:', state.messages.map(msg => ({
      type: msg?.constructor?.name || 'null',
      content: msg?.content || 'no content',
      _type: msg?._getType?.() || 'unknown',
      additional_kwargs: msg?.additional_kwargs || {}
    })));

    // Validate and convert messages
    const validMessages = state.messages
      .filter(msg => msg !== null && msg !== undefined)
      .map(msg => {
        if (msg instanceof BaseMessage) return msg;
        
        // Convert plain objects to BaseMessage instances
        if (msg && typeof msg === 'object' && 'content' in msg) {
          const msgObj = msg as MessageLike;
          const content = typeof msgObj.content === 'string' ? msgObj.content : JSON.stringify(msgObj.content);
          const metadata = msgObj.metadata || {};
          
          if (msgObj._getType?.() === 'system' || msgObj.type === 'system') {
            return new SystemMessage(content, metadata);
          } else if (msgObj._getType?.() === 'ai' || msgObj.type === 'ai') {
            return new AIMessage(content, metadata);
          } else {
            return new HumanMessage(content, metadata);
          }
        }
        
        // Convert strings to HumanMessage
        if (typeof msg === 'string') {
          return new HumanMessage(msg);
        }

        console.warn('Invalid message type:', msg);
        return null;
      })
      .filter((msg): msg is BaseMessage => msg !== null);

    if (validMessages.length === 0) {
      throw new Error('No valid messages to process');
    }

    // Ensure we have at least a system message
    if (!validMessages.some(msg => msg instanceof SystemMessage)) {
      validMessages.unshift(new SystemMessage(
        "You are a helpful customer support agent. Process the ticket and provide a clear, professional response. " +
        "Consider:\n1. The customer's issue or question\n2. Any relevant context or history\n3. Appropriate solutions or next steps\n" +
        "Use the analyze_ticket tool to determine if human intervention is needed."
      ));
    }

    // Invoke model with valid messages
    console.log('Invoking model with messages:', validMessages.length);
    console.log('Message types:', validMessages.map(msg => msg.constructor.name));
    const response = await model.invoke(validMessages);
    console.log('Model response received');
    
    // Store the latest message pair
    const lastUserMessage = validMessages[validMessages.length - 1];
    await storeTicketMessages(
      state.ticketId, 
      [lastUserMessage, response], 
      {}, 
      state.userId
    );
    
    return { 
      messages: [response],
      conversationHistory: [lastUserMessage, response]
    };
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

        // Add previous messages if they exist
        if (validatedInput.messages?.length) {
          for (const msg of validatedInput.messages) {
            try {
              if (msg instanceof BaseMessage) {
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
                  baseMessages.push(new SystemMessage(content, msg.metadata));
                  break;
                case 'ai':
                  baseMessages.push(new AIMessage(content, msg.metadata));
                  break;
                case 'human':
                  baseMessages.push(new HumanMessage(content, msg.metadata));
                  break;
                default:
                  console.warn('Unknown message type:', msg.type);
              }
            } catch (error) {
              console.error('Error converting message:', error, msg);
            }
          }
        }

        // Always add the current ticket as a human message
        baseMessages.push(new HumanMessage(validatedInput.ticket));

        console.log('Converted messages:', baseMessages.map(msg => ({
          type: msg.constructor.name,
          content: msg.content,
          _type: msg._getType?.()
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
        const lastMessage = finalState.messages[finalState.messages.length - 1];
        if (lastMessage instanceof AIMessage || lastMessage instanceof AIMessageChunk) {
          await storeTicketMessage({
            ticketId: validatedInput.ticketId.trim(), // Ensure clean UUID
            message: lastMessage,
            metadata: { ticketId: validatedInput.ticketId.trim() },
            userId: validatedInput.userId.trim()
          });
        }

        const finalContent = typeof lastMessage.content === 'string' 
          ? lastMessage.content.trim() // Ensure clean content
          : JSON.stringify(lastMessage.content);

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
