import google.generativeai as genai
import os
import json
import re
from dotenv import load_dotenv

load_dotenv()

genai.configure(api_key=os.environ["GEMINI_API_KEY"])

# Primary: Flash for schedule logic (needs reasoning)
flash_model = genai.GenerativeModel("gemini-2.5-flash")
# Secondary: Flash-Lite for narrative text (needs fluency)
lite_model = genai.GenerativeModel("gemini-2.5-flash-lite-preview-06-17")


def extract_json(text: str) -> dict:
    """Extract JSON from LLM response, handling markdown code blocks."""
    text = text.strip()
    if "```json" in text:
        text = text.split("```json")[1].split("```")[0].strip()
    elif "```" in text:
        text = text.split("```")[1].split("```")[0].strip()
    # Remove any trailing text after the JSON
    try:
        return json.loads(text)
    except json.JSONDecodeError:
        # Try to find JSON object
        match = re.search(r'\{.*\}', text, re.DOTALL)
        if match:
            return json.loads(match.group())
        raise


async def generate_schedule_from_scope(scope_text: str, project_type: str) -> dict:
    from app.prompts.scope_to_schedule import build_scope_prompt
    prompt = build_scope_prompt(scope_text, project_type)
    response = flash_model.generate_content(prompt)
    return extract_json(response.text)


async def edit_schedule_nl(schedule_json: dict, instruction: str) -> dict:
    from app.prompts.natural_language_edit import build_edit_prompt
    prompt = build_edit_prompt(schedule_json, instruction)
    response = flash_model.generate_content(prompt)
    return extract_json(response.text)


async def analyze_change_order_llm(
    schedule_json: dict, co_name: str, co_description: str, co_source: str
) -> dict:
    from app.prompts.change_order_impact import build_co_prompt
    prompt = build_co_prompt(schedule_json, co_name, co_description, co_source)
    response = lite_model.generate_content(prompt)
    return extract_json(response.text)
