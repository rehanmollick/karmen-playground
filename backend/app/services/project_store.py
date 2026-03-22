"""Shared in-memory project store used by schedule, change_order, and export routes."""

import json
import os

# Module-level dict — single source of truth for all loaded/generated projects
_projects: dict = {}


def get_projects() -> dict:
    return _projects


def get_project(project_id: str):
    return _projects.get(project_id)


def set_project(project_id: str, project) -> None:
    _projects[project_id] = project


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
                _projects[project.id] = project
            except Exception as e:
                print(f"Warning: could not load {pid}: {e}")
