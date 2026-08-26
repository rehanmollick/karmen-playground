from datetime import date

from app.models.schedule import Activity, Dependency, Project
from app.services.cpm_engine import compute_cpm, apply_cpm_to_project

START = date(2026, 1, 1)


def act(id, dur, preds=None):
    return Activity(
        id=id,
        name=id,
        wbs_id="1",
        duration_days=dur,
        predecessors=[Dependency(**p) for p in (preds or [])],
    )


def fs(pred, lag=0):
    return {"predecessor_id": pred, "type": "FS", "lag_days": lag}


def test_fs_chain():
    result = compute_cpm([act("A", 3), act("B", 2, [fs("A")])], START)
    assert result["project_duration"] == 5
    assert result["critical_path"] == ["A", "B"]
    a, b = result["activities"]
    assert a.early_start == START
    assert a.early_finish == date(2026, 1, 4)
    assert b.early_start == date(2026, 1, 4)
    assert b.early_finish == date(2026, 1, 6)
    assert a.is_critical and b.is_critical


def test_parallel_branch_float():
    # A(5) and B(2) both feed C(2): B has 3 days of float, A drives.
    acts = [act("A", 5), act("B", 2), act("C", 2, [fs("A"), fs("B")])]
    result = compute_cpm(acts, START)
    assert result["project_duration"] == 7
    assert result["critical_path"] == ["A", "C"]
    by_id = {a.id: a for a in result["activities"]}
    assert by_id["B"].total_float == 3
    assert not by_id["B"].is_critical


def test_fs_lag():
    # 2-day lag (e.g. concrete cure) pushes the successor.
    result = compute_cpm([act("A", 3), act("B", 1, [fs("A", lag=2)])], START)
    assert result["project_duration"] == 6


def test_ss_with_lag():
    # B can start 2 days after A starts; A still governs the finish.
    acts = [act("A", 10), act("B", 5, [{"predecessor_id": "A", "type": "SS", "lag_days": 2}])]
    result = compute_cpm(acts, START)
    by_id = {a.id: a for a in result["activities"]}
    assert by_id["B"].early_start == date(2026, 1, 3)
    assert result["project_duration"] == 10
    assert result["critical_path"] == ["A"]


def test_ff_link():
    # B must finish when A finishes: B's start is derived by subtracting
    # its own duration from the finish constraint.
    acts = [act("A", 10), act("B", 3, [{"predecessor_id": "A", "type": "FF", "lag_days": 0}])]
    result = compute_cpm(acts, START)
    by_id = {a.id: a for a in result["activities"]}
    assert by_id["B"].early_start == date(2026, 1, 8)
    assert by_id["B"].early_finish == date(2026, 1, 11)
    assert result["project_duration"] == 10
    assert by_id["A"].is_critical and by_id["B"].is_critical


def test_sf_link():
    acts = [act("A", 4), act("B", 3, [{"predecessor_id": "A", "type": "SF", "lag_days": 5}])]
    result = compute_cpm(acts, START)
    by_id = {a.id: a for a in result["activities"]}
    # B must finish 5 days after A starts: ef = 0 + 5, so es = 2.
    assert by_id["B"].early_start == date(2026, 1, 3)
    assert by_id["B"].early_finish == date(2026, 1, 6)


def test_cycle_returns_safe_result():
    acts = [act("A", 3, [fs("B")]), act("B", 2, [fs("A")])]
    result = compute_cpm(acts, START)
    assert result["critical_path"] == []
    assert result["project_duration"] == 0


def test_dangling_predecessor_ignored():
    # An LLM can reference an activity it never emitted; that must not crash
    # or leave a phantom node in the graph.
    acts = [act("A", 3), act("B", 2, [fs("A"), fs("GHOST")])]
    result = compute_cpm(acts, START)
    assert result["project_duration"] == 5
    assert result["critical_path"] == ["A", "B"]


def test_apply_cpm_to_project():
    project = Project(
        id="p1",
        name="Test",
        description="",
        start_date=START,
        activities=[act("A", 3), act("B", 2, [fs("A")])],
    )
    project = apply_cpm_to_project(project)
    assert project.project_duration_days == 5
    assert project.project_end_date == date(2026, 1, 6)
    assert project.critical_path == ["A", "B"]
