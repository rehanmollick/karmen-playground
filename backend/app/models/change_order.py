from pydantic import BaseModel
from typing import Optional, Literal, List
from datetime import date
from app.models.schedule import Activity, Dependency


class ActivityDelta(BaseModel):
    activity_id: str
    old_duration: int
    new_duration: int
    reason: str


class Fragnet(BaseModel):
    new_activities: List[Activity] = []
    modified_activities: List[ActivityDelta] = []
    new_dependencies: List[Dependency] = []
    removed_dependencies: List[str] = []


class ChangeOrder(BaseModel):
    id: str
    project_id: str
    name: str
    description: str
    source: Literal["Owner Directive", "Field Condition", "Design Error", "Regulatory"] = "Owner Directive"
    affected_activities: List[str] = []
    fragnet: Optional[Fragnet] = None


class ImpactAnalysis(BaseModel):
    original_end_date: date
    impacted_end_date: date
    delay_days: int
    original_critical_path: List[str]
    new_critical_path: List[str]
    narrative: str
    citations: List[str] = []
    new_activities_count: int = 0
    modified_activities_count: int = 0
