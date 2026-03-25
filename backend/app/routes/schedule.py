from fastapi import APIRouter, HTTPException, Request, Body
from typing import List
import json
import copy
import hashlib
from datetime import date

from app.models.schedule import Project, ProjectSummary, Activity, Dependency, WBSNode
from app.services.cpm_engine import apply_cpm_to_project
from app.services.project_store import get_projects, get_project, set_project, load_seed_projects
from app.cache.cache_manager import cache

router = APIRouter()

try:
    load_seed_projects()
except Exception as e:
    print(f"Warning: seed load failed: {e}")


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

    client_ip = request.client.host if request.client else "unknown"
    if not cache.check_rate_limit(client_ip):
        raise HTTPException(
            status_code=429,
            detail="Rate limit reached. This is a demo -- for the full experience, reach out to the Karmen team!",
        )

    cache_key = f"gen:{hashlib.md5(scope_text[:200].encode()).hexdigest()}"
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
        wbs=_parse_wbs(llm_data.get("wbs", [])),
        activities=_parse_activities(llm_data.get("activities", [])),
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

    client_ip = request.client.host if request.client else "unknown"
    if not cache.check_rate_limit(client_ip):
        raise HTTPException(
            status_code=429,
            detail="Rate limit reached. This is a demo -- for the full experience, reach out to the Karmen team!",
        )

    project = copy.deepcopy(get_project(project_id, sid))

    from app.services.llm_service import edit_schedule_nl

    mutations_data = await edit_schedule_nl(project.model_dump(mode="json"), instruction)
    mutations = mutations_data.get("mutations", [])
    diff = []

    act_map = {a.id: a for a in project.activities}

    for mut in mutations:
        mut_type = mut.get("type")
        if mut_type == "modify_duration":
            aid = mut.get("activity_id")
            new_val = mut.get("new_value")
            if aid in act_map and new_val is not None:
                old_val = act_map[aid].duration_days
                act_map[aid].duration_days = int(new_val)
                diff.append({"type": "modify_duration", "activity_id": aid, "old": old_val, "new": int(new_val)})

        elif mut_type == "add_activity":
            act_data = mut.get("activity", {})
            if act_data and act_data.get("id") not in act_map:
                new_act = _parse_single_activity(act_data)
                project.activities.append(new_act)
                act_map[new_act.id] = new_act
                diff.append({"type": "add_activity", "activity_id": new_act.id})

        elif mut_type == "remove_activity":
            aid = mut.get("activity_id")
            if aid in act_map:
                project.activities = [a for a in project.activities if a.id != aid]
                del act_map[aid]
                diff.append({"type": "remove_activity", "activity_id": aid})

        elif mut_type == "add_dependency":
            to_id = mut.get("to_id")
            from_id = mut.get("from_id")
            dep_type = mut.get("dep_type", "FS")
            lag = mut.get("lag_days", 0)
            if to_id in act_map and from_id in act_map:
                act_map[to_id].predecessors.append(
                    Dependency(predecessor_id=from_id, type=dep_type, lag_days=lag)
                )
                diff.append({"type": "add_dependency", "from": from_id, "to": to_id})

    project = apply_cpm_to_project(project)
    set_project(project.id, project, sid)

    return {
        "project": project.model_dump(mode="json"),
        "diff": diff,
        "summary": mutations_data.get("summary", "Schedule updated."),
    }


# ── helpers ────────────────────────────────────────────────────────────────

def _parse_wbs(nodes_data: list) -> List[WBSNode]:
    out = []
    for nd in nodes_data:
        out.append(
            WBSNode(
                id=str(nd.get("id", "")),
                name=nd.get("name", ""),
                parent_id=nd.get("parent_id"),
                children=_parse_wbs(nd.get("children", [])),
                activities=nd.get("activities", []),
            )
        )
    return out


def _parse_activities(acts_data: list) -> List[Activity]:
    return [_parse_single_activity(a) for a in acts_data]


def _parse_single_activity(a: dict) -> Activity:
    preds = [
        Dependency(
            predecessor_id=str(d.get("predecessor_id", "")),
            type=d.get("type", "FS"),
            lag_days=int(d.get("lag_days", 0)),
        )
        for d in a.get("predecessors", [])
    ]
    return Activity(
        id=str(a.get("id", "")),
        name=a.get("name", ""),
        wbs_id=str(a.get("wbs_id", "")),
        duration_days=int(a.get("duration_days", 1)),
        predecessors=preds,
        resource=a.get("resource"),
        is_milestone=bool(a.get("is_milestone", False)),
        notes=a.get("notes"),
    )
