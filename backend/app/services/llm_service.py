from google import genai
from google.genai import types
import os
import json
import re
from dotenv import load_dotenv

load_dotenv()

client = genai.Client(api_key=os.environ["GEMINI_API_KEY"])

# Primary: Flash for schedule logic (needs reasoning)
FLASH_MODEL = "gemini-2.5-flash"
# Secondary: Flash-Lite for narrative text (needs fluency)
LITE_MODEL = "gemini-2.5-flash-lite-preview-06-17"


def extract_json(text: str) -> dict:
    """Extract JSON from LLM response, handling markdown code blocks."""
    text = text.strip()
    if "```json" in text:
        text = text.split("```json")[1].split("```")[0].strip()
    elif "```" in text:
        text = text.split("```")[1].split("```")[0].strip()
    try:
        return json.loads(text)
    except json.JSONDecodeError:
        match = re.search(r'\{.*\}', text, re.DOTALL)
        if match:
            return json.loads(match.group())
        raise


async def generate_schedule_from_scope(scope_text: str, project_type: str) -> dict:
    from app.prompts.scope_to_schedule import build_scope_prompt
    prompt = build_scope_prompt(scope_text, project_type)
    response = client.models.generate_content(
        model=FLASH_MODEL,
        contents=prompt,
        config=types.GenerateContentConfig(
            temperature=0.3,
            thinking_config=types.ThinkingConfig(thinking_budget=8000),
        ),
    )
    return extract_json(response.text)


async def edit_schedule_nl(schedule_json: dict, instruction: str) -> dict:
    from app.prompts.natural_language_edit import build_edit_prompt
    prompt = build_edit_prompt(schedule_json, instruction)
    response = client.models.generate_content(
        model=FLASH_MODEL,
        contents=prompt,
        config=types.GenerateContentConfig(temperature=0.2),
    )
    return extract_json(response.text)


async def analyze_change_order_llm(
    schedule_json: dict, co_name: str, co_description: str, co_source: str
) -> dict:
    from app.prompts.change_order_impact import build_co_prompt
    prompt = build_co_prompt(schedule_json, co_name, co_description, co_source)
    response = client.models.generate_content(
        model=LITE_MODEL,
        contents=prompt,
        config=types.GenerateContentConfig(temperature=0.4),
    )
    return extract_json(response.text)
