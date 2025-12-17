from langchain.chat_models import init_chat_model
from deepagents import create_deep_agent
from fastapi import FastAPI
from pydantic import BaseModel
import json
import os
from dotenv import load_dotenv

# Load environment variables from backend .env
load_dotenv("../../../backend/.env")

# Check if GROQ_API_KEY is loaded
groq_key = os.getenv("GROQ_API_KEY")
if not groq_key:
    raise ValueError("GROQ_API_KEY not found in environment variables!")


# FastAPI setup
app = FastAPI()

class Message(BaseModel):
    role: str
    content: str

class InvokeRequest(BaseModel):
    messages: list[Message]

# System prompt for extraction
extract_instructions = """You are a syllabus parsing expert. Your task is to extract only the content related to the specified subject from the provided course name.
IMPORTANT: Exclude/skip any "Course Outcomes", "Code", "Credit", "Learning Outcomes", or "Objectives" sections. Return ONLY the syllabus content.
Return ONLY the extracted section with no additional commentary. If the subject is not found, return the full syllabus."""

# Initialize model
model = init_chat_model(
    model="groq:openai/gpt-oss-20b",
    temperature=0.0,
    max_tokens=3000
)

# Create agent
agent = create_deep_agent(
    model=model,
    system_prompt=extract_instructions,
)

@app.post("/invoke")
async def invoke_agent(request: InvokeRequest):
    """Invoke the parsing agent"""
    try:
        # Convert messages to format agent expects
        messages = [{"role": m.role, "content": m.content} for m in request.messages]
        
        # Invoke agent
        result = agent.invoke({"messages": messages})
        
        # Extract output from AIMessage objects
        output_text = ""
        if "messages" in result and len(result["messages"]) > 0:
            last_msg = result["messages"][-1]
            # Handle AIMessage object from LangChain
            if hasattr(last_msg, "content"):
                output_text = last_msg.content
            elif isinstance(last_msg, dict):
                output_text = last_msg.get("content", "")
        
        # Ensure it's a string
        if not isinstance(output_text, str):
            output_text = str(output_text)
        
        print(f"Agent extracted text (first 200 chars): {output_text[:200] if output_text else 'EMPTY'}")
        
        return {
            "output": {
                "text": output_text
            }
        }
    except Exception as e:
        print(f"Agent error: {str(e)}")
        import traceback
        traceback.print_exc()
        return {
            "error": str(e),
            "output": {
                "text": ""
            }
        }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)