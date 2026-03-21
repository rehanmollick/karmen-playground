from fastapi import APIRouter, HTTPException, Request, Body
from typing import List
import json

from app.models.change_order import ChangeOrder, ImpactAnalysis, Fragnet, ActivityDelta
from app.models.schedule import Activity, Dependency
from app.services.fragnet_engine import apply_fragnet, compute_impact
from app.cache.cache_manager import cache

router = APIRouter()

_change_orders: dict = {}


def _load_change_orders():
    import os

    fp = os.path.join(os.path.dirname(__file__), "..", "seed_data", "change_orders.json")
    if os.path.exists(fp):
        with open(fp) as f:
            data = json.load(f)
        for co_data in data:
            try:
                co = ChangeOrder(**co_data)
                _change_orders[co.id] = co
            except Exception as e:
                print(f"Warning: could not load CO {co_data.get('id')}: {e}")


try:
    _load_change_orders()
except Exception as e:
    print(f"Warning: change order load failed: {e}")


@router.get("/projects/{project_id}/change-orders", response_model=List[ChangeOrder])
async def get_change_orders(project_id: str):
    return [co for co in _change_orders.values() if co.project_id == project_id]


@router.post("/change-order/analyze")
async def analyze_change_order(request: Request, body: dict = Body(...)):
    project_id = body.get("project_id", "")
    co_id = body.get("change_order_id", "")

    from app.routes.schedule import _projects

    if project_id not in _projects:
        raise HTTPException(status_code=404, detail=f"Project '{project_id}' not found")
    if co_id not in _change_orders:
        raise HTTPException(status_code=404, detail=f"Change order '{co_id}' not found")

    project = _projects[project_id]
    co = _change_orders[co_id]

    cache_key = f"co:{project_id}:{co_id}"
    cached = cache.get_by_key(cache_key)
    if cached:
        return cached

    client_ip = request.client.host if request.client else "unknown"

    if co.fragnet:
        fragnet = co.fragnet
        new_count = len(fragnet.new_activities)
        mod_count = len(fragnet.modified_activities)
        narrative = (
            f"The {co.name} change order impacts the project schedule. "
            f"This {co.source.lower()} introduces {new_count} new activit{'y' if new_count == 1 else 'ies'} "
            f"and modifies the duration of {mod_count} existing activit{'y' if mod_count == 1 else 'ies'}, "
            f"extending the affected work packages. The fragnet analysis shows the direct time impact "
            f"on successor activities through the critical path. Contractors should review the updated "
            f"schedule and assess float consumption on affected activities."
        )
        citations = [
            f"Change Order Source: {co.source}",
            f"Change Order: {co.name}",
            f"Description: {co.description[:120]}",
        ]
    else:
        if not cache.check_rate_limit(client_ip):
            raise HTTPException(
                status_code=429,
                detail="Rate limit reached. This is a demo — for the full experience, reach out to the Karmen team!",
            )

        from app.services.llm_service import analyze_change_order_llm

        llm_result = await analyze_change_order_llm(
            project.model_dump(mode="json"), co.name, co.description, co.source
        )
        fragnet_data = llm_result.get("fragnet", {})
        narrative = llm_result.get("narrative", "Impact analysis unavailable.")
        citations = llm_result.get("citations", [])

        new_acts = []
        for act_data in fragnet_data.get("new_activities", []):
            preds = [Dependency(**d) for d in act_data.get("predecessors", [])]
            new_acts.append(
                Activity(
                    id=act_data.get("id", ""),
                    name=act_data.get("name", ""),
                    wbs_id=act_data.get("wbs_id", "1.1"),
                    duration_days=act_data.get("duration_days", 5),
                    predecessors=preds,
                    resource=act_data.get("resource"),
                    is_milestone=act_data.get("is_milestone", False),
                )
            )
        modified_acts = [ActivityDelta(**d) for d in fragnet_data.get("modified_activities", [])]
        new_deps = [Dependency(**d) for d in fragnet_data.get("new_dependencies", [])]
        fragnet = Fragnet(
            new_activities=new_acts,
            modified_activities=modified_acts,
            new_dependencies=new_deps,
            removed_dependencies=fragnet_data.get("removed_dependencies", []),
        )

    modified_project = apply_fragnet(project, fragnet)
    impact = compute_impact(project, modified_project, narrative, citations, fragnet)

    result = {
        "impact": impact.model_dump(mode="json"),
        "modified_project": modified_project.model_dump(mode="json"),
        "original_project": project.model_dump(mode="json"),
    }
    cache.set_by_key(cache_key, result)
    return result
