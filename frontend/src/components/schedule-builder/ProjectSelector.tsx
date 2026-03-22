'use client';

import { useState, type MouseEvent } from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import AnimatedNetworkBackground from '../shared/AnimatedNetworkBackground';
import type { ProjectSummary } from '../../types/schedule';

interface ProjectSelectorProps {
  projects: ProjectSummary[];
  onSelect: (projectId: string) => void;
  onGenerate: (scopeText: string, projectType: string) => void;
  isGenerating?: boolean;
}

// ─── Project Icons (refined line art) ────────────────────────────────────────

const ResidentialIcon = () => (
  <svg width="48" height="48" viewBox="0 0 48 48" fill="none" aria-hidden>
    <path d="M4 22L24 6L44 22" stroke="#3B82F6" strokeWidth="1.5" strokeLinejoin="round" fill="none" />
    <rect x="8" y="22" width="32" height="20" stroke="#3B82F6" strokeWidth="1.5" fill="none" rx="0.5" />
    <rect x="19" y="30" width="10" height="12" stroke="#3B82F6" strokeWidth="1" fill="none" rx="1" />
    <circle cx="27" cy="37" r="0.8" fill="#3B82F6" opacity="0.6" />
    <rect x="11" y="26" width="6" height="5" stroke="#3B82F6" strokeWidth="0.75" fill="none" rx="0.5" />
    <line x1="14" y1="26" x2="14" y2="31" stroke="#3B82F6" strokeWidth="0.5" />
    <line x1="11" y1="28.5" x2="17" y2="28.5" stroke="#3B82F6" strokeWidth="0.5" />
    <rect x="31" y="26" width="6" height="5" stroke="#3B82F6" strokeWidth="0.75" fill="none" rx="0.5" />
    <line x1="34" y1="26" x2="34" y2="31" stroke="#3B82F6" strokeWidth="0.5" />
    <line x1="31" y1="28.5" x2="37" y2="28.5" stroke="#3B82F6" strokeWidth="0.5" />
    <rect x="35" y="12" width="3" height="10" stroke="#3B82F6" strokeWidth="0.75" fill="none" />
  </svg>
);

const CommercialIcon = () => (
  <svg width="48" height="48" viewBox="0 0 48 48" fill="none" aria-hidden>
    <rect x="10" y="6" width="28" height="36" stroke="#3B82F6" strokeWidth="1.5" fill="none" rx="1" />
    <line x1="10" y1="15" x2="38" y2="15" stroke="#3B82F6" strokeWidth="0.75" />
    <line x1="10" y1="24" x2="38" y2="24" stroke="#3B82F6" strokeWidth="0.75" />
    <line x1="10" y1="33" x2="38" y2="33" stroke="#3B82F6" strokeWidth="0.75" />
    <line x1="20" y1="6" x2="20" y2="33" stroke="#3B82F6" strokeWidth="0.75" />
    <line x1="29" y1="6" x2="29" y2="33" stroke="#3B82F6" strokeWidth="0.75" />
    {/* Window fills */}
    <rect x="12" y="8" width="6" height="5" fill="#3B82F6" opacity="0.08" rx="0.5" />
    <rect x="22" y="8" width="5" height="5" fill="#3B82F6" opacity="0.08" rx="0.5" />
    <rect x="31" y="8" width="5" height="5" fill="#3B82F6" opacity="0.08" rx="0.5" />
    <rect x="12" y="17" width="6" height="5" fill="#3B82F6" opacity="0.06" rx="0.5" />
    <rect x="22" y="17" width="5" height="5" fill="#3B82F6" opacity="0.06" rx="0.5" />
    <rect x="31" y="17" width="5" height="5" fill="#3B82F6" opacity="0.06" rx="0.5" />
    <rect x="12" y="26" width="6" height="5" fill="#3B82F6" opacity="0.04" rx="0.5" />
    <rect x="22" y="26" width="5" height="5" fill="#3B82F6" opacity="0.04" rx="0.5" />
    <rect x="31" y="26" width="5" height="5" fill="#3B82F6" opacity="0.04" rx="0.5" />
    <rect x="18" y="35" width="12" height="7" stroke="#3B82F6" strokeWidth="0.75" fill="none" rx="0.5" />
  </svg>
);

const InfrastructureIcon = () => (
  <svg width="48" height="48" viewBox="0 0 48 48" fill="none" aria-hidden>
    <rect x="2" y="30" width="44" height="2.5" stroke="#3B82F6" strokeWidth="1" fill="none" />
    <rect x="13" y="10" width="3.5" height="20" stroke="#3B82F6" strokeWidth="1.25" fill="none" />
    <rect x="31.5" y="10" width="3.5" height="20" stroke="#3B82F6" strokeWidth="1.25" fill="none" />
    <line x1="12" y1="17" x2="18" y2="17" stroke="#3B82F6" strokeWidth="0.75" />
    <line x1="30" y1="17" x2="36" y2="17" stroke="#3B82F6" strokeWidth="0.75" />
    {/* Left cables */}
    <line x1="14.75" y1="10" x2="4" y2="30" stroke="#3B82F6" strokeWidth="0.6" />
    <line x1="14.75" y1="10" x2="9" y2="30" stroke="#3B82F6" strokeWidth="0.6" />
    <line x1="14.75" y1="10" x2="24" y2="30" stroke="#3B82F6" strokeWidth="0.6" />
    {/* Right cables */}
    <line x1="33.25" y1="10" x2="44" y2="30" stroke="#3B82F6" strokeWidth="0.6" />
    <line x1="33.25" y1="10" x2="39" y2="30" stroke="#3B82F6" strokeWidth="0.6" />
    <line x1="33.25" y1="10" x2="24" y2="30" stroke="#3B82F6" strokeWidth="0.6" />
    {/* Water */}
    <path d="M2 38Q8 36 14 38Q20 40 24 38Q28 36 34 38Q40 40 46 38" stroke="#93C5FD" strokeWidth="0.6" fill="none" opacity="0.5" />
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
  const [mousePos, setMousePos] = useState({ x: 0.5, y: 0.5 });
  const prefersReduced = useReducedMotion();

  function handleMouseMove(e: MouseEvent<HTMLDivElement>) {
    const rect = e.currentTarget.getBoundingClientRect();
    const cx = rect.left + rect.width / 2;
    const cy = rect.top + rect.height / 2;
    const rotX = -((e.clientY - cy) / (rect.height / 2)) * 6;
    const rotY = ((e.clientX - cx) / (rect.width / 2)) * 6;
    setTilt({ x: rotX, y: rotY });
    setMousePos({
      x: (e.clientX - rect.left) / rect.width,
      y: (e.clientY - rect.top) / rect.height,
    });
  }

  function handleMouseLeave() {
    setTilt({ x: 0, y: 0 });
    setHovered(false);
    setMousePos({ x: 0.5, y: 0.5 });
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
      className="group relative rounded-[14px] p-6 cursor-pointer text-left select-none overflow-hidden"
      style={{
        transform: prefersReduced
          ? undefined
          : `perspective(800px) rotateX(${tilt.x}deg) rotateY(${tilt.y}deg) scale(${hovered ? 1.03 : 1})`,
        transition: 'transform 0.15s ease-out, box-shadow 0.2s ease',
        background: hovered
          ? 'linear-gradient(135deg, rgba(255,255,255,0.95), rgba(239,246,255,0.9))'
          : 'rgba(255,255,255,0.8)',
        backdropFilter: 'blur(12px)',
        WebkitBackdropFilter: 'blur(12px)',
        border: `1px solid ${hovered ? 'rgba(59,130,246,0.3)' : 'rgba(229,231,235,0.8)'}`,
        boxShadow: hovered
          ? '0 20px 40px rgba(59,130,246,0.1), 0 4px 12px rgba(0,0,0,0.04)'
          : '0 1px 3px rgba(0,0,0,0.04), 0 1px 2px rgba(0,0,0,0.02)',
        willChange: 'transform',
      }}
    >
      {/* Gradient shimmer that follows mouse */}
      <div
        className="absolute inset-0 pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-300"
        style={{
          background: `radial-gradient(320px circle at ${mousePos.x * 100}% ${mousePos.y * 100}%, rgba(59,130,246,0.06), transparent 60%)`,
        }}
      />

      {/* Blue→teal top accent line */}
      <div
        className="absolute top-0 left-0 right-0 h-[2px] rounded-t-[14px]"
        style={{
          background: 'linear-gradient(90deg, #3B82F6, #2DD4BF)',
          opacity: hovered ? 1 : 0,
          transition: 'opacity 0.2s ease',
        }}
      />

      <div className="relative z-10">
        <div className="mb-4 opacity-80">
          {PROJECT_ICONS[project.project_type] ?? PROJECT_ICONS.commercial}
        </div>

        <div className="font-semibold text-[var(--text-primary)] text-[15px] leading-snug mb-1.5">
          {project.name}
        </div>

        <p className="text-[13px] text-[var(--text-muted)] leading-relaxed mb-3 line-clamp-2">
          {project.description || 'Full CPM schedule with critical path analysis'}
        </p>

        <div className="flex items-center gap-3 font-mono text-[11px] text-[var(--text-muted)]">
          <span className="flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-[var(--blue-primary)] opacity-50" />
            {project.activity_count} tasks
          </span>
          <span>~{project.duration_days}d</span>
          <span>3 COs</span>
        </div>
      </div>

      {/* Hover arrow */}
      <div
        className="absolute bottom-5 right-5 text-xs font-medium text-[var(--blue-primary)]"
        style={{
          opacity: hovered ? 1 : 0,
          transform: hovered ? 'translateX(0)' : 'translateX(-6px)',
          transition: 'opacity 0.2s ease, transform 0.2s ease',
        }}
      >
        Explore →
      </div>
    </div>
  );
}

// ─── Entrance Animation Variants ─────────────────────────────────────────────

const heroEase = [0.22, 1, 0.36, 1] as const;

const wordVariants = {
  hidden: { opacity: 0, y: 20, filter: 'blur(8px)' },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    filter: 'blur(0px)',
    transition: { duration: 0.6, delay: 0.1 + i * 0.12, ease: heroEase },
  }),
};

const cardContainerVariants = {
  hidden: {},
  visible: {
    transition: { staggerChildren: 0.12, delayChildren: 0.55 },
  },
};

const cardVariants = {
  hidden: { opacity: 0, y: 30, scale: 0.97 },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: { duration: 0.55, ease: heroEase },
  },
};

// ─── Main Component ───────────────────────────────────────────────────────────

export default function ProjectSelector({
  projects,
  onSelect,
  onGenerate,
  isGenerating,
}: ProjectSelectorProps) {
  const [customScope, setCustomScope] = useState('');
  const [projectType, setProjectType] = useState('residential');
  const prefersReduced = useReducedMotion();

  function handleGenerate() {
    if (customScope.trim()) onGenerate(customScope.trim(), projectType);
  }

  const animProps = prefersReduced
    ? { initial: false as const }
    : {};

  return (
    <div className="relative flex flex-col items-center overflow-hidden">
      {/* CPM network background */}
      <AnimatedNetworkBackground />

      {/* Ambient radial glow behind heading */}
      <div
        className="absolute pointer-events-none z-[2]"
        style={{
          top: '20px',
          left: '50%',
          transform: 'translateX(-50%)',
          width: '800px',
          height: '400px',
          background: 'radial-gradient(ellipse, rgba(59,130,246,0.06) 0%, rgba(45,212,191,0.02) 40%, transparent 70%)',
          filter: 'blur(60px)',
        }}
      />

      {/* Content */}
      <div className="relative z-10 flex flex-col items-center w-full max-w-5xl mx-auto px-8 pt-24 pb-24">

        {/* Hero heading — word-by-word stagger with blur reveal */}
        <div className="flex items-baseline justify-center gap-[0.35em] mb-6">
          {['Karmen', 'Playground'].map((word, i) => (
            <motion.span
              key={word}
              custom={i}
              variants={wordVariants}
              initial="hidden"
              animate="visible"
              {...animProps}
              className="font-bold leading-none"
              style={{
                fontSize: 'clamp(52px, 5.5vw, 72px)',
                letterSpacing: '-0.035em',
                ...(i === 1
                  ? {
                      backgroundImage: 'linear-gradient(135deg, #3B82F6 0%, #2DD4BF 100%)',
                      WebkitBackgroundClip: 'text',
                      WebkitTextFillColor: 'transparent',
                      backgroundClip: 'text',
                    }
                  : { color: 'var(--text-primary)' }),
              }}
            >
              {word}
            </motion.span>
          ))}
        </div>

        {/* Subheading */}
        <motion.p
          initial={prefersReduced ? false : { opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.55, delay: 0.35, ease: heroEase }}
          className="text-[18px] text-[var(--text-secondary)] text-center leading-relaxed max-w-lg"
          style={{ textWrap: 'balance' } as React.CSSProperties}
        >
          AI-powered CPM scheduling, change order analysis, and
          Monte Carlo risk simulation for construction.
        </motion.p>

        {/* Project cards */}
        <motion.div
          className="grid grid-cols-3 gap-5 w-full mt-16"
          variants={cardContainerVariants}
          initial="hidden"
          animate="visible"
          {...animProps}
        >
          {projects.map((project) => (
            <motion.div key={project.id} variants={cardVariants}>
              <ProjectCard project={project} onClick={() => onSelect(project.id)} />
            </motion.div>
          ))}
        </motion.div>

        {/* Divider */}
        <motion.div
          initial={prefersReduced ? false : { opacity: 0, scaleX: 0 }}
          animate={{ opacity: 1, scaleX: 1 }}
          transition={{ duration: 0.5, delay: 1.0, ease: heroEase }}
          className="flex items-center gap-4 w-full mt-14 mb-10"
          style={{ transformOrigin: 'center' }}
        >
          <div className="flex-1 h-px bg-[var(--border-default)]" />
          <span className="text-[11px] text-[var(--text-muted)] font-medium tracking-[0.15em] uppercase">
            or describe your own scope
          </span>
          <div className="flex-1 h-px bg-[var(--border-default)]" />
        </motion.div>

        {/* Scope input */}
        <motion.div
          initial={prefersReduced ? false : { opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45, delay: 1.15, ease: heroEase }}
          className="w-full max-w-2xl"
        >
          <div className="flex items-center gap-2 mb-3 flex-wrap">
            <span className="text-xs font-medium text-[var(--text-secondary)]">Project type:</span>
            {PROJECT_TYPES.map((type) => (
              <button
                key={type}
                onClick={() => setProjectType(type)}
                className={`px-3 py-1 rounded-full text-xs font-medium capitalize transition-all duration-150 ${
                  projectType === type
                    ? 'bg-[var(--blue-primary)] text-white shadow-sm'
                    : 'bg-white text-[var(--text-secondary)] border border-[var(--border-default)] hover:border-[var(--blue-muted)] hover:text-[var(--text-primary)]'
                }`}
              >
                {type}
              </button>
            ))}
          </div>

          <div className="relative">
            <textarea
              value={customScope}
              onChange={(e) => setCustomScope(e.target.value)}
              placeholder="e.g., 3-story residential build with geothermal HVAC and rooftop deck..."
              rows={3}
              className="w-full px-4 py-3.5 text-sm text-[var(--text-primary)] bg-white/80 backdrop-blur-sm border border-[var(--border-default)] rounded-xl resize-none outline-none transition-all duration-200 placeholder:text-[var(--text-muted)] focus:border-[var(--blue-primary)] focus:shadow-[0_0_0_3px_rgba(59,130,246,0.08)]"
            />
          </div>

          <div className="flex justify-end mt-3">
            <button
              onClick={handleGenerate}
              disabled={!customScope.trim() || isGenerating}
              className="px-7 py-2.5 text-sm font-medium text-white rounded-lg transition-all duration-150 disabled:opacity-40 disabled:cursor-not-allowed hover:shadow-md active:scale-[0.98]"
              style={{
                backgroundColor: 'var(--blue-primary)',
                boxShadow: '0 1px 3px rgba(59,130,246,0.3)',
              }}
              onMouseEnter={(e) => {
                if (!e.currentTarget.disabled) {
                  e.currentTarget.style.backgroundColor = 'var(--blue-hover)';
                  e.currentTarget.style.boxShadow = '0 4px 12px rgba(59,130,246,0.3)';
                }
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = 'var(--blue-primary)';
                e.currentTarget.style.boxShadow = '0 1px 3px rgba(59,130,246,0.3)';
              }}
            >
              {isGenerating ? (
                <span className="flex items-center gap-2">
                  <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Generating...
                </span>
              ) : (
                'Generate →'
              )}
            </button>
          </div>
        </motion.div>
      </div>

      {/* Bottom gradient fade to white */}
      <div
        className="absolute bottom-0 left-0 right-0 h-32 pointer-events-none z-[3]"
        style={{
          background: 'linear-gradient(to bottom, transparent, white)',
        }}
      />
    </div>
  );
}
