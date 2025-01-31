import { ChatOpenAI } from "@langchain/openai";
import { HumanMessage, AIMessage, BaseMessage } from "@langchain/core/messages";
import { StateGraph, Annotation } from "@langchain/langgraph";
import { DynamicTool } from "@langchain/core/tools";
import { ToolNode } from "@langchain/langgraph/prebuilt";
import { z } from 'zod';
import { env } from '../config/env';
import { traceWorkflow } from '../utils/langsmith';

// Define input/output schemas
const InputSchema = z.object({
  ticket: z.string().min(1, 'Ticket content is required'),
  ticketId: z.string().uuid('Valid ticket ID is required'),
});

const OutputSchema = z.object({
  messages: z.array(z.any()),
  final_answer: z.string(),
  status: z.enum(['open', 'in-progress', 'closed']),
  requires_human: z.boolean(),
});

type InputType = z.infer<typeof InputSchema>;
type OutputType = z.infer<typeof OutputSchema>;

// Define the graph state
const StateAnnotation = Annotation.Root({
  messages: Annotation<BaseMessage[]>({
    reducer: (x, y) => x.concat(y),
  }),
  ticketId: Annotation<string>(),
  requires_human: Annotation<boolean>({
    value: (x, y) => y,
    default: () => false
  }),
  status: Annotation<'open' | 'in-progress' | 'closed'>({
    value: (x, y) => y,
    default: () => 'open'
  }),
});

// Define tools for ticket processing
const analyzeTicketTool = new DynamicTool({
  name: "analyze_ticket",
  description: "Analyzes a support ticket and determines if it requires human intervention",
  func: async (ticket: string) => {
    const requiresHuman = ticket.toLowerCase().includes('escalate') || 
                         ticket.toLowerCase().includes('human assistance');
    return JSON.stringify({
      requires_human: requiresHuman,
      status: requiresHuman ? 'in-progress' : 'open'
    });
  },
});

// Create a tool node
const tools = [analyzeTicketTool];
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
  const response = await model.invoke(state.messages);
  return { messages: [response] };
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

        // Add system message for ticket processing context
        const systemMessage = new HumanMessage(
          "You are a helpful customer support agent. Process the ticket and provide a clear, professional response. " +
          "Consider:\n1. The customer's issue or question\n2. Any relevant context or history\n3. Appropriate solutions or next steps\n" +
          "Use the analyze_ticket tool to determine if human intervention is needed."
        );

        // Run the workflow with initial state
        const finalState = await graph.invoke({
          messages: [systemMessage, new HumanMessage(validatedInput.ticket)],
          ticketId: validatedInput.ticketId,
        });

        // Get the final message
        const lastMessage = finalState.messages[finalState.messages.length - 1];
        const finalContent = typeof lastMessage.content === 'string' 
          ? lastMessage.content 
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
      }
    }
  );
}
