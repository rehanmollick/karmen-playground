from pydantic import BaseModel
from typing import Optional, Literal, List
from datetime import date


class UncertaintyRange(BaseModel):
    activity_id: str
    optimistic_days: int
    most_likely_days: int
    pessimistic_days: int
    distribution: Literal["pert", "triangular", "uniform"] = "pert"


class SimulationConfig(BaseModel):
    project_id: str
    iterations: int = 10000
    ranges: List[UncertaintyRange]


class DistributionBucket(BaseModel):
    date: date
    count: int
    cumulative_probability: float


class SensitivityItem(BaseModel):
    activity_id: str
    activity_name: str
    correlation: float


class SimulationResult(BaseModel):
    p50_date: date
    p80_date: date
    p95_date: date
    deterministic_date: date
    completion_distribution: List[DistributionBucket]
    sensitivity: List[SensitivityItem]
    total_iterations: int
    execution_time_ms: int
