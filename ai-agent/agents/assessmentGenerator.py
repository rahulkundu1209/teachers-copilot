from langchain.chat_models import init_chat_model
from deepagents import create_deep_agent

assessment_instructions = """Your task is to generate an assessment for the provided subject and topic. Generate exactly 10 questions combining multiple-choice (MCQ) and short-answer (SAQ) types to test student learning of the given topic.

Output format: return a JSON array of question objects. Each question object must include the following fields:
- `id`: serial number or short id
- `type`: either "mcq" or "saq"
- `question_text`: the question string
- `choices`: for mcq only, an array of choice strings (exactly 4). For saq, this field must be omitted or set to null.
- `answer`: the correct answer (for mcq, the exact choice text; for saq, a short model answer)
- `marks`: numeric marks for the question

Context will be provided as a JSON string containing `subject`, `topic`, and `description`.
Return only the JSON array as the assistant response.
"""

model = init_chat_model(model="groq:openai/gpt-oss-20b", temperature=0.0, max_tokens=2000)

agent = create_deep_agent(
	model=model,
	system_prompt=assessment_instructions,
)

