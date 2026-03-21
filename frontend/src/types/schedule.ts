export interface Dependency {
  predecessor_id: string;
  type: 'FS' | 'SS' | 'FF' | 'SF';
  lag_days: number;
}

export interface Activity {
  id: string;
  name: string;
  wbs_id: string;
  duration_days: number;
  start_date: string | null;
  end_date: string | null;
  predecessors: Dependency[];
  resource: string | null;
  is_milestone: boolean;
  is_critical: boolean;
  early_start: string | null;
  early_finish: string | null;
  late_start: string | null;
  late_finish: string | null;
  total_float: number | null;
  notes: string | null;
}

export interface WBSNode {
  id: string;
  name: string;
  parent_id: string | null;
  children: WBSNode[];
  activities: string[];
}

export interface Project {
  id: string;
  name: string;
  description: string;
  project_type: string;
  start_date: string;
  wbs: WBSNode[];
  activities: Activity[];
  critical_path: string[];
  project_duration_days: number;
  project_end_date: string | null;
}

export interface ProjectSummary {
  id: string;
  name: string;
  description: string;
  activity_count: number;
  duration_days: number;
  project_type: string;
}
