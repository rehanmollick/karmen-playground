import copy
from typing import List
from app.models.schedule import Project, Activity, Dependency
from app.models.change_order import Fragnet, ImpactAnalysis
from app.services.cpm_engine import compute_cpm


def apply_fragnet(project: Project, fragnet: Fragnet) -> Project:
    """Deep-copy project, insert fragnet activities/changes, re-run CPM."""
    modified = copy.deepcopy(project)

    existing_ids = {a.id for a in modified.activities}

    # Add new activities
    for new_act in fragnet.new_activities:
        if new_act.id not in existing_ids:
            modified.activities.append(new_act)

    # Apply duration modifications
    act_map = {a.id: a for a in modified.activities}
    for delta in fragnet.modified_activities:
        if delta.activity_id in act_map:
            act_map[delta.activity_id].duration_days = delta.new_duration

    # Add new dependencies
    for dep in fragnet.new_dependencies:
        if dep.predecessor_id in act_map:
            # Find the activity this dep points TO and add it
            # The dep object itself is a predecessor dep — we need to know which activity it belongs to
            pass  # New deps handled via new_activity predecessors

    # Remove dependencies
    removed_set = set(fragnet.removed_dependencies)
    if removed_set:
        for act in modified.activities:
            act.predecessors = [
                d for d in act.predecessors if d.predecessor_id not in removed_set
            ]

    # Re-run CPM
    result = compute_cpm(modified.activities, modified.start_date)
    modified.activities = result["activities"]
    modified.critical_path = result["critical_path"]
    modified.project_duration_days = result["project_duration"]
    modified.project_end_date = result["project_end_date"]

    return modified


def compute_impact(
    original: Project,
    modified: Project,
    narrative: str,
    citations: List[str],
    fragnet: Fragnet,
) -> ImpactAnalysis:
    original_end = original.project_end_date or original.start_date
    modified_end = modified.project_end_date or original.start_date
    delay = (modified_end - original_end).days

    return ImpactAnalysis(
        original_end_date=original_end,
        impacted_end_date=modified_end,
        delay_days=delay,
        original_critical_path=original.critical_path,
        new_critical_path=modified.critical_path,
        narrative=narrative,
        citations=citations,
        new_activities_count=len(fragnet.new_activities),
        modified_activities_count=len(fragnet.modified_activities),
    )
