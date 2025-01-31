import { ChatOpenAI } from "@langchain/openai";
import { HumanMessage, AIMessage } from "@langchain/core/messages";
import { StateGraph, MessagesAnnotation } from "@langchain/langgraph";
import { DynamicTool } from "@langchain/core/tools";
import { ToolNode } from "@langchain/langgraph/prebuilt";
import { env } from '../config/env';

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
}).bindTools(tools);

// Define the function that determines whether to continue or not
function shouldContinue({ messages }: typeof MessagesAnnotation.State) {
  const lastMessage = messages[messages.length - 1] as AIMessage;
  // If the LLM makes a tool call, then we route to the "tools" node
  if (lastMessage.tool_calls?.length) {
    return "tools";
  }
  // Otherwise, we stop (reply to the user) using the special "__end__" node
  return "__end__";
}

// Define the function that calls the model
async function callModel(state: typeof MessagesAnnotation.State) {
  const response = await model.invoke(state.messages);
  // We return a list, because this will get added to the existing list
  return { messages: [response] };
}

// Define a new graph
const workflow = new StateGraph(MessagesAnnotation)
  .addNode("agent", callModel)
  .addNode("tools", toolNode)
  .addEdge("tools", "agent")
  .addEdge("__start__", "agent")
  .addConditionalEdges("agent", shouldContinue);

// Finally, we compile it into a LangChain Runnable.
const app = workflow.compile();

// Use the agent
const finalState = await app.invoke({
  messages: [new HumanMessage("what is the weather in sf")],
});
console.log(finalState.messages[finalState.messages.length - 1].content);

const nextState = await app.invoke({
  // Including the messages from the previous run gives the LLM context.
  // This way it knows we're asking about the weather in NY
  messages: [...finalState.messages, new HumanMessage("what about ny")],
    });
console.log(nextState.messages[nextState.messages.length - 1].content);

// Compile the graph
//const graph = workflow.compile();

// Define workflow name constant
//const WORKFLOW_NAME = 'hello-world';

// Export the entrypoint function for local testing
//export async function run(input: { message: string }) {
//  try {
//    // Run the workflow with initial state
//    const finalState = await graph.invoke({
//      messages: [new HumanMessage(input.message)],
//    });

//    return {
//      messages: finalState.messages,
//      final_answer: finalState.messages[finalState.messages.length - 1].content,
//    };

//  } catch (error) {
//    console.error('Workflow error:', error);
//    throw error;
//  }
//}

// Export the graph and workflow
//export { graph };
//export default workflow; 