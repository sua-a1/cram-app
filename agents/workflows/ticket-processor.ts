import { AIMessage, BaseMessage, HumanMessage } from "@langchain/core/messages";
import { ChatOpenAI } from "@langchain/openai";
import { StateGraph, Annotation } from "@langchain/langgraph";
import { BaseStore } from "@langchain/core/stores";
import { ToolNode } from "@langchain/langgraph/prebuilt";
import { tool } from "@langchain/core/tools";
import { z } from 'zod';
import { AgentState } from '../config/langgraph';
import { findSimilarTickets } from '../utils/ticket-context-embeddings';
import { supabase } from '../utils/supabase';
import { env } from '../config/env';

// Define the graph state annotation
const StateAnnotation = Annotation.Root({
  messages: Annotation<BaseMessage[]>({
    reducer: (prev, next) => [...(prev || []), ...next],
  }),
  current_ticket: Annotation<AgentState['current_ticket']>({
    reducer: (_, next) => next,
  }),
  similar_tickets: Annotation<AgentState['similar_tickets']>({
    reducer: (_, next) => next,
  }),
  error: Annotation<string | undefined>({
    reducer: (_, next) => next,
  }),
});

// Initialize the LLM with validated environment variables
const model = new ChatOpenAI({
  modelName: env.OPENAI_MODEL,
  temperature: env.OPENAI_TEMPERATURE,
});

// Define tool parameter types
interface LoadTicketParams {
  ticketId: string;
}

interface FindSimilarTicketsParams {
  ticketId: string;
}

// Define tools
const loadTicketTool = tool(async ({ ticketId }: LoadTicketParams) => {
  const { data: ticket, error } = await supabase
    .from('tickets')
    .select('*')
    .eq('id', ticketId)
    .single();

  if (error || !ticket) {
    throw new Error(error?.message || 'Ticket not found');
  }

  return ticket;
}, {
  name: "load_ticket",
  description: "Load ticket details from the database",
  schema: z.object({
    ticketId: z.string().uuid().describe("The ID of the ticket to load"),
  }),
});

const findSimilarTicketsTool = tool(async ({ ticketId }: FindSimilarTicketsParams) => {
  const similarTickets = await findSimilarTickets(ticketId);
  return similarTickets;
}, {
  name: "find_similar_tickets",
  description: "Find similar tickets using vector similarity search",
  schema: z.object({
    ticketId: z.string().uuid().describe("The ID of the ticket to find similar tickets for"),
  }),
});

const tools = [loadTicketTool, findSimilarTicketsTool];
const toolNode = new ToolNode(tools);

// Bind tools to the model
const agentModel = model.bindTools(tools);

// Define the function that determines whether to continue
function shouldContinue(state: typeof StateAnnotation.State) {
  const messages = state.messages;
  const lastMessage = messages[messages.length - 1] as AIMessage;

  if (lastMessage.tool_calls?.length) {
    return "tools";
  }
  return "__end__";
}

// Define the function that calls the model
async function callModel(state: typeof StateAnnotation.State) {
  const messages = state.messages;
  const response = await agentModel.invoke(messages);
  return { messages: [response] };
}

// Create the workflow graph
export function createTicketWorkflow() {
  const workflow = new StateGraph(StateAnnotation)
    .addNode("agent", callModel)
    .addNode("tools", toolNode)
    .addEdge("__start__", "agent")
    .addConditionalEdges("agent", shouldContinue)
    .addEdge("tools", "agent");

  return workflow;
}

// Define input validation schema for cloud deployment
const InputSchema = z.object({
  current_ticket: z.object({
    id: z.string().uuid(),
    // Add other ticket fields as needed
  }).nullable(),
  similar_tickets: z.array(z.any()).nullable(),
  error: z.string().optional()
});

// Define response type for better type safety
interface WorkflowResponse {
  status: 'success' | 'error';
  messages: BaseMessage[];
  error?: string;
  metadata?: {
    ticket_id?: string;
    processing_time?: number;
    total_tokens?: number;
  };
}

// Define type for messages with usage metadata
interface MessageWithUsage extends BaseMessage {
  usage_metadata?: {
    total_tokens: number;
  };
}

// Export the entrypoint function for LangGraph Cloud
export async function run(state: AgentState): Promise<WorkflowResponse> {
  try {
    // Validate input state
    const validatedState = InputSchema.parse(state);
    
    if (!validatedState.current_ticket) {
      throw new Error('No ticket provided in the input state');
    }

    const startTime = Date.now();
    console.log(`[${env.NODE_ENV}] Processing ticket: ${validatedState.current_ticket.id}`);

    // Create and compile the workflow
    const workflow = createTicketWorkflow();
    const app = workflow.compile();

    // Run the workflow with initial state
    const finalState = await app.invoke({
      messages: [
        new HumanMessage(`Process ticket: ${validatedState.current_ticket.id}`),
      ],
    }, {
      configurable: { 
        thread_id: validatedState.current_ticket.id,
        metadata: {
          ticket_id: validatedState.current_ticket.id,
          environment: env.NODE_ENV,
          model: env.OPENAI_MODEL,
        }
      }
    });

    // Calculate processing time
    const processingTime = Date.now() - startTime;

    // Calculate total tokens used
    const totalTokens = finalState.messages.reduce((total, msg) => {
      const messageWithUsage = msg as MessageWithUsage;
      return total + (messageWithUsage.usage_metadata?.total_tokens || 0);
    }, 0);

    // Return formatted response
    return {
      status: 'success',
      messages: finalState.messages,
      metadata: {
        ticket_id: validatedState.current_ticket.id,
        processing_time: processingTime,
        total_tokens: totalTokens
      }
    };

  } catch (error) {
    console.error('Workflow error:', error);
    return {
      status: 'error',
      messages: [],
      error: error instanceof Error ? error.message : 'Unknown error occurred'
    };
  }
} 
