from typing import Dict, List, Any
from langchain.chat_models import ChatOpenAI
from langchain.schema import AIMessage, HumanMessage, BaseMessage
from langgraph.graph import StateGraph
import os

def create_hello_world_workflow():
    # Initialize the LLM
    model = ChatOpenAI(
        model_name=os.getenv("OPENAI_MODEL", "gpt-4-1106-preview"),
        temperature=float(os.getenv("OPENAI_TEMPERATURE", "0.7"))
    )

    # Define the function that calls the model
    async def call_model(state: Dict[str, List[BaseMessage]]) -> Dict[str, List[BaseMessage]]:
        messages = state["messages"]
        response = await model.ainvoke(messages)
        return {"messages": [response]}

    # Create the workflow graph
    workflow = StateGraph()
    workflow.add_node("agent", call_model)
    workflow.set_entry_point("agent")
    workflow.set_finish_point("agent")

    return workflow.compile()

async def run(input: Dict[str, Any]) -> Dict[str, Any]:
    try:
        # Create and compile the workflow
        app = create_hello_world_workflow()

        # Run the workflow with initial state
        final_state = await app.ainvoke({
            "messages": [
                HumanMessage(content=input.get("message", ""))
            ]
        })

        # Return formatted response
        return {
            "status": "success",
            "messages": [
                {
                    "role": msg.type,
                    "content": msg.content
                } for msg in final_state["messages"]
            ]
        }

    except Exception as e:
        return {
            "status": "error",
            "error": str(e),
            "messages": []
        } 