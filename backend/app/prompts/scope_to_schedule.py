import json


def build_scope_prompt(scope_text: str, project_type: str) -> str:
    return f"""You are an expert construction scheduler with 20 years of experience building CPM schedules in Primavera P6. Given a project scope description, generate a realistic construction schedule.

You MUST respond with ONLY a valid JSON object (no markdown, no code blocks, no other text):
{{
  "project_name": "string",
  "wbs": [
    {{
      "id": "1",
      "name": "General Conditions",
      "parent_id": null,
      "children": [
        {{"id": "1.1", "name": "Mobilization", "parent_id": "1", "children": [], "activities": ["A1010"]}}
      ],
      "activities": []
    }}
  ],
  "activities": [
    {{
      "id": "A1010",
      "name": "Site Mobilization",
      "wbs_id": "1.1",
      "duration_days": 5,
      "predecessors": [],
      "resource": "General Contractor",
      "is_milestone": false
    }},
    {{
      "id": "A1020",
      "name": "Surveying & Layout",
      "wbs_id": "1.1",
      "duration_days": 3,
      "predecessors": [{{"predecessor_id": "A1010", "type": "FS", "lag_days": 0}}],
      "resource": "Survey Crew",
      "is_milestone": false
    }}
  ]
}}

Rules:
- Generate 25-50 activities depending on project complexity
- Use realistic CSI-based WBS with 8-10 phases
- All durations must be realistic for the scope
- Every activity except the first must have at least one predecessor
- Use FS (Finish-to-Start) relationships primarily, SS/FF where realistic
- Include milestones (duration_days: 0) for key events
- Activity IDs must be sequential: A1010, A1020, A1030...
- Standard phases: mobilization, sitework, foundation, structure, building envelope, MEP rough-in, finishes, MEP trim, commissioning, closeout
- WBS ids in wbs nodes must match wbs_id fields in activities

Project type: {project_type}
Scope description: {scope_text}"""
