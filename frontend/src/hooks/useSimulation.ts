import { useState, useCallback } from 'react';
import { api } from '../lib/api';
import type { SimulationConfig, SimulationResult, UncertaintyRange } from '../types/risk';

export function useSimulation() {
  const [defaults, setDefaults] = useState<UncertaintyRange[]>([]);
  const [result, setResult] = useState<SimulationResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [loadingDefaults, setLoadingDefaults] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadDefaults = useCallback(async (projectId: string) => {
    setLoadingDefaults(true);
    setError(null);
    try {
      const raw = await api.getRiskDefaults(projectId) as UncertaintyRange[] | { ranges: UncertaintyRange[] };
      const data = Array.isArray(raw) ? raw : (raw as { ranges: UncertaintyRange[] }).ranges;
      setDefaults(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load risk defaults');
    } finally {
      setLoadingDefaults(false);
    }
  }, []);

  const runSimulation = useCallback(async (projectId: string, ranges: UncertaintyRange[]) => {
    setLoading(true);
    setError(null);
    try {
      const config: SimulationConfig = {
        project_id: projectId,
        iterations: 10000,
        ranges,
      };
      const data = await api.simulate(config) as SimulationResult;
      setResult(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Simulation failed');
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    defaults,
    result,
    loading,
    loadingDefaults,
    error,
    loadDefaults,
    runSimulation,
  };
}
