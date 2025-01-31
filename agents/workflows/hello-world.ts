import { ChatOpenAI } from "@langchain/openai";
import { HumanMessage, AIMessage, BaseMessage} from "@langchain/core/messages";
import { StateGraph, MessagesAnnotation, MemorySaver, Annotation } from "@langchain/langgraph";
import { DynamicTool } from "@langchain/core/tools";
import { ToolNode } from "@langchain/langgraph/prebuilt";
import { env } from '../config/env.js';

// Debug: Log configuration
console.log('Initializing ChatOpenAI with:', {
  modelName: env.OPENAI_MODEL,
  temperature: env.OPENAI_TEMPERATURE,
  apiKeyPresent: env.OPENAI_API_KEY ? 'Yes' : 'No'
});

// Define the graph state
// See here for more info: https://langchain-ai.github.io/langgraphjs/how-tos/define-state/
const StateAnnotation = Annotation.Root({
  messages: Annotation<BaseMessage[]>({
    reducer: (x, y) => x.concat(y),
  }),
});

// Define a simple hello world tool
const helloWorldTool = new DynamicTool({
  name: "hello_world",
  description: "A simple tool that returns 'Hello, World!'",
  func: async () => "Hello, World!",
});

// Create a tool node
const tools = [helloWorldTool];
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
  // Otherwise, we stop (reply to the user) using the special "__end__" node
  return "__end__";
}

// Define the function that calls the model
async function callModel(state: typeof StateAnnotation.State) {
  const response = await model.invoke(state.messages);
  // We return a list, because this will get added to the existing list
  return { messages: [response] };
}

export const ConfigurationSchema = Annotation.Root({
  /**
   * The system prompt to be used by the agent.
   */
  systemPromptTemplate: Annotation<string>,

  /**
   *
   * The name of the language model to be used by the agent.
   */
  model: Annotation<string>,
});

// Define a new graph
const workflow = new StateGraph(StateAnnotation, ConfigurationSchema)
  .addNode("agent", callModel)
  .addNode("tools", toolNode)
  .addEdge("tools", "agent")
  .addEdge("__start__", "agent")
  .addConditionalEdges("agent", shouldContinue);


//const checkpointer = new MemorySaver();

// Compile the graph
export const graph = workflow.compile();


// Export the run function
export async function run(input: { message: string }) {
  try {
    // Run the workflow with initial state
    const finalState = await graph.invoke({
      messages: [new HumanMessage(input.message)],
    });

    return {
      messages: finalState.messages,
      final_answer: finalState.messages[finalState.messages.length - 1].content,
    };
  } catch (error) {
    console.error('Workflow error:', error);
    throw error;
  }
}

// Test the workflow if this file is run directly
if (import.meta.url === new URL(import.meta.url).href) {
  console.log('\nTesting workflow with a simple message...');
  run({ message: "What can you do? Please use the hello_world tool in your response." })
    .then(result => {
      console.log('\nTest result:');
      console.log('Final answer:', result.final_answer);
    })
    .catch(error => {
      console.error('Test failed:', error);
    });
} 