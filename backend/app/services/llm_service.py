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


async def chat_with_schedule(project_data: dict, message: str, history: list) -> dict:
    """
    Smart chat: detects if user wants to edit the schedule or ask a question.
    Returns {"type": "answer", "content": str} or {"type": "edit", "mutations": list, "summary": str}.
    """
    import json as _json

    activities = project_data.get("activities", [])
    activities_summary = _json.dumps([
        {
            "id": a["id"], "name": a["name"], "duration": a["duration_days"],
            "start": a.get("start_date"), "end": a.get("end_date"),
            "critical": a.get("is_critical", False), "float": a.get("total_float"),
        }
        for a in activities[:40]
    ], indent=2)

    critical_path = project_data.get("critical_path", [])

    system_prompt = f"""You are an expert construction scheduling assistant embedded in a scheduling application.
You have FULL context of the current project schedule.

PROJECT: {project_data.get('name', 'Unknown')}
DESCRIPTION: {project_data.get('description', '')}
START DATE: {project_data.get('start_date', '')}
END DATE: {project_data.get('project_end_date', '')}
TOTAL DURATION: {project_data.get('project_duration_days', 0)} days
CRITICAL PATH: {', '.join(critical_path)}

ACTIVITIES:
{activities_summary}

RULES:
- If the user asks a QUESTION about the schedule, construction methods, sequencing, risks, terminology, or anything related: respond with a clear, helpful plain text answer. Reference specific activities by name and ID when relevant.
- If the user asks you to MODIFY the schedule (add/remove/change activities, durations, dependencies): respond with ONLY a JSON object (no other text) in this exact format:
{{
  "mutations": [
    {{"type": "modify_duration", "activity_id": "A1030", "new_value": 15}},
    {{"type": "add_activity", "activity": {{"id": "A9010", "name": "New Task", "wbs_id": "1.1", "duration_days": 5, "predecessors": [{{"predecessor_id": "A1030", "type": "FS", "lag_days": 0}}], "resource": "General", "is_milestone": false}}}},
    {{"type": "remove_activity", "activity_id": "A1025"}},
    {{"type": "add_dependency", "from_id": "A1040", "to_id": "A1050", "dep_type": "FS", "lag_days": 0}}
  ],
  "summary": "Brief description of what was changed"
}}
- NEVER mix JSON and plain text in the same response.
- Be specific. Reference activity IDs and names. Show you understand the schedule.
- For questions about risk, delays, or "what if" scenarios, give substantive answers using the actual schedule data."""

    # Build conversation with history
    conversation_parts = [system_prompt]
    for h in history:
        role = "user" if h.get("role") == "user" else "model"
        conversation_parts.append(f"\n{role}: {h.get('content', '')}")
    conversation_parts.append(f"\nuser: {message}")

    full_prompt = "\n".join(conversation_parts)

    response = client.models.generate_content(
        model=FLASH_MODEL,
        contents=full_prompt,
        config=types.GenerateContentConfig(temperature=0.3),
    )
    response_text = response.text

    # Detect if response is a JSON edit or a plain text answer
    stripped = response_text.strip()

    if stripped.startswith("{") and "mutations" in stripped:
        try:
            parsed = _json.loads(stripped)
            return {
                "type": "edit",
                "mutations": parsed.get("mutations", []),
                "summary": parsed.get("summary", "Schedule updated."),
            }
        except _json.JSONDecodeError:
            pass

    # Handle ```json fenced blocks
    if "```json" in stripped:
        json_block = stripped.split("```json")[1].split("```")[0].strip()
        try:
            parsed = _json.loads(json_block)
            if "mutations" in parsed:
                return {
                    "type": "edit",
                    "mutations": parsed.get("mutations", []),
                    "summary": parsed.get("summary", "Schedule updated."),
                }
        except _json.JSONDecodeError:
            pass

    return {"type": "answer", "content": response_text}


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
