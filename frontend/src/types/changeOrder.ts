import type { Activity, Dependency, Project } from './schedule';

export interface ActivityDelta {
  activity_id: string;
  old_duration: number;
  new_duration: number;
  reason: string;
}

export interface Fragnet {
  new_activities: Activity[];
  modified_activities: ActivityDelta[];
  new_dependencies: Dependency[];
  removed_dependencies: string[];
}

export interface ChangeOrder {
  id: string;
  project_id: string;
  name: string;
  description: string;
  source: 'Owner Directive' | 'Field Condition' | 'Design Error' | 'Regulatory';
  affected_activities: string[];
  fragnet: Fragnet | null;
}

export interface ImpactAnalysis {
  original_end_date: string;
  impacted_end_date: string;
  delay_days: number;
  original_critical_path: string[];
  new_critical_path: string[];
  narrative: string;
  citations: string[];
  new_activities_count: number;
  modified_activities_count: number;
}

export interface AnalysisResult {
  impact: ImpactAnalysis;
  modified_project: Project;
  original_project: Project;
}
