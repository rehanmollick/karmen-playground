import json


def build_co_prompt(
    schedule_json: dict, co_name: str, co_description: str, co_source: str
) -> str:
    activities = schedule_json.get("activities", [])
    critical_path = schedule_json.get("critical_path", [])
    project_end_date = schedule_json.get("project_end_date", "")
    start_date = schedule_json.get("start_date", "")

    acts = [
        {
            "id": a.get("id"),
            "name": a.get("name"),
            "duration_days": a.get("duration_days"),
            "wbs_id": a.get("wbs_id"),
            "early_start": a.get("early_start"),
            "early_finish": a.get("early_finish"),
            "total_float": a.get("total_float", 0),
            "is_critical": a.get("id") in critical_path,
        }
        for a in activities[:40]
    ]
    schedule_str = json.dumps({"activities": acts}, indent=2)

    # Find the last critical path activity for the prompt
    last_cp_activity = None
    cp_set = set(critical_path)
    for a in reversed(activities):
        if a.get("id") in cp_set:
            last_cp_activity = a
            break

    last_cp_note = ""
    if last_cp_activity:
        last_cp_note = f"The last activity on the critical path is '{last_cp_activity.get('name')}' (ID: {last_cp_activity.get('id')}), finishing on {last_cp_activity.get('early_finish', project_end_date)}."

    return f"""You are a construction claims analyst performing a Time Impact Analysis (TIA). Given a baseline schedule and a change order, determine the schedule impact using Critical Path Method analysis.

Project baseline: starts {start_date}, ends {project_end_date}.
Critical path activities (in order): {critical_path}
{last_cp_note}

RULES — follow these exactly:
1. For "delay X by N days" changes: use `modified_activities` to extend the duration of the SPECIFIC existing activity named (find it by name in the schedule). Do NOT add a new activity for a simple delay.
2. For genuinely new scope/work: add to `new_activities` with predecessors pointing to the relevant existing activity on the critical path. To impact the project end date, the new activity MUST have a critical-path activity as its predecessor.
3. Activities with total_float > 0 are NOT on the critical path — modifying them or making them predecessors of non-critical activities will NOT delay the project.
4. Only activities on the critical path (total_float = 0, is_critical = true) affect the project end date.
5. If the change delays or extends a critical-path activity, the project end date shifts by the same number of days.
6. `new_dependencies` should be empty unless you need to add a dependency between two EXISTING activities.

Respond with ONLY a valid JSON object (no markdown, no other text):
{{
  "fragnet": {{
    "new_activities": [],
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
  "narrative": "2-3 paragraph professional time impact analysis narrative explaining which activities are affected, why they are on/off the critical path, and the resulting schedule impact in days",
  "citations": [
    "Per change order: relevant specification reference",
    "Specification Section applicable"
  ]
}}

Baseline schedule:
{schedule_str}

Change Order:
Name: {co_name}
Description: {co_description}
Source: {co_source}
"""
