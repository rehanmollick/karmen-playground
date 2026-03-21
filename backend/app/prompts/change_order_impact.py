import json


def build_co_prompt(
    schedule_json: dict, co_name: str, co_description: str, co_source: str
) -> str:
    acts = [
        {
            "id": a.get("id"),
            "name": a.get("name"),
            "duration_days": a.get("duration_days"),
            "wbs_id": a.get("wbs_id"),
        }
        for a in schedule_json.get("activities", [])[:25]
    ]
    schedule_str = json.dumps({"activities": acts}, indent=2)

    return f"""You are a construction claims analyst. Given a baseline schedule and a change order, determine the schedule impact.

Respond with ONLY a valid JSON object (no markdown, no other text):
{{
  "fragnet": {{
    "new_activities": [
      {{
        "id": "A9010",
        "name": "New Activity",
        "wbs_id": "6.1",
        "duration_days": 10,
        "predecessors": [{{"predecessor_id": "A5030", "type": "FS", "lag_days": 0}}],
        "resource": "Specialty Contractor",
        "is_milestone": false
      }}
    ],
    "modified_activities": [
      {{
        "activity_id": "A5030",
        "old_duration": 10,
        "new_duration": 18,
        "reason": "Extended scope due to change order"
      }}
    ],
    "new_dependencies": [],
    "removed_dependencies": []
  }},
  "narrative": "2-3 paragraph professional time impact analysis narrative",
  "citations": [
    "Per change order: relevant specification reference",
    "Specification Section applicable"
  ]
}}

Baseline schedule activities:
{schedule_str}

Change Order:
Name: {co_name}
Description: {co_description}
Source: {co_source}
"""
