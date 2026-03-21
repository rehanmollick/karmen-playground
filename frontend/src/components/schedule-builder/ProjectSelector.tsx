'use client';

import { useState } from 'react';
import type { ProjectSummary } from '../../types/schedule';

interface ProjectSelectorProps {
  projects: ProjectSummary[];
  onSelect: (projectId: string) => void;
  onGenerate: (scopeText: string, projectType: string) => void;
  isGenerating?: boolean;
}

const PROJECT_ICONS = {
  residential: (
    <svg width="40" height="40" viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M8 20L20 8L32 20V34H26V26H14V34H8V20Z" stroke="var(--blue-primary)" strokeWidth="1.5" fill="var(--blue-light)" />
      <rect x="17" y="26" width="6" height="8" fill="var(--blue-primary)" />
    </svg>
  ),
  commercial: (
    <svg width="40" height="40" viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect x="8" y="10" width="24" height="24" stroke="var(--blue-primary)" strokeWidth="1.5" fill="var(--blue-light)" />
      <line x1="14" y1="10" x2="14" y2="34" stroke="var(--blue-primary)" strokeWidth="0.75" />
      <line x1="20" y1="10" x2="20" y2="34" stroke="var(--blue-primary)" strokeWidth="0.75" />
      <line x1="26" y1="10" x2="26" y2="34" stroke="var(--blue-primary)" strokeWidth="0.75" />
      <line x1="8" y1="17" x2="32" y2="17" stroke="var(--blue-primary)" strokeWidth="0.75" />
      <line x1="8" y1="24" x2="32" y2="24" stroke="var(--blue-primary)" strokeWidth="0.75" />
    </svg>
  ),
  infrastructure: (
    <svg width="40" height="40" viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M4 28 Q10 16 20 16 Q30 16 36 28" stroke="var(--blue-primary)" strokeWidth="1.5" fill="none" />
      <line x1="4" y1="28" x2="36" y2="28" stroke="var(--blue-primary)" strokeWidth="2" />
      <line x1="14" y1="28" x2="14" y2="18" stroke="var(--blue-primary)" strokeWidth="1" />
      <line x1="26" y1="28" x2="26" y2="18" stroke="var(--blue-primary)" strokeWidth="1" />
      <rect x="2" y="27" width="36" height="4" fill="var(--blue-light)" />
    </svg>
  ),
};

const PROJECT_TYPES = ['residential', 'commercial', 'infrastructure', 'industrial', 'healthcare'];

export default function ProjectSelector({ projects, onSelect, onGenerate, isGenerating }: ProjectSelectorProps) {
  const [customScope, setCustomScope] = useState('');
  const [projectType, setProjectType] = useState('residential');

  function handleGenerate() {
    if (customScope.trim()) {
      onGenerate(customScope.trim(), projectType);
    }
  }

  return (
    <div className="flex flex-col items-center py-16 px-6 max-w-4xl mx-auto w-full">
      {/* Badge */}
      <div className="mb-6">
        <span className="inline-block px-3 py-1 rounded-full text-xs font-medium bg-[var(--accent-pink-light)] text-[var(--accent-pink)]">
          AI Construction Scheduling
        </span>
      </div>

      {/* Hero heading */}
      <h1 className="text-5xl font-bold text-[var(--text-primary)] text-center leading-tight mb-4">
        Build your schedule<br />in seconds
      </h1>
      <p className="text-lg text-[var(--text-secondary)] text-center mb-12 max-w-lg">
        Select a sample project or describe your own. AI generates a full CPM schedule with critical path analysis.
      </p>

      {/* Sample project cards */}
      <div className="grid grid-cols-3 gap-4 w-full mb-10">
        {projects.map((project) => {
          const iconKey = project.project_type as keyof typeof PROJECT_ICONS;
          return (
            <button
              key={project.id}
              onClick={() => onSelect(project.id)}
              className="group relative bg-white border border-[var(--border-default)] rounded-[var(--radius-lg)] p-6 text-left transition-all hover:border-[var(--blue-primary)] hover:shadow-[var(--shadow-md)] hover:scale-[1.02]"
            >
              <div className="mb-4">{PROJECT_ICONS[iconKey] || PROJECT_ICONS.commercial}</div>
              <div className="font-semibold text-[var(--text-primary)] text-sm mb-1 leading-tight">{project.name}</div>
              <div className="text-xs text-[var(--text-muted)] font-mono">
                {project.activity_count} tasks · ~{project.duration_days}d
              </div>
              <div className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity">
                <span className="text-xs text-[var(--blue-primary)] font-medium">Load →</span>
              </div>
            </button>
          );
        })}
      </div>

      {/* Divider */}
      <div className="flex items-center gap-4 w-full mb-8">
        <div className="flex-1 h-px bg-[var(--border-default)]" />
        <span className="text-xs text-[var(--text-muted)] font-medium">OR GENERATE FROM SCOPE</span>
        <div className="flex-1 h-px bg-[var(--border-default)]" />
      </div>

      {/* Custom scope input */}
      <div className="w-full max-w-2xl">
        <div className="flex gap-2 mb-3">
          <label className="text-xs font-medium text-[var(--text-secondary)]">Project type:</label>
          <div className="flex gap-2 flex-wrap">
            {PROJECT_TYPES.map((type) => (
              <button
                key={type}
                onClick={() => setProjectType(type)}
                className={`px-2.5 py-0.5 rounded-full text-xs font-medium capitalize transition-colors ${
                  projectType === type
                    ? 'bg-[var(--blue-primary)] text-white'
                    : 'bg-[var(--bg-tertiary)] text-[var(--text-secondary)] hover:bg-[var(--border-default)]'
                }`}
              >
                {type}
              </button>
            ))}
          </div>
        </div>
        <textarea
          value={customScope}
          onChange={(e) => setCustomScope(e.target.value)}
          placeholder="Describe your project scope... e.g. '3,500 sq ft retail buildout in a strip mall, including demolition, new partition walls, electrical upgrade, HVAC, and storefront entrance.'"
          rows={4}
          className="w-full px-4 py-3 text-sm text-[var(--text-primary)] bg-white border border-[var(--border-default)] rounded-[var(--radius-md)] resize-none outline-none focus:border-[var(--blue-primary)] focus:ring-2 focus:ring-[var(--blue-light)] transition-colors placeholder:text-[var(--text-muted)]"
        />
        <div className="flex justify-end mt-3">
          <button
            onClick={handleGenerate}
            disabled={!customScope.trim() || isGenerating}
            className="px-6 py-2.5 text-sm font-medium text-white rounded-[var(--radius-md)] transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            style={{ backgroundColor: 'var(--blue-primary)' }}
            onMouseEnter={(e) => { if (!e.currentTarget.disabled) e.currentTarget.style.backgroundColor = 'var(--blue-hover)'; }}
            onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'var(--blue-primary)'; }}
          >
            {isGenerating ? (
              <span className="flex items-center gap-2">
                <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                Generating…
              </span>
            ) : (
              'Generate →'
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
