from fastapi import APIRouter, HTTPException, Request, Body
from typing import List
import copy

from app.services.project_store import get_project, set_project
from app.services.cpm_engine import apply_cpm_to_project
from app.models.schedule import Activity, Dependency
from app.cache.cache_manager import cache

router = APIRouter()


@router.post("/chat")
async def chat(request: Request, body: dict = Body(...)):
    project_id = body.get("project_id", "")
    message = body.get("message", "").strip()
    history = body.get("history", [])  # list of {role, content}

    sid = request.headers.get("x-session-id", "")
    project = get_project(project_id, sid)
    if project is None:
        raise HTTPException(status_code=404, detail=f"Project '{project_id}' not found")
    if not message:
        raise HTTPException(status_code=400, detail="message is required")

    client_ip = request.client.host if request.client else "unknown"
    if not cache.check_rate_limit(client_ip):
        raise HTTPException(
            status_code=429,
            detail="Rate limit reached. This is a demo — for the full experience, reach out to the Karmen team!",
        )

    from app.services.llm_service import chat_with_schedule

    result = await chat_with_schedule(
        project.model_dump(mode="json"),
        message,
        history[-10:],  # last 10 messages for context
    )

    response_type = result.get("type", "answer")

    if response_type == "edit":
        # Apply mutations and re-run CPM
        from app.routes.schedule import _parse_single_activity
        project_copy = copy.deepcopy(project)
        mutations = result.get("mutations", [])
        diff = []
        act_map = {a.id: a for a in project_copy.activities}

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
                    project_copy.activities.append(new_act)
                    act_map[new_act.id] = new_act
                    diff.append({"type": "add_activity", "activity_id": new_act.id})
            elif mut_type == "remove_activity":
                aid = mut.get("activity_id")
                if aid in act_map:
                    project_copy.activities = [a for a in project_copy.activities if a.id != aid]
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

        project_copy = apply_cpm_to_project(project_copy)
        set_project(project_copy.id, project_copy, sid)

        return {
            "type": "edit",
            "content": result.get("summary", "Schedule updated."),
            "project": project_copy.model_dump(mode="json"),
            "diff": diff,
        }

    # Plain answer
    return {
        "type": "answer",
        "content": result.get("content", "I couldn't generate a response. Please try again."),
    }
