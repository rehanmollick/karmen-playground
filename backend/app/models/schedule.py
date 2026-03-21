from pydantic import BaseModel
from typing import Optional, Literal, List
from datetime import date


class Dependency(BaseModel):
    predecessor_id: str
    type: Literal["FS", "SS", "FF", "SF"] = "FS"
    lag_days: int = 0


class Activity(BaseModel):
    id: str
    name: str
    wbs_id: str
    duration_days: int
    start_date: Optional[date] = None
    end_date: Optional[date] = None
    predecessors: List[Dependency] = []
    resource: Optional[str] = None
    is_milestone: bool = False
    is_critical: bool = False
    early_start: Optional[date] = None
    early_finish: Optional[date] = None
    late_start: Optional[date] = None
    late_finish: Optional[date] = None
    total_float: Optional[int] = None
    notes: Optional[str] = None


class WBSNode(BaseModel):
    id: str
    name: str
    parent_id: Optional[str] = None
    children: List["WBSNode"] = []
    activities: List[str] = []


WBSNode.model_rebuild()


class Project(BaseModel):
    id: str
    name: str
    description: str
    project_type: str = "residential"
    start_date: date
    wbs: List[WBSNode] = []
    activities: List[Activity] = []
    critical_path: List[str] = []
    project_duration_days: int = 0
    project_end_date: Optional[date] = None


class ProjectSummary(BaseModel):
    id: str
    name: str
    description: str
    activity_count: int
    duration_days: int
    project_type: str
