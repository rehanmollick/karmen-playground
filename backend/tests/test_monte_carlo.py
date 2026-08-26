from datetime import date, timedelta

import numpy as np

from app.models.risk import SimulationConfig, UncertaintyRange
from app.models.schedule import Activity, Dependency, Project
from app.services.monte_carlo import pert_sample, run_simulation

START = date(2026, 1, 1)


def act(id, dur, preds=None):
    return Activity(
        id=id,
        name=id,
        wbs_id="1",
        duration_days=dur,
        predecessors=[Dependency(**p) for p in (preds or [])],
    )


def project(activities):
    return Project(id="p1", name="Test", description="", start_date=START, activities=activities)


def config(ranges, iterations=2000):
    return SimulationConfig(project_id="p1", iterations=iterations, ranges=ranges)


def test_pert_sample_stats():
    np.random.seed(42)
    o, m, p = 2, 5, 14
    samples = pert_sample(o, m, p, 20000)
    assert samples.min() >= o and samples.max() <= p
    # PERT mean = (o + 4m + p) / 6
    assert abs(samples.mean() - (o + 4 * m + p) / 6) < 0.1


def test_pert_sample_degenerate_range():
    samples = pert_sample(5, 5, 5, 100)
    assert np.all(samples == 5)


def test_zero_variance_matches_deterministic():
    # No uncertainty ranges: every percentile must equal the CPM end date.
    proj = project([act("A", 3), act("B", 2, [{"predecessor_id": "A", "type": "FS", "lag_days": 0}])])
    result = run_simulation(proj, config([], iterations=500))
    expected = START + timedelta(days=5)
    assert result.p50_date == expected
    assert result.p80_date == expected
    assert result.p95_date == expected


def test_ff_link_matches_deterministic():
    # FF must not fall back to FS: B finishing with A keeps the project at
    # 10 days, not 13.
    proj = project([act("A", 10), act("B", 3, [{"predecessor_id": "A", "type": "FF", "lag_days": 0}])])
    result = run_simulation(proj, config([], iterations=500))
    assert result.p50_date == START + timedelta(days=10)


def test_out_of_order_activities():
    # Successor listed before its predecessor: the forward pass must sort,
    # not silently drop the dependency.
    proj = project([
        act("B", 2, [{"predecessor_id": "A", "type": "FS", "lag_days": 0}]),
        act("A", 3),
    ])
    result = run_simulation(proj, config([], iterations=500))
    assert result.p50_date == START + timedelta(days=5)


def test_percentiles_ordered_and_sensitivity_ranked():
    proj = project([act("A", 10), act("B", 5, [{"predecessor_id": "A", "type": "FS", "lag_days": 0}])])
    ranges = [
        UncertaintyRange(activity_id="A", optimistic_days=8, most_likely_days=10, pessimistic_days=20),
        UncertaintyRange(activity_id="B", optimistic_days=4, most_likely_days=5, pessimistic_days=7),
    ]
    result = run_simulation(proj, config(ranges, iterations=4000))
    assert result.p50_date <= result.p80_date <= result.p95_date
    assert result.total_iterations == 4000
    # Both varied activities are on the single path; the wider range (A)
    # should dominate the Spearman ranking.
    assert result.sensitivity
    assert result.sensitivity[0].activity_id == "A"


def test_distribution_cumulative_reaches_one():
    proj = project([act("A", 10)])
    ranges = [UncertaintyRange(activity_id="A", optimistic_days=8, most_likely_days=10, pessimistic_days=15)]
    result = run_simulation(proj, config(ranges, iterations=2000))
    assert result.completion_distribution
    assert abs(result.completion_distribution[-1].cumulative_probability - 1.0) < 1e-6
