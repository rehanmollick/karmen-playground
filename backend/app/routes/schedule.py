from fastapi import APIRouter, HTTPException, Request, Body
from typing import List
import json
import copy
import hashlib
import logging
from datetime import date

logger = logging.getLogger(__name__)

from app.models.schedule import Project, ProjectSummary
from app.services.cpm_engine import apply_cpm_to_project
from app.services.mutations import apply_mutations, parse_activities, parse_wbs
from app.services.project_store import get_projects, get_project, set_project, load_seed_projects
from app.cache.cache_manager import cache, client_ip

router = APIRouter()

try:
    load_seed_projects()
except Exception as e:
    logger.warning("Seed load failed: %s", e)


def _session_id(request: Request) -> str:
    return request.headers.get("x-session-id", "")


@router.get("/projects", response_model=List[ProjectSummary])
async def list_projects(request: Request):
    sid = _session_id(request)
    return [
        ProjectSummary(
            id=p.id,
            name=p.name,
            description=p.description,
            activity_count=len(p.activities),
            duration_days=p.project_duration_days,
            project_type=p.project_type,
        )
        for p in get_projects(sid).values()
    ]


@router.get("/projects/{project_id}", response_model=Project)
async def get_project_route(project_id: str, request: Request):
    sid = _session_id(request)
    project = get_project(project_id, sid)
    if project is None:
        raise HTTPException(status_code=404, detail=f"Project '{project_id}' not found")
    return project


@router.patch("/projects/{project_id}")
async def update_project(project_id: str, request: Request, body: dict = Body(...)):
    """Replace a project in the store with updated data (used for applying change orders)."""
    sid = _session_id(request)
    if get_project(project_id, sid) is None:
        raise HTTPException(status_code=404, detail=f"Project '{project_id}' not found")
    try:
        project = Project(**body)
        project = apply_cpm_to_project(project)
        set_project(project_id, project, sid)
        return project
    except Exception as e:
        raise HTTPException(status_code=422, detail=str(e))


@router.post("/schedule/generate")
async def generate_schedule(request: Request, body: dict = Body(...)):
    sid = _session_id(request)
    scope_text = body.get("scope_text", "").strip()
    project_type = body.get("project_type", "residential")

    if not scope_text:
        raise HTTPException(status_code=400, detail="scope_text is required")

    if not cache.check_rate_limit(client_ip(request)):
        raise HTTPException(
            status_code=429,
            detail="Rate limit reached. This is a demo -- for the full experience, reach out to the Karmen team!",
        )

    # Hash the full scope — truncating meant two scopes sharing a 200-char
    # prefix collided and served each other's cached schedule.
    cache_key = f"gen:{hashlib.sha256(scope_text.encode()).hexdigest()}"
    cached = cache.get_by_key(cache_key)
    if cached:
        # Still store in session so it shows up in their project list
        cached_project = Project(**cached)
        set_project(cached_project.id, cached_project, sid)
        return cached

    from app.services.llm_service import generate_schedule_from_scope

    llm_data = await generate_schedule_from_scope(scope_text, project_type)

    project_id = "gen_" + hashlib.md5(scope_text.encode()).hexdigest()[:8]
    project = Project(
        id=project_id,
        name=llm_data.get("project_name", "Custom Project"),
        description=scope_text[:200],
        project_type=project_type,
        start_date=date.today(),
        wbs=parse_wbs(llm_data.get("wbs", [])),
        activities=parse_activities(llm_data.get("activities", [])),
    )
    project = apply_cpm_to_project(project)
    set_project(project.id, project, sid)

    result = project.model_dump(mode="json")
    cache.set_by_key(cache_key, result)
    return result


@router.post("/schedule/edit")
async def edit_schedule(request: Request, body: dict = Body(...)):
    sid = _session_id(request)
    project_id = body.get("project_id", "")
    instruction = body.get("instruction", "").strip()

    if get_project(project_id, sid) is None:
        raise HTTPException(status_code=404, detail=f"Project '{project_id}' not found")
    if not instruction:
        raise HTTPException(status_code=400, detail="instruction is required")

    if not cache.check_rate_limit(client_ip(request)):
        raise HTTPException(
            status_code=429,
            detail="Rate limit reached. This is a demo -- for the full experience, reach out to the Karmen team!",
        )

    project = copy.deepcopy(get_project(project_id, sid))

    from app.services.llm_service import edit_schedule_nl

    mutations_data = await edit_schedule_nl(project.model_dump(mode="json"), instruction)
    diff = apply_mutations(project, mutations_data.get("mutations", []))

    project = apply_cpm_to_project(project)
    set_project(project.id, project, sid)

    return {
        "project": project.model_dump(mode="json"),
        "diff": diff,
        "summary": mutations_data.get("summary", "Schedule updated."),
    }
