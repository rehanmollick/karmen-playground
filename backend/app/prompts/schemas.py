# JSON schema reference for LLM prompts

ACTIVITY_SCHEMA = {
    "id": "string (e.g. A1010)",
    "name": "string",
    "wbs_id": "string",
    "duration_days": "integer",
    "predecessors": [{"predecessor_id": "string", "type": "FS|SS|FF|SF", "lag_days": "integer"}],
    "resource": "string or null",
    "is_milestone": "boolean",
}

MUTATION_TYPES = [
    "modify_duration",
    "add_activity",
    "remove_activity",
    "add_dependency",
]
