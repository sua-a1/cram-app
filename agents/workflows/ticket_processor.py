from typing import Dict, List, Any
from langchain.chat_models import ChatOpenAI
from langchain.schema import AIMessage, HumanMessage, BaseMessage
from langgraph.graph import StateGraph
import os

def create_ticket_processor_workflow():
    # Initialize the LLM
    model = ChatOpenAI(
        model_name=os.getenv("OPENAI_MODEL", "gpt-4-1106-preview"),
        temperature=float(os.getenv("OPENAI_TEMPERATURE", "0.3"))
    )

    # Define the function that processes the ticket
    async def process_ticket(state: Dict[str, List[BaseMessage]]) -> Dict[str, List[BaseMessage]]:
        messages = state["messages"]
        
        # Add system message for ticket processing context
        system_message = HumanMessage(content="""
        You are a helpful customer support agent. Process the ticket and provide a clear, professional response.
        Consider:
        1. The customer's issue or question
        2. Any relevant context or history
        3. Appropriate solutions or next steps
        """)
        
        # Combine system message with user's ticket
        all_messages = [system_message] + messages
        
        # Get response from the model
        response = await model.ainvoke(all_messages)
        return {"messages": [response]}

    # Create the workflow graph
    workflow = StateGraph()
    workflow.add_node("agent", process_ticket)
    workflow.set_entry_point("agent")
    workflow.set_finish_point("agent")

    return workflow.compile()

async def run(input: Dict[str, Any]) -> Dict[str, Any]:
    try:
        # Create and compile the workflow
        app = create_ticket_processor_workflow()

        # Run the workflow with initial state
        final_state = await app.ainvoke({
            "messages": [
                HumanMessage(content=input.get("ticket", ""))
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