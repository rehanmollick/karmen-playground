from fastapi import APIRouter, HTTPException, Request, Body
from typing import List
import copy

from app.services.project_store import get_project, set_project
from app.services.cpm_engine import apply_cpm_to_project
from app.services.mutations import apply_mutations
from app.cache.cache_manager import cache, client_ip

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

    if not cache.check_rate_limit(client_ip(request)):
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
        project_copy = copy.deepcopy(project)
        diff = apply_mutations(project_copy, result.get("mutations", []))
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
