export interface UncertaintyRange {
  activity_id: string;
  optimistic_days: number;
  most_likely_days: number;
  pessimistic_days: number;
  distribution: 'pert' | 'triangular' | 'uniform';
}

export interface SimulationConfig {
  project_id: string;
  iterations: number;
  ranges: UncertaintyRange[];
}

export interface DistributionBucket {
  date: string;
  count: number;
  cumulative_probability: number;
}

export interface SensitivityItem {
  activity_id: string;
  activity_name: string;
  correlation: number;
}

export interface SimulationResult {
  p50_date: string;
  p80_date: string;
  p95_date: string;
  deterministic_date: string;
  completion_distribution: DistributionBucket[];
  sensitivity: SensitivityItem[];
  total_iterations: number;
  execution_time_ms: number;
}
