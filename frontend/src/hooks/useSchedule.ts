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
    // The backend sleeps on the free tier; a cold start can briefly return an
    // error before it's ready, so retry a few times before giving up.
    const maxAttempts = 5;
    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      try {
        const data = await api.getProjects() as ProjectSummary[];
        setProjects(data);
        setLoading(false);
        return;
      } catch (err) {
        if (attempt === maxAttempts) {
          setError(err instanceof Error ? err.message : 'Failed to load projects');
          setLoading(false);
          return;
        }
        await new Promise((r) => setTimeout(r, 3000));
      }
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
      // Non-critical: active project data is already displayed, refresh is best-effort
    }
  }, [activeProject]);

  const clearProject = useCallback(async () => {
    setActiveProject(null);
    setError(null);
    // Re-fetch project list so any AI-generated projects show up
    try {
      const data = await api.getProjects() as ProjectSummary[];
      setProjects(data);
    } catch {
      // Non-critical: existing project list remains valid
    }
  }, []);

  const overrideActiveProject = useCallback((project: Project) => {
    setActiveProject(project);
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
    overrideActiveProject,
  };
}
