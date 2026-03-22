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


async def chat_with_schedule(schedule_json: dict, message: str, history: list) -> dict:
    """
    Handle a chat message in the context of a project schedule.
    Returns {"type": "answer", "content": str} or {"type": "edit", "mutations": list, "summary": str}.
    """
    import json as _json

    # Summarize the schedule to keep prompt size manageable
    activities = schedule_json.get("activities", [])
    critical_path = schedule_json.get("critical_path", [])
    act_summary = "\n".join(
        f"  {a['id']}: {a['name']} ({a['duration_days']}d)"
        + (" [CRITICAL]" if a['id'] in critical_path else "")
        for a in activities[:40]
    )
    if len(activities) > 40:
        act_summary += f"\n  ... and {len(activities) - 40} more activities"

    history_text = ""
    for msg in history:
        role = msg.get("role", "user")
        content = msg.get("content", "")
        history_text += f"\n{role.upper()}: {content}"

    system_prompt = f"""You are a construction scheduling expert assistant with full context of the current project schedule.

PROJECT: {schedule_json.get('name', 'Unknown')} ({schedule_json.get('project_type', 'construction')})
START DATE: {schedule_json.get('start_date', 'N/A')}
DURATION: {schedule_json.get('project_duration_days', 'N/A')} days
ACTIVITIES ({len(activities)} total, {len(critical_path)} on critical path):
{act_summary}
CRITICAL PATH IDs: {', '.join(critical_path[:15])}{'...' if len(critical_path) > 15 else ''}

INSTRUCTIONS:
- If the user asks a QUESTION about the schedule, construction methods, sequencing, risks, dependencies, CPM concepts, or anything else — respond with a clear, helpful plain text answer.
- If the user asks you to MODIFY the schedule (add/remove/change activities, adjust durations, add dependencies) — respond with a JSON mutations object.

For questions: respond with EXACTLY this JSON:
{{"type": "answer", "content": "your detailed answer here"}}

For edits: respond with EXACTLY this JSON:
{{"type": "edit", "summary": "what you changed", "mutations": [
  {{"type": "modify_duration", "activity_id": "A001", "new_value": 10}},
  {{"type": "add_activity", "activity": {{"id": "NEW1", "name": "New Task", "wbs_id": "1.1", "duration_days": 5, "predecessors": [{{"predecessor_id": "A001", "type": "FS", "lag_days": 0}}]}}}},
  {{"type": "remove_activity", "activity_id": "A002"}},
  {{"type": "add_dependency", "from_id": "A001", "to_id": "A003", "dep_type": "FS", "lag_days": 0}}
]}}

Respond ONLY with valid JSON. No markdown, no prose outside the JSON."""

    contents = system_prompt
    if history_text:
        contents += f"\n\nCONVERSATION HISTORY:{history_text}"
    contents += f"\n\nUSER: {message}"

    response = client.models.generate_content(
        model=FLASH_MODEL,
        contents=contents,
        config=types.GenerateContentConfig(temperature=0.3),
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
