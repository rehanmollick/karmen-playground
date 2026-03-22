'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import type { ProjectSummary } from '../../types/schedule';

interface ProjectSelectorProps {
  projects: ProjectSummary[];
  onSelect: (projectId: string) => void;
  onGenerate: (scopeText: string, projectType: string) => void;
  isGenerating?: boolean;
}

const PROJECT_ICONS = {
  residential: (
    <svg width="48" height="48" viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M8 24L24 8L40 24V42H32V32H16V42H8V24Z" stroke="var(--blue-primary)" strokeWidth="1.5" fill="var(--blue-light)" />
      <rect x="20" y="32" width="8" height="10" fill="var(--blue-primary)" opacity="0.7" />
      <rect x="10" y="26" width="6" height="5" fill="var(--blue-muted)" opacity="0.6" rx="1" />
      <rect x="32" y="26" width="6" height="5" fill="var(--blue-muted)" opacity="0.6" rx="1" />
    </svg>
  ),
  commercial: (
    <svg width="48" height="48" viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect x="8" y="10" width="32" height="32" stroke="var(--blue-primary)" strokeWidth="1.5" fill="var(--blue-light)" />
      <line x1="18" y1="10" x2="18" y2="42" stroke="var(--blue-primary)" strokeWidth="0.75" />
      <line x1="28" y1="10" x2="28" y2="42" stroke="var(--blue-primary)" strokeWidth="0.75" />
      <line x1="8" y1="20" x2="40" y2="20" stroke="var(--blue-primary)" strokeWidth="0.75" />
      <line x1="8" y1="30" x2="40" y2="30" stroke="var(--blue-primary)" strokeWidth="0.75" />
      <rect x="20" y="32" width="8" height="10" fill="var(--blue-primary)" opacity="0.7" />
    </svg>
  ),
  infrastructure: (
    <svg width="48" height="48" viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M4 36 Q12 20 24 20 Q36 20 44 36" stroke="var(--blue-primary)" strokeWidth="1.5" fill="none" />
      <line x1="4" y1="36" x2="44" y2="36" stroke="var(--blue-primary)" strokeWidth="2.5" />
      <line x1="16" y1="36" x2="16" y2="24" stroke="var(--blue-primary)" strokeWidth="1.25" />
      <line x1="32" y1="36" x2="32" y2="24" stroke="var(--blue-primary)" strokeWidth="1.25" />
      <rect x="2" y="35" width="44" height="5" fill="var(--blue-light)" rx="1" />
      <line x1="24" y1="36" x2="24" y2="20" stroke="var(--blue-muted)" strokeWidth="1" strokeDasharray="2 2" />
    </svg>
  ),
};

const PROJECT_TYPES = ['residential', 'commercial', 'infrastructure', 'industrial', 'healthcare'];

const STATS = [
  { value: '3', label: 'sample projects' },
  { value: 'Schedule', label: 'generation' },
  { value: 'Change order', label: 'analysis' },
  { value: 'Risk', label: 'simulation' },
];

export default function ProjectSelector({ projects, onSelect, onGenerate, isGenerating }: ProjectSelectorProps) {
  const [customScope, setCustomScope] = useState('');
  const [projectType, setProjectType] = useState('residential');

  function handleGenerate() {
    if (customScope.trim()) {
      onGenerate(customScope.trim(), projectType);
    }
  }

  return (
    <div className="relative flex flex-col items-center py-16 px-6 max-w-4xl mx-auto w-full overflow-hidden">
      {/* Subtle background geometry */}
      <div className="absolute inset-0 pointer-events-none" aria-hidden>
        <div
          className="absolute -top-24 -right-32 w-96 h-96 rounded-full opacity-[0.035]"
          style={{ background: 'radial-gradient(circle, #3B82F6 0%, transparent 70%)' }}
        />
        <div
          className="absolute -bottom-16 -left-24 w-80 h-80 rounded-full opacity-[0.03]"
          style={{ background: 'radial-gradient(circle, #2DD4BF 0%, transparent 70%)' }}
        />
      </div>

      {/* Badge row */}
      <motion.div
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="flex items-center gap-3 mb-6"
      >
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-[var(--accent-pink-light)] text-[var(--accent-pink)]">
          AI Construction Scheduling
        </span>
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-[var(--blue-light)] text-[var(--blue-primary)] border border-[var(--blue-primary)] border-opacity-20">
          <span className="w-1.5 h-1.5 rounded-full bg-[var(--blue-primary)] animate-pulse" />
          Live Demo
        </span>
      </motion.div>

      {/* Hero heading */}
      <motion.h1
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.45, delay: 0.05 }}
        className="text-5xl font-bold text-[var(--text-primary)] text-center leading-tight mb-4"
      >
        Karmen Playground
      </motion.h1>
      <motion.p
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.45, delay: 0.1 }}
        className="text-lg text-[var(--text-secondary)] text-center mb-8 max-w-lg"
      >
        An interactive demo of AI-powered construction scheduling. No signup. No sales call. Just build.
      </motion.p>

      {/* Stats strip */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.4, delay: 0.2 }}
        className="flex items-center gap-6 mb-10 text-center"
      >
        {STATS.map((stat, i) => (
          <div key={i} className="flex items-center gap-2">
            {i > 0 && <div className="w-px h-4 bg-[var(--border-default)]" />}
            <div>
              <span className="font-semibold text-sm text-[var(--text-primary)]">{stat.value}</span>
              <span className="text-sm text-[var(--text-muted)] ml-1">{stat.label}</span>
            </div>
          </div>
        ))}
      </motion.div>

      {/* Sample project cards */}
      <motion.div
        className="grid grid-cols-3 gap-4 w-full mb-10"
        initial="hidden"
        animate="visible"
        variants={{ visible: { transition: { staggerChildren: 0.08 } }, hidden: {} }}
      >
        {projects.map((project) => {
          const iconKey = project.project_type as keyof typeof PROJECT_ICONS;
          return (
            <motion.button
              key={project.id}
              variants={{ hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0, transition: { duration: 0.35 } } }}
              onClick={() => onSelect(project.id)}
              className="group relative bg-white border border-[var(--border-default)] rounded-[var(--radius-lg)] p-6 text-left transition-all hover:border-[var(--blue-primary)] hover:shadow-[var(--shadow-md)] hover:scale-[1.02] overflow-hidden"
            >
              {/* Top accent gradient bar */}
              <div
                className="absolute top-0 left-0 right-0 h-0.5 opacity-0 group-hover:opacity-100 transition-opacity rounded-t-[var(--radius-lg)]"
                style={{ background: 'linear-gradient(90deg, #3B82F6, #2DD4BF)' }}
              />
              <div className="mb-4">{PROJECT_ICONS[iconKey] || PROJECT_ICONS.commercial}</div>
              <div className="font-semibold text-[var(--text-primary)] text-sm mb-1 leading-tight">{project.name}</div>
              <div className="text-xs text-[var(--text-muted)] font-mono">
                {project.activity_count} tasks · ~{project.duration_days}d
              </div>
              <div className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity">
                <span className="text-xs text-[var(--blue-primary)] font-medium">Load →</span>
              </div>
            </motion.button>
          );
        })}
      </motion.div>

      {/* Divider */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.4, delay: 0.35 }}
        className="flex items-center gap-4 w-full mb-8"
      >
        <div className="flex-1 h-px bg-[var(--border-default)]" />
        <span className="text-xs text-[var(--text-muted)] font-medium">OR GENERATE FROM SCOPE</span>
        <div className="flex-1 h-px bg-[var(--border-default)]" />
      </motion.div>

      {/* Custom scope input */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.4 }}
        className="w-full max-w-2xl"
      >
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
      </motion.div>
    </div>
  );
}
