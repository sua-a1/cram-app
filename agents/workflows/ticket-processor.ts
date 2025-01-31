import { AIMessage, BaseMessage, HumanMessage } from "@langchain/core/messages";
import { ChatOpenAI } from "@langchain/openai";
import { MemorySaver } from "@langchain/langgraph";
import { createReactAgent } from "@langchain/langgraph/prebuilt";
import { z } from 'zod';
import { env } from '../config/env';
import { traceWorkflow } from '../utils/langsmith';
import { DynamicTool } from "@langchain/core/tools";

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

// Initialize the model with tools
const agentModel = new ChatOpenAI({ 
  modelName: env.OPENAI_MODEL,
  temperature: env.OPENAI_TEMPERATURE 
});

// Initialize memory to persist state between graph runs
const agentCheckpointer = new MemorySaver();

// Create the agent with tools
const agent = createReactAgent({
  llm: agentModel,
  tools: [analyzeTicketTool],
  checkpointSaver: agentCheckpointer,
});

// Get the graph from the agent
const graph = agent.getGraph();

// Define workflow name constant
const WORKFLOW_NAME = 'ticket-processor';

// Export the entrypoint function for local testing
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
        const agentFinalState = await agent.invoke(
          { 
            messages: [
              systemMessage,
              new HumanMessage(validatedInput.ticket)
            ] 
          },
          { 
            configurable: { 
              thread_id: validatedInput.ticketId 
            } 
          },
        );

        // Get the final message
        const finalMessage = agentFinalState.messages[agentFinalState.messages.length - 1];
        const finalContent = typeof finalMessage.content === 'string' 
          ? finalMessage.content 
          : JSON.stringify(finalMessage.content);

        // Parse tool outputs from the conversation
        const toolOutputs = agentFinalState.messages
          .filter(msg => msg instanceof AIMessage && msg.additional_kwargs?.tool_calls)
          .flatMap(msg => (msg as AIMessage).additional_kwargs?.tool_calls || [])
          .filter(call => call.function.name === 'analyze_ticket')
          .map(call => JSON.parse(call.function.arguments))
          .pop() || { requires_human: false, status: 'open' };

        // Return formatted response
        return OutputSchema.parse({
          messages: agentFinalState.messages,
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

// Export both the graph and the agent
export { graph };
export default agent; 
