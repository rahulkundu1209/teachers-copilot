import os
import os.path
from typing import List
from pydantic import BaseModel, Field

# Google API Imports
from google.auth.transport.requests import Request
from google.oauth2.credentials import Credentials
from google_auth_oauthlib.flow import InstalledAppFlow
from googleapiclient.discovery import build

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

# --- 2. OAuth 2.0 Authentication Logic ---
# Scopes for creating presentations and saving them to your Drive
SCOPES = [
    "https://www.googleapis.com/auth/presentations",
    "https://www.googleapis.com/auth/drive.file"
]

def get_authenticated_services():
    """Handles the OAuth 2.0 flow to act as the user."""
    creds = None
    if os.path.exists('token.json'):
        creds = Credentials.from_authorized_user_file('token.json', SCOPES)
    
    if not creds or not creds.valid:
        if creds and creds.expired and creds.refresh_token:
            creds.refresh(Request())
        else:
            # Ensure you have 'credentials.json' from Google Cloud Console
            flow = InstalledAppFlow.from_client_secrets_file('credentials.json', SCOPES)
            creds = flow.run_local_server(port=0)
        
        with open('token.json', 'w') as token:
            token.write(creds.to_json())
            
    # Return both services since we need Drive to create and Slides to edit
    return build('slides', 'v1', credentials=creds), build('drive', 'v3', credentials=creds)

# --- 3. The Slide Creation Tool ---
@tool(args_schema=PresentationData)
def create_google_slides(title: str, slides: List[SlideContent]) -> str:
    """Create a new Google Slides presentation with a title and multiple slides.
    Use this tool after researching a topic to generate a high-quality visual deck.
    """
    try:
        slides_service, drive_service = get_authenticated_services()

        # Step A: Create the presentation file
        presentation = slides_service.presentations().create(body={'title': title}).execute()
        presentation_id = presentation.get("presentationId")

        # Get the ID of the auto-generated first slide so we can delete it later
        # The default first slide usually has the objectId 'p'
        initial_slides = presentation.get('slides', [])
        first_slide_id = initial_slides[0].get('objectId') if initial_slides else 'p'

        # Step B: Prepare the batch requests
        requests = []
        
        for i, slide_data in enumerate(slides):
            slide_id = f"slide_{i}"
            title_id = f"title_{i}"
            body_id = f"body_{i}"

            # 1. Create a new slide with TITLE_AND_BODY layout
            requests.append({
                "createSlide": {
                    "objectId": slide_id,
                    "slideLayoutReference": {"predefinedLayout": "TITLE_AND_BODY"},
                    "placeholderIdMappings": [
                        {"layoutPlaceholder": {"type": "TITLE", "index": 0}, "objectId": title_id},
                        {"layoutPlaceholder": {"type": "BODY", "index": 0}, "objectId": body_id}
                    ]
                }
            })

            # 2. Insert text into placeholders
            requests.append({"insertText": {"objectId": title_id, "text": slide_data.title}})
            requests.append({"insertText": {"objectId": body_id, "text": slide_data.content}})

        # --- FIX: Delete the auto-generated empty first slide ---
        # We add this to the END of the request list so the new slides are created first
        requests.append({
            "deleteObject": {
                "objectId": first_slide_id
            }
        })

        # Step C: Execute all updates
        slides_service.presentations().batchUpdate(
            presentationId=presentation_id, 
            body={"requests": requests}
        ).execute()

        # Step D: Share the presentation with anyone (read-only access)
        drive_service.permissions().create(
            fileId=presentation_id,
            body={
                "type": "anyone",
                "role": "reader"
            }
        ).execute()

        return f"Successfully created! URL: https://docs.google.com/presentation/d/{presentation_id}/edit"

    except Exception as e:
        return f"Error creating presentation: {str(e)}"
    
# --- 4. Agent Initialization ---
presentation_instructions = """You are a high-level Presentation Assistant. 
Your goal is to create educational and professional slide decks.
1. Design a structure of 5-10 slides based on the user's request.
2. Use the `create_google_slides` tool to generate the presentation.
3. Output only the final URL.
"""

model = init_chat_model(model="groq:openai/gpt-oss-20b", temperature=0.2)

agent = create_deep_agent(
    model=model,
    tools=[create_google_slides],
    system_prompt=presentation_instructions,
)

# Example run:
# agent.invoke({"input": "Create a short 3-slide deck about why React is popular for full-stack developers."})