from fastapi import APIRouter, HTTPException

from app.models.risk import SimulationConfig, SimulationResult, UncertaintyRange
from app.services.monte_carlo import run_simulation
from app.services.project_store import get_project

router = APIRouter()


@router.post("/risk/simulate", response_model=SimulationResult)
async def simulate_risk(config: SimulationConfig):
    project = get_project(config.project_id)
    if project is None:
        raise HTTPException(status_code=404, detail=f"Project '{config.project_id}' not found")
    return run_simulation(project, config)


@router.get("/risk/defaults/{project_id}")
async def get_risk_defaults(project_id: str):
    project = get_project(project_id)
    if project is None:
        raise HTTPException(status_code=404, detail=f"Project '{project_id}' not found")
    critical_set = set(project.critical_path)

    critical_acts = [a for a in project.activities if a.id in critical_set and not a.is_milestone]
    non_critical_acts = [a for a in project.activities if a.id not in critical_set and not a.is_milestone]

    selected = critical_acts[:8] + non_critical_acts[:4]
    selected = selected[:12]

    ranges = []
    for act in selected:
        d = act.duration_days
        if act.id in critical_set:
            opt = max(1, int(d * 0.80))
            pess = int(d * 1.40)
        else:
            opt = max(1, int(d * 0.85))
            pess = int(d * 1.25)
        ranges.append(
            UncertaintyRange(
                activity_id=act.id,
                optimistic_days=opt,
                most_likely_days=d,
                pessimistic_days=pess,
                distribution="pert",
            )
        )

    return {"ranges": [r.model_dump() for r in ranges], "project_id": project_id}
