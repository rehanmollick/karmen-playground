"""Parsing and mutation helpers shared by the schedule and chat routes.

The LLM returns plain dicts; these helpers turn them into validated models
and apply typed mutations to a project, returning a diff log.
"""
from typing import List

from app.models.schedule import Activity, Dependency, Project, WBSNode


def parse_wbs(nodes_data: list) -> List[WBSNode]:
    out = []
    for nd in nodes_data:
        out.append(
            WBSNode(
                id=str(nd.get("id", "")),
                name=nd.get("name", ""),
                parent_id=nd.get("parent_id"),
                children=parse_wbs(nd.get("children", [])),
                activities=nd.get("activities", []),
            )
        )
    return out


def parse_activities(acts_data: list) -> List[Activity]:
    return [parse_single_activity(a) for a in acts_data]


def parse_single_activity(a: dict) -> Activity:
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


def apply_mutations(project: Project, mutations: list) -> list:
    """Apply LLM-produced mutations to a project in place. Unknown types and
    references to missing activities are skipped. Returns a diff log."""
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
                new_act = parse_single_activity(act_data)
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

    return diff
