import networkx as nx
from datetime import date, timedelta
from typing import List, Dict, Any

from app.models.schedule import Activity, Project


def compute_cpm(activities: List[Activity], project_start: date) -> Dict[str, Any]:
    """
    Full CPM forward/backward pass using NetworkX.
    Returns updated activities with computed dates + critical path list.
    """
    G = nx.DiGraph()

    for act in activities:
        G.add_node(act.id, duration=float(act.duration_days))

    for act in activities:
        for dep in act.predecessors:
            G.add_edge(
                dep.predecessor_id,
                act.id,
                dep_type=dep.type,
                lag=float(dep.lag_days),
            )

    # Remove edges to non-existent nodes
    valid_ids = {a.id for a in activities}
    bad_edges = [(u, v) for u, v in G.edges() if u not in valid_ids or v not in valid_ids]
    G.remove_edges_from(bad_edges)

    try:
        order = list(nx.topological_sort(G))
    except nx.NetworkXUnfeasible:
        return {
            "activities": activities,
            "critical_path": [],
            "project_duration": 0,
            "project_end_date": project_start,
        }

    # Forward pass
    es: Dict[str, float] = {}
    ef: Dict[str, float] = {}

    for node in order:
        preds = list(G.predecessors(node))
        dur = G.nodes[node]["duration"]
        if not preds:
            es[node] = 0.0
        else:
            candidates = []
            for p in preds:
                edge = G.edges[p, node]
                dep_type = edge.get("dep_type", "FS")
                lag = edge.get("lag", 0.0)
                if dep_type == "FS":
                    candidates.append(ef[p] + lag)
                elif dep_type == "SS":
                    candidates.append(es[p] + lag)
                elif dep_type == "FF":
                    candidates.append(ef[p] + lag - dur)
                elif dep_type == "SF":
                    candidates.append(es[p] + lag - dur)
                else:
                    candidates.append(ef[p] + lag)
            es[node] = max(candidates)
        ef[node] = es[node] + dur

    if not ef:
        return {
            "activities": activities,
            "critical_path": [],
            "project_duration": 0,
            "project_end_date": project_start,
        }

    project_duration = max(ef.values())

    # Backward pass
    ls: Dict[str, float] = {}
    lf: Dict[str, float] = {}

    for node in reversed(order):
        succs = list(G.successors(node))
        dur = G.nodes[node]["duration"]
        if not succs:
            lf[node] = project_duration
        else:
            candidates = []
            for s in succs:
                edge = G.edges[node, s]
                dep_type = edge.get("dep_type", "FS")
                lag = edge.get("lag", 0.0)
                if dep_type == "FS":
                    candidates.append(ls[s] - lag)
                elif dep_type == "SS":
                    candidates.append(ls[s] - lag + dur)
                elif dep_type == "FF":
                    candidates.append(lf[s] - lag)
                elif dep_type == "SF":
                    candidates.append(lf[s] - lag + dur)
                else:
                    candidates.append(ls[s] - lag)
            lf[node] = min(candidates)
        ls[node] = lf[node] - dur

    critical_path = [n for n in order if abs(ls[n] - es[n]) < 0.01]

    for act in activities:
        if act.id in es:
            act.early_start = project_start + timedelta(days=int(round(es[act.id])))
            act.early_finish = project_start + timedelta(days=int(round(ef[act.id])))
            act.late_start = project_start + timedelta(days=int(round(ls[act.id])))
            act.late_finish = project_start + timedelta(days=int(round(lf[act.id])))
            act.total_float = int(round(ls[act.id] - es[act.id]))
            act.is_critical = act.total_float == 0
            act.start_date = act.early_start
            act.end_date = act.early_finish

    return {
        "activities": activities,
        "critical_path": critical_path,
        "project_duration": int(round(project_duration)),
        "project_end_date": project_start + timedelta(days=int(round(project_duration))),
    }


def apply_cpm_to_project(project: Project) -> Project:
    result = compute_cpm(project.activities, project.start_date)
    project.activities = result["activities"]
    project.critical_path = result["critical_path"]
    project.project_duration_days = result["project_duration"]
    project.project_end_date = result["project_end_date"]
    return project
