'use client';

import { useState, useEffect, useRef, type MouseEvent } from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import HeroGanttAnimation from '../shared/HeroGanttAnimation';
import type { ProjectSummary } from '../../types/schedule';

interface ProjectSelectorProps {
  projects: ProjectSummary[];
  onSelect: (projectId: string) => void;
  onGenerate: (scopeText: string, projectType: string) => void;
  isGenerating?: boolean;
}

// ─── Project Icons (refined line art, 52×52) ────────────────────────────────

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

const DEMO_SCOPE = '3-story residential build with geothermal HVAC, rooftop deck, and solar panel installation';

// ─── 3D Tilt Card ───────────────────────────────────────────────────────────

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
          ? 'linear-gradient(145deg, rgba(255,255,255,0.97), rgba(249,250,251,0.95))'
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

      {/* Top accent line */}
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
        {/* Icon */}
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

        {/* Stats */}
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

      {/* Hover arrow */}
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

// ─── Animation Variants ─────────────────────────────────────────────────────

const EASE = [0.22, 1, 0.36, 1] as const;

const cardContainerVariants = {
  hidden: {},
  visible: {
    transition: { staggerChildren: 0.12, delayChildren: 0.8 },
  },
};

const cardVariants = {
  hidden: { opacity: 0, y: 30, scale: 0.97 },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: { duration: 0.55, ease: EASE },
  },
};

// Subtle vertical offset per card for asymmetry
const CARD_OFFSETS = ['', 'xl:-translate-y-2', 'xl:translate-y-1'];

// ─── Main Component ─────────────────────────────────────────────────────────

export default function ProjectSelector({
  projects,
  onSelect,
  onGenerate,
  isGenerating,
}: ProjectSelectorProps) {
  const [customScope, setCustomScope] = useState('');
  const [projectType, setProjectType] = useState('residential');
  const prefersReduced = useReducedMotion();

  // ─── Typing demo state ──────────────────────────────────────────────────
  const [demoText, setDemoText] = useState('');
  const [demoActive, setDemoActive] = useState(false); // starts false, activated by IntersectionObserver
  const [cursorVisible, setCursorVisible] = useState(true);
  const hasBeenVisible = useRef(false);
  const scopeSectionRef = useRef<HTMLDivElement>(null);

  // Start typing only when the scope section scrolls into view
  useEffect(() => {
    const el = scopeSectionRef.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !hasBeenVisible.current) {
          hasBeenVisible.current = true;
          setDemoActive(true);
        }
      },
      { threshold: 0.3 }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (!demoActive) return;

    let charIdx = 0;
    let interval: ReturnType<typeof setInterval>;

    const timeout = setTimeout(() => {
      interval = setInterval(() => {
        charIdx++;
        if (charIdx <= DEMO_SCOPE.length) {
          setDemoText(DEMO_SCOPE.slice(0, charIdx));
        } else {
          clearInterval(interval);
        }
      }, 45);
    }, 400);

    return () => {
      clearTimeout(timeout);
      clearInterval(interval);
    };
  }, [demoActive]);

  useEffect(() => {
    if (!demoActive) return;
    const blink = setInterval(() => setCursorVisible(v => !v), 530);
    return () => clearInterval(blink);
  }, [demoActive]);

  function handleTextareaFocus() {
    setDemoActive(false);
    setDemoText('');
  }

  function handleTextareaBlur() {
    if (!customScope && hasBeenVisible.current) {
      setDemoActive(true);
    }
  }

  function handleGenerate() {
    if (customScope.trim()) onGenerate(customScope.trim(), projectType);
  }

  return (
    <div className="relative overflow-hidden" style={{ background: 'linear-gradient(145deg, rgba(219,234,254,0.2) 0%, rgba(248,250,255,0.12) 35%, rgba(255,255,255,1) 55%, rgba(204,251,241,0.15) 100%)' }}>
      {/* Subtle gradient background + grid */}
      <svg className="absolute inset-0 w-full h-full pointer-events-none z-0" xmlns="http://www.w3.org/2000/svg">
        <defs>
          {/* Gradient for grid lines — blue to teal, matching the brand */}
          <linearGradient id="gridGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#3B82F6" />
            <stop offset="100%" stopColor="#2DD4BF" />
          </linearGradient>
          {/* Small grid cell */}
          <pattern id="smallGrid" width="28" height="28" patternUnits="userSpaceOnUse">
            <path d="M 28 0 L 0 0 0 28" fill="none" stroke="url(#gridGradient)" strokeWidth="0.5" opacity="0.25" />
          </pattern>
          {/* Large grid cell — every 5th line is bolder */}
          <pattern id="largeGrid" width="140" height="140" patternUnits="userSpaceOnUse">
            <rect width="140" height="140" fill="url(#smallGrid)" />
            <path d="M 140 0 L 0 0 0 140" fill="none" stroke="url(#gridGradient)" strokeWidth="1.2" opacity="0.3" />
          </pattern>
          {/* Mask: white = visible, black = hidden. Punch a soft hole where the heading lives (top-left area) */}
          <radialGradient id="headingHole" cx="35%" cy="16%" rx="22%" ry="12%" fx="35%" fy="16%" gradientUnits="objectBoundingBox">
            <stop offset="0%" stopColor="black" stopOpacity="1" />
            <stop offset="70%" stopColor="black" stopOpacity="0.6" />
            <stop offset="100%" stopColor="black" stopOpacity="0" />
          </radialGradient>
          <mask id="gridMask">
            {/* Start fully visible */}
            <rect width="100%" height="100%" fill="white" />
            {/* Cut out the heading area with a soft elliptical fade */}
            <ellipse cx="35%" cy="16%" rx="22%" ry="12%" fill="url(#headingHole)" />
          </mask>
        </defs>
        <rect width="100%" height="100%" fill="url(#largeGrid)" mask="url(#gridMask)" />
      </svg>

      {/* ─── Hero Section: Split Layout ─── */}
      <section className="relative max-w-[1200px] mx-auto px-8 pt-16 pb-20">
        <div className="grid grid-cols-1 xl:grid-cols-[1fr,1.2fr] gap-12 xl:gap-16 items-center">
          {/* Left: Copy */}
          <div className="text-center xl:text-left">
            {/* Headline */}
            <motion.h1
              initial={prefersReduced ? false : { opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, delay: 0.1, ease: EASE }}
              className="mb-5"
              style={{
                fontSize: 'clamp(44px, 5.5vw, 68px)',
                lineHeight: 1.08,
                letterSpacing: '-0.035em',
                fontWeight: 700,
                color: 'var(--text-primary)',
              }}
            >
              Karmen
              <br />
              <span
                style={{
                  background: 'linear-gradient(135deg, #3B82F6 0%, #2DD4BF 100%)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  backgroundClip: 'text',
                }}
              >
                Sample Demo
              </span>
            </motion.h1>

            {/* Subtitle — glass callout */}
            <motion.div
              initial={prefersReduced ? false : { opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.3, ease: EASE }}
              className="mb-8 max-w-lg mx-auto xl:mx-0 rounded-xl px-5 py-4"
              style={{
                background: 'rgba(255,255,255,0.55)',
                backdropFilter: 'blur(12px)',
                WebkitBackdropFilter: 'blur(12px)',
                border: '1px solid rgba(59,130,246,0.12)',
                boxShadow: '0 2px 12px rgba(59,130,246,0.06)',
              }}
            >
              <p
                className="text-[15px] leading-relaxed"
                style={{ color: 'var(--text-secondary)' }}
              >
                This interactive demo offers a small taste of Karmen&#39;s AI-powered
                scheduling capabilities. It doesn&#39;t showcase the full product, but
                gives you a hands-on feel for CPM generation, change order analysis,
                and Monte Carlo risk simulation.
              </p>
            </motion.div>

            {/* Feature pills */}
            <motion.div
              initial={prefersReduced ? false : { opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.45, ease: EASE }}
              className="flex flex-wrap items-center gap-2.5 justify-center xl:justify-start"
            >
              {[
                { label: 'Critical Path Analysis', color: '#EF4444' },
                { label: 'Change Order Simulation', color: '#8B5CF6' },
                { label: 'Monte Carlo Risk', color: '#3B82F6' },
              ].map((feat) => (
                <span
                  key={feat.label}
                  className="flex items-center gap-2 px-3 py-1.5 rounded-full text-[11px] font-medium"
                  style={{
                    color: 'var(--text-secondary)',
                    border: '1px solid var(--border-default)',
                    background: 'var(--bg-secondary)',
                  }}
                >
                  <span className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ backgroundColor: feat.color }} />
                  {feat.label}
                </span>
              ))}
            </motion.div>
          </div>

          {/* Right: Animated Gantt chart */}
          <div className="hidden xl:block">
            <HeroGanttAnimation />
          </div>
        </div>
      </section>

      {/* Separator line */}
      <div className="flex justify-center pb-10">
        <div className="w-96 h-px" style={{ background: 'var(--border-default)' }} />
      </div>

      {/* ─── Sample Projects ─── */}
      <section className="max-w-[1080px] mx-auto px-8 pb-16">
        <motion.div
          initial={prefersReduced ? false : { opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.65, duration: 0.4 }}
          className="mb-7"
        >
          <span
            className="text-[11px] font-medium tracking-[0.1em] uppercase"
            style={{ color: 'var(--text-muted)' }}
          >
            Select a sample project
          </span>
        </motion.div>

        <motion.div
          className="grid grid-cols-1 md:grid-cols-3 gap-5 pt-2"
          variants={cardContainerVariants}
          initial={prefersReduced ? false : 'hidden'}
          animate="visible"
        >
          {projects.map((project, i) => (
            <motion.div
              key={project.id}
              variants={cardVariants}
              className={CARD_OFFSETS[i] || ''}
            >
              <ProjectCard project={project} onClick={() => onSelect(project.id)} index={i} />
            </motion.div>
          ))}
        </motion.div>
      </section>

      {/* ─── Custom Scope ─── */}
      <section ref={scopeSectionRef} className="max-w-2xl mx-auto px-8 pb-24">
        <motion.div
          initial={prefersReduced ? false : { opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1.2, duration: 0.4, ease: EASE }}
        >
          {/* Divider */}
          <div className="flex items-center gap-4 mb-10">
            <div className="flex-1 h-px" style={{ background: 'var(--border-default)' }} />
            <span
              className="text-[11px] font-medium tracking-[0.12em] uppercase whitespace-nowrap"
              style={{ color: 'var(--text-muted)' }}
            >
              or describe your own scope
            </span>
            <div className="flex-1 h-px" style={{ background: 'var(--border-default)' }} />
          </div>

          {/* Project type pills */}
          <div className="flex items-center gap-2 mb-3.5 flex-wrap">
            <span className="text-xs font-medium" style={{ color: 'var(--text-secondary)' }}>
              Project type:
            </span>
            {PROJECT_TYPES.map((type) => (
              <button
                key={type}
                onClick={() => setProjectType(type)}
                className={`px-3 py-1 rounded-full text-xs font-medium capitalize transition-all duration-150 ${
                  projectType === type
                    ? 'text-white shadow-sm'
                    : 'hover:text-[var(--text-primary)]'
                }`}
                style={
                  projectType === type
                    ? { backgroundColor: 'var(--blue-primary)' }
                    : {
                        border: '1px solid var(--border-default)',
                        color: 'var(--text-secondary)',
                        background: 'white',
                      }
                }
              >
                {type}
              </button>
            ))}
          </div>

          {/* Textarea with typing demo overlay */}
          <div className="relative">
            <textarea
              value={customScope}
              onChange={(e) => setCustomScope(e.target.value)}
              onFocus={(e) => {
                handleTextareaFocus();
                e.currentTarget.style.borderColor = 'var(--blue-primary)';
                e.currentTarget.style.boxShadow = '0 0 0 3px rgba(59,130,246,0.08), 0 4px 12px rgba(0,0,0,0.04)';
              }}
              onBlur={(e) => {
                handleTextareaBlur();
                e.currentTarget.style.borderColor = 'var(--border-default)';
                e.currentTarget.style.boxShadow = 'var(--shadow-sm)';
              }}
              placeholder={!demoActive ? 'Describe your construction project scope...' : ''}
              rows={3}
              className="w-full px-5 py-4 text-sm rounded-xl resize-none outline-none transition-all duration-200"
              style={{
                color: 'var(--text-primary)',
                background: 'white',
                border: '1px solid var(--border-default)',
                boxShadow: 'var(--shadow-sm)',
              }}
            />
            {/* Typing demo overlay */}
            {demoActive && !customScope && (
              <div
                className="absolute inset-0 pointer-events-none px-5 py-4 text-sm rounded-xl"
                style={{ color: 'var(--text-muted)' }}
              >
                {demoText}
                <span
                  className="inline-block w-[2px] h-[15px] align-middle ml-px rounded-sm"
                  style={{
                    backgroundColor: 'var(--blue-primary)',
                    opacity: cursorVisible ? 0.6 : 0,
                    transition: 'opacity 0.08s',
                  }}
                />
              </div>
            )}
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
                  e.currentTarget.style.transform = 'translateY(-1px)';
                }
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = 'var(--blue-primary)';
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
      </section>
    </div>
  );
}
