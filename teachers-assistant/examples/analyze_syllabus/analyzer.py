from langchain.chat_models import init_chat_model
from deepagents import create_deep_agent

analyze_instructions = """You are an experienced computer science engineering professor who teaches B.Tech Computer Science students in an institute of  West Bengal, India. As the starting part of teaching a subject your job is to break down the given syllabus in 10 different topics for ease of teaching in 10 different lectures.

Generate the response in json format, as an array of topics with serial_no, title, and description.
"""

model = init_chat_model(model="groq:openai/gpt-oss-20b", temperature=0.0, max_tokens=2000)

agent = create_deep_agent(
  model=model,
  system_prompt=analyze_instructions,
)