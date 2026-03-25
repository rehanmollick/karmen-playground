"""Session-aware in-memory project store.

Seed projects are loaded once and shared read-only. When a session modifies
a seed project (via chat edit or change order apply), a deep copy is created
in that session's private store. Generated projects are always session-scoped.
"""

import json
import os
import copy

# Shared seed projects (read-only after startup)
_seed_projects: dict = {}

# Per-session project overrides: {session_id: {project_id: Project}}
_session_projects: dict = {}


def get_session_store(session_id: str) -> dict:
    if session_id not in _session_projects:
        _session_projects[session_id] = {}
    return _session_projects[session_id]


def get_projects(session_id: str = "") -> dict:
    """Return seed projects merged with any session-specific projects."""
    merged = dict(_seed_projects)
    if session_id:
        merged.update(get_session_store(session_id))
    return merged


def get_project(project_id: str, session_id: str = ""):
    """Get a project. Session copy takes priority over seed."""
    if session_id:
        store = get_session_store(session_id)
        if project_id in store:
            return store[project_id]
    return _seed_projects.get(project_id)


def set_project(project_id: str, project, session_id: str = "") -> None:
    """Save a project. Always goes to the session store if session_id is provided."""
    if session_id:
        get_session_store(session_id)[project_id] = project
    else:
        # No session -- store globally (only used during seed loading)
        _seed_projects[project_id] = project


def get_seed_project(project_id: str):
    """Get the original unmodified seed project."""
    return _seed_projects.get(project_id)


def load_seed_projects() -> None:
    from app.models.schedule import Project
    from app.services.cpm_engine import apply_cpm_to_project

    seed_dir = os.path.join(os.path.dirname(__file__), "..", "seed_data")
    for pid in ["residential", "commercial", "infrastructure"]:
        fp = os.path.join(seed_dir, f"{pid}.json")
        if os.path.exists(fp):
            with open(fp) as f:
                data = json.load(f)
            try:
                project = Project(**data)
                project = apply_cpm_to_project(project)
                _seed_projects[project.id] = project
            except Exception as e:
                print(f"Warning: could not load {pid}: {e}")
