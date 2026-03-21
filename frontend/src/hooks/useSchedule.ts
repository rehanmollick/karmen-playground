import { useState, useCallback } from 'react';
import { api } from '../lib/api';
import type { Project, ProjectSummary } from '../types/schedule';

export function useSchedule() {
  const [projects, setProjects] = useState<ProjectSummary[]>([]);
  const [activeProject, setActiveProject] = useState<Project | null>(null);
  const [loading, setLoading] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadProjects = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await api.getProjects() as ProjectSummary[];
      setProjects(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load projects');
    } finally {
      setLoading(false);
    }
  }, []);

  const selectProject = useCallback(async (projectId: string) => {
    setLoading(true);
    setError(null);
    try {
      const data = await api.getProject(projectId) as Project;
      setActiveProject(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load project');
    } finally {
      setLoading(false);
    }
  }, []);

  const generateSchedule = useCallback(async (scopeText: string, projectType: string) => {
    setGenerating(true);
    setError(null);
    try {
      const data = await api.generateSchedule(scopeText, projectType) as Project;
      setActiveProject(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to generate schedule');
    } finally {
      setGenerating(false);
    }
  }, []);

  const refreshProject = useCallback(async () => {
    if (!activeProject) return;
    try {
      const data = await api.getProject(activeProject.id) as Project;
      setActiveProject(data);
    } catch {
      // silently fail on refresh
    }
  }, [activeProject]);

  const clearProject = useCallback(() => {
    setActiveProject(null);
    setError(null);
  }, []);

  return {
    projects,
    activeProject,
    loading,
    generating,
    error,
    loadProjects,
    selectProject,
    generateSchedule,
    refreshProject,
    clearProject,
  };
}
