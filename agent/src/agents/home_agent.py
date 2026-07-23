# src/agents/home_agent.py
from google import genai
from google.genai import types
from langgraph.graph import StateGraph, MessagesState, START, END
from langgraph.prebuilt import ToolNode
from src.config import GEMINI_API_KEY
from src.tools.home_tools import home_tools_list

ai_client = genai.Client(api_key=GEMINI_API_KEY)


def call_home_agent(state: MessagesState):
    messages = state['messages']

    system_instruction = (
        "You are 'J.A.R.V.I.S', a smart home automation assistant. You control appliances via tools.\n"
        "Here is the list of available devices in the house and their IDs:\n"
        "- 'light_living' (Use this for 'đèn phòng khách', 'đèn trần')\n"
        "- 'air_con' (Use this for 'điều hòa', 'máy lạnh', 'điều hòa phòng ngủ')\n"
        "- 'gate' (Use this for 'cửa cổng', 'cổng chính', 'mở cổng')\n\n"
        "Instructions:\n"
        "1. Map user requests to the correct device ID.\n"
        "2. If user requests multiple actions (e.g., turn off light and turn on AC), call multiple tools sequentially or parallelly.\n"
        "3. Reply in Vietnamese naturally after tools executed."
    )

    config = types.GenerateContentConfig(
        system_instruction=system_instruction,
        tools=home_tools_list,
        temperature=0.1  # Rất thấp để tránh Agent "sáng tạo" sai ID thiết bị
    )

    user_input = messages[-1].content
    response = ai_client.models.generate_content(
        model='gemini-2.5-flash',
        contents=user_input,
        config=config
    )
    return {"messages": [response]}


def should_continue(state: MessagesState):
    last_message = state['messages'][-1]
    if hasattr(last_message, 'function_calls') and last_message.function_calls:
        return "tools"
    return END


# Khởi tạo đồ thị LangGraph
workflow = StateGraph(MessagesState)
workflow.add_node("agent", call_home_agent)
workflow.add_node("tools", ToolNode(home_tools_list))

workflow.add_edge(START, "agent")
workflow.add_conditional_edges("agent", should_continue, {"tools": "tools", END: END})
workflow.add_edge("tools", "agent")

home_agent_executor = workflow.compile()