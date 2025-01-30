import { AIMessage, BaseMessage, HumanMessage } from "@langchain/core/messages";
import { ChatOpenAI } from "@langchain/openai";
import { StateGraph, Annotation } from "@langchain/langgraph";
import { z } from 'zod';
import { env } from '../config/env';
import { traceWorkflow } from '../utils/langsmith';

// Define the graph state annotation
const StateAnnotation = Annotation.Root({
  messages: Annotation<BaseMessage[]>({
    reducer: (prev, next) => [...(prev || []), ...next],
  }),
});

// Initialize the LLM with validated environment variables
const model = new ChatOpenAI({
  modelName: env.OPENAI_MODEL,
  temperature: env.OPENAI_TEMPERATURE,
});

// Define input validation schema
const InputSchema = z.object({
  message: z.string().min(1, 'Message is required'),
});

// Define response type
interface WorkflowResponse {
  status: 'success' | 'error';
  messages: BaseMessage[];
  error?: string;
  metadata?: {
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

// Define the function that calls the model
async function callModel(state: typeof StateAnnotation.State) {
  const messages = state.messages;
  const response = await model.invoke(messages);
  return { messages: [response] };
}

// Create the workflow graph
export function createHelloWorldWorkflow() {
  const workflow = new StateGraph(StateAnnotation)
    .addNode("agent", callModel)
    .addEdge("__start__", "agent")
    .addEdge("agent", "__end__");

  return workflow;
}

// Define workflow name constant
const WORKFLOW_NAME = 'hello-world';

// Export the entrypoint function
export async function run(input: { message: string }): Promise<WorkflowResponse> {
  return traceWorkflow(
    WORKFLOW_NAME,
    async () => {
      try {
        // Validate input
        const validatedInput = InputSchema.parse(input);
        
        const startTime = Date.now();
        console.log(`[${env.NODE_ENV}] Processing message: ${validatedInput.message}`);

        // Create and compile the workflow
        const workflow = createHelloWorldWorkflow();
        const app = workflow.compile();

        // Run the workflow with initial state
        const finalState = await app.invoke({
          messages: [
            new HumanMessage(validatedInput.message),
          ],
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
    },
    {
      tags: ['agent', 'hello-world'],
      metadata: {
        input_message: input.message
      }
    }
  );
} 
