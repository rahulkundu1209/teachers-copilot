import json
from typing import List
from pydantic import BaseModel, Field

# LangChain / DeepAgent Imports
from langchain.tools import tool
from deepagents import create_deep_agent
from langchain.chat_models import init_chat_model

# --- 1. Define Structured Data Schema ---
class SlideContent(BaseModel):
    title: str = Field(description="The heading for this individual slide.")
    content: str = Field(description="Detailed bullet points or body text for the slide.")

class PresentationData(BaseModel):
    title: str = Field(description="The main title of the whole presentation.")
    slides: List[SlideContent] = Field(description="A list of slide objects containing titles and body text.")

# --- 2. JSON Payload Tool ---
@tool(args_schema=PresentationData)
def create_google_slides_payload(title: str, slides: List[SlideContent]) -> str:
    """Generate a JSON payload describing the presentation structure.
    The backend can use this JSON to create the Google Slides presentation in Node.js.
    """
    try:
        payload = {
            "title": title,
            "slides": [
                {"title": slide.title, "content": slide.content}
                for slide in slides
            ],
        }
        return json.dumps(payload)
    except Exception as e:
        return json.dumps({"error": str(e)})

# --- 3. Agent Initialization ---
presentation_instructions = """You are a high-level Presentation Assistant.
Your goal is to create educational and professional slide decks.
1. Design a structure of 5-10 slides based on the user's request.
2. Use the `create_google_slides_payload` tool to generate the slide JSON payload.
3. Output only the JSON payload.
"""

model = init_chat_model(model="groq:openai/gpt-oss-20b", temperature=0.2)

agent = create_deep_agent(
    model=model,
    tools=[create_google_slides_payload],
    system_prompt=presentation_instructions,
)

# Example run:
# agent.invoke({"input": "Generate a short 3-slide deck about why React is popular for full-stack developers."})