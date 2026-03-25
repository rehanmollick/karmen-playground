import type { SimulationConfig } from '../types/risk';

const API_URL =
  typeof window !== 'undefined'
    ? process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'
    : process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

function getSessionId(): string {
  if (typeof window === 'undefined') return '';
  let id = localStorage.getItem('karmen_session_id');
  if (!id) {
    id = crypto.randomUUID();
    localStorage.setItem('karmen_session_id', id);
  }
  return id;
}

export async function apiFetch<T = unknown>(
  path: string,
  options?: RequestInit
): Promise<T> {
  const sessionId = getSessionId();
  const res = await fetch(`${API_URL}${path}`, {
    headers: {
      'Content-Type': 'application/json',
      ...(sessionId ? { 'X-Session-ID': sessionId } : {}),
      ...options?.headers,
    },
    ...options,
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: res.statusText }));
    throw new Error((err as { detail?: string }).detail || `API ${res.status}`);
  }
  return res.json() as Promise<T>;
}

export const api = {
  getProjects: () => apiFetch('/api/projects'),
  getProject: (id: string) => apiFetch(`/api/projects/${id}`),
  generateSchedule: (scopeText: string, projectType: string) =>
    apiFetch('/api/schedule/generate', {
      method: 'POST',
      body: JSON.stringify({ scope_text: scopeText, project_type: projectType }),
    }),
  editSchedule: (projectId: string, instruction: string) =>
    apiFetch('/api/schedule/edit', {
      method: 'POST',
      body: JSON.stringify({ project_id: projectId, instruction }),
    }),
  getChangeOrders: (projectId: string) =>
    apiFetch(`/api/projects/${projectId}/change-orders`),
  analyzeChangeOrder: (projectId: string, changeOrderId: string) =>
    apiFetch('/api/change-order/analyze', {
      method: 'POST',
      body: JSON.stringify({ project_id: projectId, change_order_id: changeOrderId }),
    }),
  getRiskDefaults: (projectId: string) =>
    apiFetch(`/api/risk/defaults/${projectId}`),
  simulate: (config: SimulationConfig) =>
    apiFetch('/api/risk/simulate', {
      method: 'POST',
      body: JSON.stringify(config),
    }),
  updateProject: (projectId: string, projectData: unknown) =>
    apiFetch(`/api/projects/${projectId}`, {
      method: 'PATCH',
      body: JSON.stringify(projectData),
    }),
  analyzeCustomChangeOrder: (projectId: string, name: string, description: string, source: string) =>
    apiFetch('/api/change-order/custom', {
      method: 'POST',
      body: JSON.stringify({ project_id: projectId, name, description, source }),
    }),
  chat: (projectId: string, message: string, history: Array<{ role: string; content: string }>) =>
    apiFetch('/api/chat', {
      method: 'POST',
      body: JSON.stringify({ project_id: projectId, message, history }),
    }),
  exportXmlUrl: (projectId: string) =>
    `${API_URL}/api/export/${projectId}?session_id=${getSessionId()}`,
};
