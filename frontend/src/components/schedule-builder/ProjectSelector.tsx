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

// ─── Project Icons (refined line art, 52x52) ─────────────────────────────────

const ResidentialIcon = () => (
  <svg width="52" height="52" viewBox="0 0 48 48" fill="none" aria-hidden>
    <path d="M4 22L24 6L44 22" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" fill="none" />
    <rect x="8" y="22" width="32" height="20" stroke="currentColor" strokeWidth="1.5" fill="none" rx="0.5" />
    <rect x="19" y="30" width="10" height="12" stroke="currentColor" strokeWidth="1" fill="none" rx="1" />
    <circle cx="27" cy="37" r="0.8" fill="currentColor" opacity="0.5" />
    <rect x="11" y="26" width="6" height="5" stroke="currentColor" strokeWidth="0.75" fill="none" rx="0.5" />
    <line x1="14" y1="26" x2="14" y2="31" stroke="currentColor" strokeWidth="0.5" />
    <line x1="11" y1="28.5" x2="17" y2="28.5" stroke="currentColor" strokeWidth="0.5" />
    <rect x="31" y="26" width="6" height="5" stroke="currentColor" strokeWidth="0.75" fill="none" rx="0.5" />
    <line x1="34" y1="26" x2="34" y2="31" stroke="currentColor" strokeWidth="0.5" />
    <line x1="31" y1="28.5" x2="37" y2="28.5" stroke="currentColor" strokeWidth="0.5" />
    <rect x="35" y="12" width="3" height="10" stroke="currentColor" strokeWidth="0.75" fill="none" />
  </svg>
);

const CommercialIcon = () => (
  <svg width="52" height="52" viewBox="0 0 48 48" fill="none" aria-hidden>
    <rect x="10" y="6" width="28" height="36" stroke="currentColor" strokeWidth="1.5" fill="none" rx="1" />
    <line x1="10" y1="15" x2="38" y2="15" stroke="currentColor" strokeWidth="0.75" />
    <line x1="10" y1="24" x2="38" y2="24" stroke="currentColor" strokeWidth="0.75" />
    <line x1="10" y1="33" x2="38" y2="33" stroke="currentColor" strokeWidth="0.75" />
    <line x1="20" y1="6" x2="20" y2="33" stroke="currentColor" strokeWidth="0.75" />
    <line x1="29" y1="6" x2="29" y2="33" stroke="currentColor" strokeWidth="0.75" />
    <rect x="12" y="8" width="6" height="5" fill="currentColor" opacity="0.08" rx="0.5" />
    <rect x="22" y="8" width="5" height="5" fill="currentColor" opacity="0.08" rx="0.5" />
    <rect x="31" y="8" width="5" height="5" fill="currentColor" opacity="0.08" rx="0.5" />
    <rect x="12" y="17" width="6" height="5" fill="currentColor" opacity="0.06" rx="0.5" />
    <rect x="22" y="17" width="5" height="5" fill="currentColor" opacity="0.06" rx="0.5" />
    <rect x="31" y="17" width="5" height="5" fill="currentColor" opacity="0.06" rx="0.5" />
    <rect x="12" y="26" width="6" height="5" fill="currentColor" opacity="0.04" rx="0.5" />
    <rect x="22" y="26" width="5" height="5" fill="currentColor" opacity="0.04" rx="0.5" />
    <rect x="31" y="26" width="5" height="5" fill="currentColor" opacity="0.04" rx="0.5" />
    <rect x="18" y="35" width="12" height="7" stroke="currentColor" strokeWidth="0.75" fill="none" rx="0.5" />
  </svg>
);

const InfrastructureIcon = () => (
  <svg width="52" height="52" viewBox="0 0 48 48" fill="none" aria-hidden>
    <rect x="2" y="30" width="44" height="2.5" stroke="currentColor" strokeWidth="1" fill="none" />
    <rect x="13" y="10" width="3.5" height="20" stroke="currentColor" strokeWidth="1.25" fill="none" />
    <rect x="31.5" y="10" width="3.5" height="20" stroke="currentColor" strokeWidth="1.25" fill="none" />
    <line x1="12" y1="17" x2="18" y2="17" stroke="currentColor" strokeWidth="0.75" />
    <line x1="30" y1="17" x2="36" y2="17" stroke="currentColor" strokeWidth="0.75" />
    <line x1="14.75" y1="10" x2="4" y2="30" stroke="currentColor" strokeWidth="0.6" />
    <line x1="14.75" y1="10" x2="9" y2="30" stroke="currentColor" strokeWidth="0.6" />
    <line x1="14.75" y1="10" x2="24" y2="30" stroke="currentColor" strokeWidth="0.6" />
    <line x1="33.25" y1="10" x2="44" y2="30" stroke="currentColor" strokeWidth="0.6" />
    <line x1="33.25" y1="10" x2="39" y2="30" stroke="currentColor" strokeWidth="0.6" />
    <line x1="33.25" y1="10" x2="24" y2="30" stroke="currentColor" strokeWidth="0.6" />
    <path d="M2 38Q8 36 14 38Q20 40 24 38Q28 36 34 38Q40 40 46 38" stroke="currentColor" strokeWidth="0.6" fill="none" opacity="0.4" />
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
  index: number;
}

function ProjectCard({ project, onClick, index }: CardProps) {
  const [tilt, setTilt] = useState({ x: 0, y: 0 });
  const [hovered, setHovered] = useState(false);
  const [mousePos, setMousePos] = useState({ x: 0.5, y: 0.5 });
  const prefersReduced = useReducedMotion();

  function handleMouseMove(e: MouseEvent<HTMLDivElement>) {
    const rect = e.currentTarget.getBoundingClientRect();
    const cx = rect.left + rect.width / 2;
    const cy = rect.top + rect.height / 2;
    const rotX = -((e.clientY - cy) / (rect.height / 2)) * 7;
    const rotY = ((e.clientX - cx) / (rect.width / 2)) * 7;
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

  // Unique accent color per card
  const accents = [
    { border: 'rgba(59,130,246,0.35)', gradient: 'rgba(59,130,246,0.08)', icon: '#3B82F6' },
    { border: 'rgba(45,212,191,0.35)', gradient: 'rgba(45,212,191,0.08)', icon: '#2DD4BF' },
    { border: 'rgba(139,92,246,0.35)', gradient: 'rgba(139,92,246,0.08)', icon: '#8B5CF6' },
  ];
  const accent = accents[index % 3];

  return (
    <div
      onClick={onClick}
      onMouseMove={handleMouseMove}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={handleMouseLeave}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => e.key === 'Enter' && onClick()}
      className="group relative rounded-2xl cursor-pointer text-left select-none overflow-hidden"
      style={{
        transform: prefersReduced
          ? undefined
          : `perspective(800px) rotateX(${tilt.x}deg) rotateY(${tilt.y}deg) scale(${hovered ? 1.02 : 1})`,
        transition: 'transform 0.18s ease-out, box-shadow 0.25s ease, border-color 0.25s ease',
        background: hovered
          ? `linear-gradient(145deg, rgba(255,255,255,0.97), rgba(249,250,251,0.95))`
          : 'rgba(255,255,255,0.85)',
        backdropFilter: 'blur(16px)',
        WebkitBackdropFilter: 'blur(16px)',
        border: `1px solid ${hovered ? accent.border : 'rgba(229,231,235,0.7)'}`,
        boxShadow: hovered
          ? `0 24px 48px -12px rgba(0,0,0,0.08), 0 0 0 1px ${accent.border}`
          : '0 1px 3px rgba(0,0,0,0.03), 0 1px 2px rgba(0,0,0,0.02)',
        willChange: 'transform',
        padding: '28px',
      }}
    >
      {/* Mouse-following gradient shimmer */}
      <div
        className="absolute inset-0 pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-400"
        style={{
          background: `radial-gradient(360px circle at ${mousePos.x * 100}% ${mousePos.y * 100}%, ${accent.gradient}, transparent 60%)`,
        }}
      />

      {/* Top accent line — gradient */}
      <div
        className="absolute top-0 left-0 right-0 h-[2px] rounded-t-2xl"
        style={{
          background: index === 0
            ? 'linear-gradient(90deg, #3B82F6, #60A5FA)'
            : index === 1
            ? 'linear-gradient(90deg, #2DD4BF, #5EEAD4)'
            : 'linear-gradient(90deg, #8B5CF6, #A78BFA)',
          opacity: hovered ? 1 : 0,
          transition: 'opacity 0.25s ease',
        }}
      />

      <div className="relative z-10">
        {/* Icon with colored background circle */}
        <div
          className="w-14 h-14 rounded-xl flex items-center justify-center mb-5 transition-colors duration-200"
          style={{
            backgroundColor: hovered ? accent.gradient : 'rgba(59,130,246,0.04)',
            color: accent.icon,
          }}
        >
          {PROJECT_ICONS[project.project_type] ?? PROJECT_ICONS.commercial}
        </div>

        <div className="font-semibold text-[var(--text-primary)] text-[16px] leading-snug mb-2">
          {project.name}
        </div>

        <p className="text-[13px] text-[var(--text-muted)] leading-relaxed mb-4 line-clamp-2">
          {project.description || 'Full CPM schedule with critical path analysis'}
        </p>

        {/* Stats row */}
        <div className="flex items-center gap-3 text-[11px]">
          <span className="flex items-center gap-1.5 font-mono text-[var(--text-muted)]">
            <span
              className="w-1.5 h-1.5 rounded-full"
              style={{ backgroundColor: accent.icon, opacity: 0.6 }}
            />
            {project.activity_count} tasks
          </span>
          <span className="w-px h-3 bg-[var(--border-default)]" />
          <span className="font-mono text-[var(--text-muted)]">~{project.duration_days}d</span>
          <span className="w-px h-3 bg-[var(--border-default)]" />
          <span className="font-mono text-[var(--text-muted)]">3 COs</span>
        </div>
      </div>

      {/* Hover arrow indicator */}
      <div
        className="absolute bottom-6 right-6 flex items-center gap-1.5 text-xs font-medium"
        style={{
          color: accent.icon,
          opacity: hovered ? 1 : 0,
          transform: hovered ? 'translateX(0)' : 'translateX(-8px)',
          transition: 'opacity 0.2s ease, transform 0.2s ease',
        }}
      >
        Explore
        <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
          <path d="M5.5 3.5L9 7L5.5 10.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </div>
    </div>
  );
}

// ─── Entrance Animation Variants ─────────────────────────────────────────────

const heroEase = [0.22, 1, 0.36, 1] as const;

const cardContainerVariants = {
  hidden: {},
  visible: {
    transition: { staggerChildren: 0.12, delayChildren: 0.7 },
  },
};

const cardVariants = {
  hidden: { opacity: 0, y: 35, scale: 0.96 },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: { duration: 0.6, ease: heroEase },
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

  const animProps = prefersReduced ? { initial: false as const } : {};

  return (
    <div className="relative flex flex-col items-center overflow-hidden min-h-[90vh]">
      {/* CPM network background */}
      <AnimatedNetworkBackground />

      {/* Noise / grain texture overlay */}
      <div
        className="absolute inset-0 pointer-events-none z-[1]"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='0.03'/%3E%3C/svg%3E")`,
          backgroundRepeat: 'repeat',
          backgroundSize: '128px 128px',
        }}
      />

      {/* Animated ambient glow behind heading */}
      <motion.div
        className="absolute pointer-events-none z-[2]"
        initial={prefersReduced ? false : { opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 1.5, ease: 'easeOut' }}
        style={{
          top: '40px',
          left: '50%',
          transform: 'translateX(-50%)',
          width: '900px',
          height: '450px',
          background: `
            radial-gradient(ellipse 100% 80% at 40% 50%, rgba(59,130,246,0.08) 0%, transparent 60%),
            radial-gradient(ellipse 80% 100% at 65% 40%, rgba(45,212,191,0.05) 0%, transparent 55%)
          `,
          filter: 'blur(60px)',
          animation: prefersReduced ? 'none' : 'glowPulse 8s ease-in-out infinite alternate',
        }}
      />

      {/* Content */}
      <div className="relative z-10 flex flex-col items-center w-full max-w-5xl mx-auto px-8 pt-20 pb-24">

        {/* Pink pill badge — Karmen signature */}
        <motion.div
          initial={prefersReduced ? false : { opacity: 0, y: 12, scale: 0.9 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.5, delay: 0.05, ease: heroEase }}
          className="mb-6"
        >
          <span
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-[12px] font-medium tracking-wide"
            style={{
              backgroundColor: 'var(--accent-pink-light)',
              color: 'var(--accent-pink)',
            }}
          >
            <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
              <path d="M6 1L7.5 4.5L11 5.5L8.5 8L9 11.5L6 9.5L3 11.5L3.5 8L1 5.5L4.5 4.5L6 1Z" fill="currentColor" opacity="0.7" />
            </svg>
            AI-Powered Construction Scheduling
          </span>
        </motion.div>

        {/* Hero heading — gradient text + character-level animation */}
        <motion.h1
          className="text-center mb-4"
          initial={prefersReduced ? false : { opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.15, ease: heroEase }}
          style={{
            fontSize: 'clamp(52px, 6vw, 76px)',
            lineHeight: 1.05,
            letterSpacing: '-0.03em',
            fontWeight: 700,
          }}
        >
          <span style={{ color: 'var(--text-primary)' }}>Karmen</span>
          <span
            style={{
              background: 'linear-gradient(135deg, #3B82F6 0%, #2DD4BF 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text',
              marginLeft: '0.15em',
            }}
          >
            Playground
          </span>
        </motion.h1>

        {/* Subheading */}
        <motion.p
          initial={prefersReduced ? false : { opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.55, delay: 0.35, ease: heroEase }}
          className="text-[17px] text-[var(--text-secondary)] text-center leading-relaxed max-w-lg mb-4"
          style={{ textWrap: 'balance' } as React.CSSProperties}
        >
          Select a project below — or describe your own scope
          and watch the AI build a CPM schedule in seconds.
        </motion.p>

        {/* Feature highlights — tiny stat badges */}
        <motion.div
          initial={prefersReduced ? false : { opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.5, ease: heroEase }}
          className="flex items-center gap-5 mb-14"
        >
          {[
            { label: 'Critical Path', icon: '◆' },
            { label: 'Monte Carlo', icon: '◇' },
            { label: 'Change Orders', icon: '△' },
          ].map((feat) => (
            <span
              key={feat.label}
              className="flex items-center gap-1.5 text-[12px] text-[var(--text-muted)] font-medium"
            >
              <span className="text-[var(--blue-primary)] text-[10px]">{feat.icon}</span>
              {feat.label}
            </span>
          ))}
        </motion.div>

        {/* Project cards */}
        <motion.div
          className="grid grid-cols-3 gap-5 w-full"
          variants={cardContainerVariants}
          initial="hidden"
          animate="visible"
          {...animProps}
        >
          {projects.map((project, i) => (
            <motion.div key={project.id} variants={cardVariants}>
              <ProjectCard project={project} onClick={() => onSelect(project.id)} index={i} />
            </motion.div>
          ))}
        </motion.div>

        {/* Divider */}
        <motion.div
          initial={prefersReduced ? false : { opacity: 0, scaleX: 0 }}
          animate={{ opacity: 1, scaleX: 1 }}
          transition={{ duration: 0.5, delay: 1.2, ease: heroEase }}
          className="flex items-center gap-4 w-full max-w-2xl mt-16 mb-10"
          style={{ transformOrigin: 'center' }}
        >
          <div className="flex-1 h-px bg-gradient-to-r from-transparent via-[var(--border-default)] to-transparent" />
          <span className="text-[11px] text-[var(--text-muted)] font-medium tracking-[0.15em] uppercase whitespace-nowrap">
            or describe your own scope
          </span>
          <div className="flex-1 h-px bg-gradient-to-l from-transparent via-[var(--border-default)] to-transparent" />
        </motion.div>

        {/* Scope input area */}
        <motion.div
          initial={prefersReduced ? false : { opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 1.35, ease: heroEase }}
          className="w-full max-w-2xl"
        >
          {/* Project type pills */}
          <div className="flex items-center gap-2 mb-3.5 flex-wrap">
            <span className="text-xs font-medium text-[var(--text-secondary)]">Project type:</span>
            {PROJECT_TYPES.map((type) => (
              <button
                key={type}
                onClick={() => setProjectType(type)}
                className={`px-3 py-1 rounded-full text-xs font-medium capitalize transition-all duration-150 ${
                  projectType === type
                    ? 'bg-[var(--blue-primary)] text-white shadow-sm'
                    : 'bg-white/80 text-[var(--text-secondary)] border border-[var(--border-default)] hover:border-[var(--blue-muted)] hover:text-[var(--text-primary)]'
                }`}
              >
                {type}
              </button>
            ))}
          </div>

          {/* Textarea with glow border on focus */}
          <div className="relative group/input">
            <textarea
              value={customScope}
              onChange={(e) => setCustomScope(e.target.value)}
              placeholder="e.g., 3-story residential build with geothermal HVAC and rooftop deck..."
              rows={3}
              className="w-full px-5 py-4 text-sm text-[var(--text-primary)] bg-white/90 backdrop-blur-sm border border-[var(--border-default)] rounded-xl resize-none outline-none transition-all duration-200 placeholder:text-[var(--text-muted)] focus:border-[var(--blue-primary)] focus:bg-white"
              style={{
                boxShadow: 'var(--shadow-sm)',
              }}
              onFocus={(e) => {
                e.currentTarget.style.boxShadow = '0 0 0 3px rgba(59,130,246,0.08), 0 4px 12px rgba(0,0,0,0.04)';
              }}
              onBlur={(e) => {
                e.currentTarget.style.boxShadow = 'var(--shadow-sm)';
              }}
            />
          </div>

          {/* Generate button */}
          <div className="flex justify-end mt-3">
            <button
              onClick={handleGenerate}
              disabled={!customScope.trim() || isGenerating}
              className="px-8 py-2.5 text-sm font-medium text-white rounded-lg transition-all duration-150 disabled:opacity-40 disabled:cursor-not-allowed active:scale-[0.97]"
              style={{
                backgroundColor: 'var(--blue-primary)',
                boxShadow: '0 2px 8px rgba(59,130,246,0.25), 0 1px 2px rgba(0,0,0,0.06)',
              }}
              onMouseEnter={(e) => {
                if (!e.currentTarget.disabled) {
                  e.currentTarget.style.backgroundColor = 'var(--blue-hover)';
                  e.currentTarget.style.boxShadow = '0 4px 16px rgba(59,130,246,0.3), 0 2px 4px rgba(0,0,0,0.06)';
                  e.currentTarget.style.transform = 'translateY(-1px)';
                }
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = 'var(--blue-primary)';
                e.currentTarget.style.boxShadow = '0 2px 8px rgba(59,130,246,0.25), 0 1px 2px rgba(0,0,0,0.06)';
                e.currentTarget.style.transform = 'translateY(0)';
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
        className="absolute bottom-0 left-0 right-0 h-40 pointer-events-none z-[3]"
        style={{
          background: 'linear-gradient(to bottom, transparent 0%, rgba(255,255,255,0.8) 60%, white 100%)',
        }}
      />
    </div>
  );
}
