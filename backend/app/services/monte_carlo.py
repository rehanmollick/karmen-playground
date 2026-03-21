import numpy as np
from scipy.stats import spearmanr
from datetime import date, timedelta
from typing import List, Dict
import time

from app.models.risk import (
    SimulationConfig,
    SimulationResult,
    UncertaintyRange,
    DistributionBucket,
    SensitivityItem,
)
from app.models.schedule import Project


def pert_sample(
    optimistic: float, most_likely: float, pessimistic: float, size: int
) -> np.ndarray:
    """Sample from a PERT (Beta) distribution."""
    if pessimistic <= optimistic:
        return np.full(size, most_likely, dtype=float)
    alpha = 1.0 + 4.0 * (most_likely - optimistic) / (pessimistic - optimistic)
    beta_p = 1.0 + 4.0 * (pessimistic - most_likely) / (pessimistic - optimistic)
    samples = np.random.beta(alpha, beta_p, size)
    return optimistic + samples * (pessimistic - optimistic)


def _forward_pass_fast(
    activities_data: List[Dict],
    duration_samples: Dict[str, np.ndarray],
    iterations: int,
) -> np.ndarray:
    """
    Vectorised forward pass across all iterations simultaneously.
    Activities must already be in topological order.
    """
    es: Dict[str, np.ndarray] = {}  # early start per iteration
    ef: Dict[str, np.ndarray] = {}  # early finish per iteration

    zeros = np.zeros(iterations)

    for act in activities_data:
        act_id = act["id"]
        dur = duration_samples.get(act_id, zeros)
        preds = act.get("predecessors", [])

        if not preds:
            es[act_id] = zeros.copy()
        else:
            max_ef = zeros.copy()
            for dep in preds:
                pred_id = dep["predecessor_id"]
                lag = float(dep.get("lag_days", 0))
                dep_type = dep.get("type", "FS")
                if pred_id not in ef:
                    continue
                if dep_type == "FS":
                    candidate = ef[pred_id] + lag
                elif dep_type == "SS":
                    candidate = es[pred_id] + lag
                else:
                    candidate = ef[pred_id] + lag
                max_ef = np.maximum(max_ef, candidate)
            es[act_id] = max_ef

        ef[act_id] = es[act_id] + dur

    if not ef:
        return zeros.copy()

    end = np.zeros(iterations)
    for v in ef.values():
        end = np.maximum(end, v)
    return end


def run_simulation(project: Project, config: SimulationConfig) -> SimulationResult:
    t0 = time.time()
    iterations = config.iterations
    np.random.seed(None)

    ranges_map: Dict[str, UncertaintyRange] = {r.activity_id: r for r in config.ranges}

    # Pre-generate duration samples for every activity
    all_samples: Dict[str, np.ndarray] = {}
    for act in project.activities:
        if act.id in ranges_map:
            r = ranges_map[act.id]
            all_samples[act.id] = pert_sample(
                r.optimistic_days, r.most_likely_days, r.pessimistic_days, iterations
            )
        else:
            all_samples[act.id] = np.full(iterations, float(act.duration_days))

    # Build activities_data (topological order preserved from seed)
    activities_data = [
        {
            "id": a.id,
            "predecessors": [
                {
                    "predecessor_id": d.predecessor_id,
                    "type": d.type,
                    "lag_days": d.lag_days,
                }
                for d in a.predecessors
            ],
        }
        for a in project.activities
    ]

    end_dates = _forward_pass_fast(activities_data, all_samples, iterations)

    p50 = float(np.percentile(end_dates, 50))
    p80 = float(np.percentile(end_dates, 80))
    p95 = float(np.percentile(end_dates, 95))

    ps = project.start_date

    # Build histogram
    min_d = int(np.min(end_dates))
    max_d = int(np.max(end_dates))
    n_bins = min(30, max(1, max_d - min_d + 1))
    counts, bin_edges = np.histogram(end_dates, bins=n_bins)

    distribution: List[DistributionBucket] = []
    cumulative = 0
    total = len(end_dates)
    for i, cnt in enumerate(counts):
        bin_date = ps + timedelta(days=int(bin_edges[i]))
        cumulative += int(cnt)
        distribution.append(
            DistributionBucket(
                date=bin_date,
                count=int(cnt),
                cumulative_probability=round(cumulative / total, 4),
            )
        )

    # Spearman sensitivity
    sensitivity: List[SensitivityItem] = []
    for act in project.activities:
        if act.id in ranges_map:
            samp = all_samples[act.id]
            if np.std(samp) > 0:
                corr, _ = spearmanr(samp, end_dates)
                if not np.isnan(corr):
                    sensitivity.append(
                        SensitivityItem(
                            activity_id=act.id,
                            activity_name=act.name,
                            correlation=round(float(corr), 3),
                        )
                    )

    sensitivity.sort(key=lambda x: abs(x.correlation), reverse=True)

    return SimulationResult(
        p50_date=ps + timedelta(days=int(p50)),
        p80_date=ps + timedelta(days=int(p80)),
        p95_date=ps + timedelta(days=int(p95)),
        deterministic_date=project.project_end_date or ps,
        completion_distribution=distribution,
        sensitivity=sensitivity[:15],
        total_iterations=iterations,
        execution_time_ms=int((time.time() - t0) * 1000),
    )
