'use client';

import { useState, type MouseEvent } from 'react';
import { motion } from 'framer-motion';
import AnimatedNetworkBackground from '../shared/AnimatedNetworkBackground';
import type { ProjectSummary } from '../../types/schedule';

interface ProjectSelectorProps {
  projects: ProjectSummary[];
  onSelect: (projectId: string) => void;
  onGenerate: (scopeText: string, projectType: string) => void;
  isGenerating?: boolean;
}

// ─── Project Icons ────────────────────────────────────────────────────────────

const ResidentialIcon = () => (
  <svg width="52" height="52" viewBox="0 0 52 52" fill="none" aria-hidden>
    {/* Roof */}
    <path d="M4 24 L26 6 L48 24" stroke="#3B82F6" strokeWidth="1.5" strokeLinejoin="round" fill="#EFF6FF" />
    {/* Walls */}
    <rect x="8" y="24" width="36" height="22" stroke="#3B82F6" strokeWidth="1.5" fill="#EFF6FF" />
    {/* Door */}
    <rect x="21" y="33" width="10" height="13" stroke="#3B82F6" strokeWidth="1" rx="0.5" fill="white" />
    <circle cx="29.5" cy="40" r="1" fill="#3B82F6" opacity="0.5" />
    {/* Left window */}
    <rect x="11" y="27" width="8" height="6" stroke="#3B82F6" strokeWidth="0.75" rx="0.5" fill="white" />
    <line x1="15" y1="27" x2="15" y2="33" stroke="#3B82F6" strokeWidth="0.5" />
    <line x1="11" y1="30" x2="19" y2="30" stroke="#3B82F6" strokeWidth="0.5" />
    {/* Right window */}
    <rect x="33" y="27" width="8" height="6" stroke="#3B82F6" strokeWidth="0.75" rx="0.5" fill="white" />
    <line x1="37" y1="27" x2="37" y2="33" stroke="#3B82F6" strokeWidth="0.5" />
    <line x1="33" y1="30" x2="41" y2="30" stroke="#3B82F6" strokeWidth="0.5" />
    {/* Chimney */}
    <rect x="37" y="13" width="4" height="11" stroke="#3B82F6" strokeWidth="1" fill="#EFF6FF" />
  </svg>
);

const CommercialIcon = () => (
  <svg width="52" height="52" viewBox="0 0 52 52" fill="none" aria-hidden>
    {/* Tower outline */}
    <rect x="10" y="6" width="32" height="40" stroke="#3B82F6" strokeWidth="1.5" fill="#EFF6FF" rx="0.5" />
    {/* Floor lines */}
    <line x1="10" y1="16" x2="42" y2="16" stroke="#3B82F6" strokeWidth="0.75" />
    <line x1="10" y1="26" x2="42" y2="26" stroke="#3B82F6" strokeWidth="0.75" />
    <line x1="10" y1="36" x2="42" y2="36" stroke="#3B82F6" strokeWidth="0.75" />
    {/* Column dividers */}
    <line x1="21" y1="6" x2="21" y2="36" stroke="#3B82F6" strokeWidth="0.75" />
    <line x1="31" y1="6" x2="31" y2="36" stroke="#3B82F6" strokeWidth="0.75" />
    {/* Window cells — floor 1 */}
    <rect x="12" y="8" width="7" height="6" fill="#93C5FD" opacity="0.55" />
    <rect x="23" y="8" width="7" height="6" fill="#93C5FD" opacity="0.55" />
    <rect x="33" y="8" width="7" height="6" fill="#93C5FD" opacity="0.55" />
    {/* Window cells — floor 2 */}
    <rect x="12" y="18" width="7" height="6" fill="#93C5FD" opacity="0.40" />
    <rect x="23" y="18" width="7" height="6" fill="#93C5FD" opacity="0.40" />
    <rect x="33" y="18" width="7" height="6" fill="#93C5FD" opacity="0.40" />
    {/* Window cells — floor 3 */}
    <rect x="12" y="28" width="7" height="6" fill="#93C5FD" opacity="0.22" />
    <rect x="23" y="28" width="7" height="6" fill="#93C5FD" opacity="0.22" />
    <rect x="33" y="28" width="7" height="6" fill="#93C5FD" opacity="0.22" />
    {/* Ground-floor entrance */}
    <rect x="18" y="37" width="16" height="9" stroke="#3B82F6" strokeWidth="1" fill="white" />
  </svg>
);

const InfrastructureIcon = () => (
  <svg width="52" height="52" viewBox="0 0 52 52" fill="none" aria-hidden>
    {/* Road deck */}
    <rect x="2" y="31" width="48" height="3" fill="#EFF6FF" stroke="#3B82F6" strokeWidth="1" />
    {/* Left tower */}
    <rect x="14" y="10" width="4" height="21" fill="#EFF6FF" stroke="#3B82F6" strokeWidth="1.25" />
    {/* Right tower */}
    <rect x="34" y="10" width="4" height="21" fill="#EFF6FF" stroke="#3B82F6" strokeWidth="1.25" />
    {/* Tower crossbars */}
    <line x1="13" y1="18" x2="19" y2="18" stroke="#3B82F6" strokeWidth="1" />
    <line x1="33" y1="18" x2="39" y2="18" stroke="#3B82F6" strokeWidth="1" />
    {/* Left tower cables */}
    <line x1="16" y1="10" x2="4"  y2="31" stroke="#3B82F6" strokeWidth="0.75" />
    <line x1="16" y1="10" x2="10" y2="31" stroke="#3B82F6" strokeWidth="0.75" />
    <line x1="16" y1="10" x2="26" y2="31" stroke="#3B82F6" strokeWidth="0.75" />
    {/* Right tower cables */}
    <line x1="36" y1="10" x2="48" y2="31" stroke="#3B82F6" strokeWidth="0.75" />
    <line x1="36" y1="10" x2="42" y2="31" stroke="#3B82F6" strokeWidth="0.75" />
    <line x1="36" y1="10" x2="26" y2="31" stroke="#3B82F6" strokeWidth="0.75" />
    {/* Water suggestion */}
    <path d="M2 40 Q8 38 14 40 Q20 42 26 40 Q32 38 38 40 Q44 42 50 40" stroke="#93C5FD" strokeWidth="0.75" fill="none" />
  </svg>
);

const PROJECT_ICONS: Record<string, React.ReactNode> = {
  residential: <ResidentialIcon />,
  commercial: <CommercialIcon />,
  infrastructure: <InfrastructureIcon />,
};

const PROJECT_TYPES = ['residential', 'commercial', 'infrastructure', 'industrial', 'healthcare'];

// ─── 3D Tilt Card ─────────────────────────────────────────────────────────────

interface CardProps {
  project: ProjectSummary;
  onClick: () => void;
}

function ProjectCard({ project, onClick }: CardProps) {
  const [tilt, setTilt] = useState({ x: 0, y: 0 });
  const [hovered, setHovered] = useState(false);

  function handleMouseMove(e: MouseEvent<HTMLDivElement>) {
    const rect = e.currentTarget.getBoundingClientRect();
    const cx = rect.left + rect.width / 2;
    const cy = rect.top + rect.height / 2;
    const rotX = -((e.clientY - cy) / (rect.height / 2)) * 5;
    const rotY = ((e.clientX - cx) / (rect.width / 2)) * 5;
    setTilt({ x: rotX, y: rotY });
  }

  function handleMouseLeave() {
    setTilt({ x: 0, y: 0 });
    setHovered(false);
  }

  return (
    <div
      onClick={onClick}
      onMouseMove={handleMouseMove}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={handleMouseLeave}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => e.key === 'Enter' && onClick()}
      className="relative bg-white rounded-[var(--radius-lg)] p-6 cursor-pointer text-left select-none"
      style={{
        transform: `perspective(800px) rotateX(${tilt.x}deg) rotateY(${tilt.y}deg) scale(${hovered ? 1.025 : 1})`,
        transition: 'transform 0.12s ease-out, border-color 0.15s ease, box-shadow 0.15s ease',
        border: `1px solid ${hovered ? 'var(--blue-primary)' : 'var(--border-default)'}`,
        boxShadow: hovered ? 'var(--shadow-md)' : 'var(--shadow-sm)',
        willChange: 'transform',
      }}
    >
      {/* Blue→teal top shimmer on hover */}
      <div
        className="absolute top-0 left-0 right-0 h-[1.5px] rounded-t-[var(--radius-lg)]"
        style={{
          background: 'linear-gradient(90deg, #3B82F6, #2DD4BF)',
          opacity: hovered ? 1 : 0,
          transition: 'opacity 0.15s ease',
        }}
      />

      <div className="mb-5">
        {PROJECT_ICONS[project.project_type] ?? PROJECT_ICONS.commercial}
      </div>

      <div className="font-semibold text-[var(--text-primary)] text-[15px] leading-snug mb-2">
        {project.name}
      </div>

      <div className="font-mono text-xs text-[var(--text-muted)]">
        {project.activity_count} tasks · ~{project.duration_days}d · 3 change orders
      </div>

      {/* Arrow — slides in on hover */}
      <div
        className="absolute bottom-5 right-5 text-xs font-medium text-[var(--blue-primary)]"
        style={{
          opacity: hovered ? 1 : 0,
          transform: hovered ? 'translateX(0)' : 'translateX(-4px)',
          transition: 'opacity 0.15s ease, transform 0.15s ease',
        }}
      >
        Select →
      </div>
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function ProjectSelector({
  projects,
  onSelect,
  onGenerate,
  isGenerating,
}: ProjectSelectorProps) {
  const [customScope, setCustomScope] = useState('');
  const [projectType, setProjectType] = useState('residential');

  function handleGenerate() {
    if (customScope.trim()) onGenerate(customScope.trim(), projectType);
  }

  return (
    <div className="relative flex flex-col items-center overflow-hidden">
      {/* Animated CPM network — drawn on load */}
      <AnimatedNetworkBackground />

      {/* Ambient blue glow behind heading */}
      <div
        className="absolute pointer-events-none"
        style={{
          top: '40px',
          left: '50%',
          transform: 'translateX(-50%)',
          width: '700px',
          height: '320px',
          background: 'radial-gradient(ellipse, rgba(59,130,246,0.055) 0%, transparent 70%)',
          filter: 'blur(50px)',
        }}
      />

      <div className="relative z-10 flex flex-col items-center w-full max-w-5xl mx-auto px-8 pt-20 pb-20">

        {/* Hero heading */}
        <motion.h1
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.55, delay: 0.05, ease: [0.22, 1, 0.36, 1] }}
          className="font-bold text-center leading-tight mb-5"
          style={{
            fontSize: 'clamp(48px, 5vw, 68px)',
            letterSpacing: '-0.03em',
          }}
        >
          <span className="text-[var(--text-primary)]">Karmen </span>
          <span
            style={{
              backgroundImage: 'linear-gradient(135deg, #3B82F6 0%, #2DD4BF 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text',
            }}
          >
            Playground
          </span>
        </motion.h1>

        {/* Subheading */}
        <motion.p
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.18, ease: [0.22, 1, 0.36, 1] }}
          className="text-[18px] text-[var(--text-secondary)] text-center leading-relaxed"
          style={{ maxWidth: '480px' }}
        >
          Construction scheduling, change order analysis, and risk simulation — powered by AI.
        </motion.p>

        {/* Project cards */}
        <motion.div
          className="grid grid-cols-3 gap-5 w-full mt-14"
          initial="hidden"
          animate="visible"
          variants={{
            hidden: {},
            visible: { transition: { staggerChildren: 0.1, delayChildren: 0.32 } },
          }}
        >
          {projects.map((project) => (
            <motion.div
              key={project.id}
              variants={{
                hidden: { opacity: 0, y: 24 },
                visible: {
                  opacity: 1,
                  y: 0,
                  transition: { duration: 0.5, ease: [0.22, 1, 0.36, 1] },
                },
              }}
            >
              <ProjectCard project={project} onClick={() => onSelect(project.id)} />
            </motion.div>
          ))}
        </motion.div>

        {/* Divider */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.4, delay: 0.75 }}
          className="flex items-center gap-4 w-full mt-12 mb-8"
        >
          <div className="flex-1 h-px bg-[var(--border-default)]" />
          <span className="text-xs text-[var(--text-muted)] font-medium tracking-widest uppercase">
            or describe your own scope
          </span>
          <div className="flex-1 h-px bg-[var(--border-default)]" />
        </motion.div>

        {/* Scope input */}
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.88 }}
          className="w-full max-w-2xl"
        >
          <div className="flex items-center gap-2 mb-3 flex-wrap">
            <span className="text-xs font-medium text-[var(--text-secondary)]">Project type:</span>
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

          <textarea
            value={customScope}
            onChange={(e) => setCustomScope(e.target.value)}
            placeholder="e.g. 3,500 sq ft retail buildout — demolition, new partitions, electrical upgrade, HVAC, and storefront entrance."
            rows={4}
            className="w-full px-4 py-3 text-sm text-[var(--text-primary)] bg-white border border-[var(--border-default)] rounded-[var(--radius-md)] resize-none outline-none focus:border-[var(--blue-primary)] focus:ring-2 focus:ring-[var(--blue-light)] transition-all placeholder:text-[var(--text-muted)]"
          />

          <div className="flex justify-end mt-3">
            <button
              onClick={handleGenerate}
              disabled={!customScope.trim() || isGenerating}
              className="px-6 py-2.5 text-sm font-medium text-white rounded-[var(--radius-md)] transition-all disabled:opacity-40 disabled:cursor-not-allowed active:scale-[0.98]"
              style={{ backgroundColor: 'var(--blue-primary)' }}
              onMouseEnter={(e) => {
                if (!e.currentTarget.disabled)
                  e.currentTarget.style.backgroundColor = 'var(--blue-hover)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = 'var(--blue-primary)';
              }}
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
    </div>
  );
}
