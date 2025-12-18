from langchain.chat_models import init_chat_model
from deepagents import create_deep_agent

analyze_instructions = """Your task is to analyze and divide the provided syllabus of a subject as per the given scenario for a teacher with the provided teacher_background to plan their lectures. The students specialization, subject name and probable number of lectures will be mentioned in scenario, you will divide the entire syllabus into that particular number of topics to make the teaching easy and engaging.

Generate the response in json format, as an array of topics with serial_no, title, and description.
"""

model = init_chat_model(model="groq:openai/gpt-oss-20b", temperature=0.0, max_tokens=2000)

agent = create_deep_agent(
  model=model,
  system_prompt=analyze_instructions,
)