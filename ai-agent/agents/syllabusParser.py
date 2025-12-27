from langchain.chat_models import init_chat_model
from deepagents import create_deep_agent

analyze_instructions = """You are a syllabus parsing expert. Your task is to extract only the content related to the specified subject from the provided course name.
IMPORTANT: Exclude/skip any "Course Outcomes", "Code", "Credit", "Learning Outcomes", or "Objectives" sections. 

Return ONLY the syllabus content with no additional commentary. If the subject is not found, return the full syllabus.
"""

model = init_chat_model(model="groq:openai/gpt-oss-20b", temperature=0.0, max_tokens=3000)

agent = create_deep_agent(
  model=model,
  system_prompt=analyze_instructions,
)