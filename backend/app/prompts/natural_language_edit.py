import json


def build_edit_prompt(schedule_json: dict, instruction: str) -> str:
    # Truncate to save tokens
    acts = schedule_json.get("activities", [])[:30]
    compact = {"activities": acts}
    schedule_str = json.dumps(compact, default=str)[:6000]

    return f"""You are a construction schedule editor. Given the current schedule and a natural language instruction, output the specific mutations needed.

Respond with ONLY a valid JSON object (no markdown, no other text):
{{
  "mutations": [
    {{
      "type": "modify_duration",
      "activity_id": "A1030",
      "old_value": 10,
      "new_value": 15,
      "reason": "User requested 5 additional days for concrete curing"
    }},
    {{
      "type": "add_activity",
      "activity": {{
        "id": "A1025",
        "name": "QC Inspection",
        "wbs_id": "3.1",
        "duration_days": 2,
        "predecessors": [{{"predecessor_id": "A1020", "type": "FS", "lag_days": 0}}],
        "resource": "QC Inspector",
        "is_milestone": false
      }},
      "reason": "User requested adding inspection"
    }},
    {{
      "type": "add_dependency",
      "from_id": "A1040",
      "to_id": "A1050",
      "dep_type": "SS",
      "lag_days": 2,
      "reason": "User requested overlap"
    }},
    {{
      "type": "remove_activity",
      "activity_id": "A1025",
      "reason": "User requested removal"
    }}
  ],
  "summary": "Brief human-readable summary of what was changed"
}}

Valid mutation types: modify_duration, add_activity, remove_activity, add_dependency

Current schedule (partial):
{schedule_str}

Instruction: "{instruction}"
"""
