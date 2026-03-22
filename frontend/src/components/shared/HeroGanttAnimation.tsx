'use client';

import { motion, useReducedMotion } from 'framer-motion';

// Realistic construction schedule for the hero animation
const TASKS = [
  { name: 'Site Preparation',    start: 0,  dur: 12, critical: true },
  { name: 'Foundation Work',     start: 12, dur: 16, critical: true },
  { name: 'Structural Steel',    start: 28, dur: 18, critical: true },
  { name: 'Electrical Rough-In', start: 32, dur: 12, critical: false },
  { name: 'Plumbing Systems',    start: 34, dur: 10, critical: false },
  { name: 'HVAC Installation',   start: 44, dur: 14, critical: false },
  { name: 'Exterior Envelope',   start: 46, dur: 18, critical: true },
  { name: 'Interior Finishes',   start: 64, dur: 18, critical: true },
  { name: 'MEP Trim-Out',        start: 66, dur: 12, critical: false },
  { name: 'Final Inspection',    start: 82, dur: 6,  critical: true },
];

const TOTAL = 92;
const ROW_H = 30;
const LABEL_W = 128;
const CHART_W = 360;
const HDR_H = 24;
const PAD_T = 8;
const PAD_B = 24;
const SVG_W = LABEL_W + CHART_W + 12;
const SVG_H = HDR_H + PAD_T + TASKS.length * ROW_H + PAD_B;

// Critical path flow
const CRIT_DEPS: [number, number][] = [
  [0, 1], [1, 2], [2, 6], [6, 7], [7, 9],
];

const EASE = [0.22, 1, 0.36, 1] as const;

export default function HeroGanttAnimation() {
  const reduced = useReducedMotion();

  const dayX = (d: number) => LABEL_W + (d / TOTAL) * CHART_W;
  const rowY = (i: number) => HDR_H + PAD_T + i * ROW_H;

  // Bi-weekly markers
  const markers = Array.from({ length: 8 }, (_, i) => i * 14).filter(d => d <= TOTAL);

  return (
    <motion.div
      className="relative"
      initial={reduced ? false : { opacity: 0, y: 24, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.8, delay: 0.4, ease: EASE }}
    >
      <div
        className="rounded-xl overflow-hidden"
        style={{
          border: '1px solid var(--border-default)',
          boxShadow: '0 12px 40px -8px rgba(0,0,0,0.07), 0 2px 6px rgba(0,0,0,0.03)',
          background: 'white',
        }}
      >
        {/* Window chrome */}
        <div
          className="flex items-center gap-1.5 px-3 py-2 border-b"
          style={{ borderColor: 'var(--border-subtle)', background: 'var(--bg-secondary)' }}
        >
          <div className="flex gap-1.5">
            <div className="w-2 h-2 rounded-full" style={{ background: '#FF5F57' }} />
            <div className="w-2 h-2 rounded-full" style={{ background: '#FEBC2E' }} />
            <div className="w-2 h-2 rounded-full" style={{ background: '#28C840' }} />
          </div>
          <span
            className="ml-2 text-[9px]"
            style={{ color: 'var(--text-muted)', fontFamily: "'JetBrains Mono', monospace" }}
          >
            CPM Schedule — Demo Project
          </span>
        </div>

        <svg viewBox={`0 0 ${SVG_W} ${SVG_H}`} className="w-full block" style={{ background: 'white' }}>
          {/* Grid lines */}
          {markers.map(d => (
            <line
              key={d}
              x1={dayX(d)} y1={HDR_H}
              x2={dayX(d)} y2={SVG_H - PAD_B + 4}
              stroke="var(--gantt-grid)" strokeWidth={0.5}
            />
          ))}

          {/* Week labels */}
          {markers.slice(0, -1).map((d, i) => (
            <text
              key={d}
              x={dayX(d + 7)} y={HDR_H - 6}
              textAnchor="middle"
              fill="var(--text-muted)" fontSize={8}
              fontFamily="'JetBrains Mono', monospace"
            >
              Wk {i * 2 + 1}
            </text>
          ))}

          {/* Label / chart separator */}
          <line
            x1={LABEL_W - 2} y1={HDR_H - 2}
            x2={LABEL_W - 2} y2={SVG_H - PAD_B + 4}
            stroke="var(--border-subtle)" strokeWidth={0.5}
          />

          {/* Task rows */}
          {TASKS.map((task, i) => {
            const y = rowY(i);
            const bx = dayX(task.start);
            const bw = (task.dur / TOTAL) * CHART_W;

            return (
              <motion.g
                key={i}
                initial={reduced ? false : { opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.7 + i * 0.1, duration: 0.3 }}
              >
                {/* Alternating row tint */}
                {i % 2 === 0 && (
                  <rect x={0} y={y} width={SVG_W} height={ROW_H} fill="var(--bg-secondary)" opacity={0.3} />
                )}

                {/* Task name */}
                <motion.text
                  x={8} y={y + ROW_H / 2 + 1}
                  dominantBaseline="middle"
                  fill={task.critical ? 'var(--text-primary)' : 'var(--text-secondary)'}
                  fontWeight={task.critical ? 500 : 400}
                  fontSize={10}
                  fontFamily="Inter, sans-serif"
                  initial={reduced ? false : { opacity: 0, x: -6 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.6 + i * 0.1, duration: 0.3, ease: EASE }}
                >
                  {task.name}
                </motion.text>

                {/* Gantt bar */}
                <motion.rect
                  x={bx} y={y + 8}
                  height={ROW_H - 16}
                  rx={2}
                  fill={task.critical ? 'var(--critical-red)' : 'var(--gantt-bar)'}
                  opacity={task.critical ? 0.85 : 0.6}
                  initial={reduced ? { width: bw } : { width: 0 }}
                  animate={{ width: bw }}
                  transition={{ delay: 0.8 + i * 0.1, duration: 0.5, ease: EASE }}
                />
              </motion.g>
            );
          })}

          {/* Critical path dependency arrows */}
          {CRIT_DEPS.map(([fi, ti], di) => {
            const from = TASKS[fi];
            const to = TASKS[ti];
            const x1 = dayX(from.start + from.dur);
            const y1 = rowY(fi) + ROW_H / 2;
            const x2 = dayX(to.start);
            const y2 = rowY(ti) + ROW_H / 2;

            // Bezier curve that bows right, proportional to vertical span
            const vDist = Math.abs(y2 - y1);
            const bulge = Math.max(x1, x2) + 6 + vDist * 0.12;
            const d = `M ${x1} ${y1} C ${bulge} ${y1}, ${bulge} ${y2}, ${x2} ${y2}`;

            return (
              <motion.path
                key={`dep-${di}`}
                d={d}
                fill="none"
                stroke="var(--gantt-dependency)"
                strokeWidth={0.75}
                initial={reduced ? false : { pathLength: 0, opacity: 0 }}
                animate={{ pathLength: 1, opacity: 0.4 }}
                transition={{ delay: 2.0 + di * 0.1, duration: 0.4, ease: 'easeOut' }}
              />
            );
          })}

          {/* Legend */}
          <motion.g
            initial={reduced ? false : { opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 2.8, duration: 0.4 }}
          >
            <rect x={LABEL_W + 2} y={SVG_H - 16} width={7} height={7} rx={1.5} fill="var(--critical-red)" opacity={0.85} />
            <text x={LABEL_W + 13} y={SVG_H - 10} fill="var(--text-muted)" fontSize={8} fontFamily="Inter, sans-serif">
              Critical Path
            </text>
            <rect x={LABEL_W + 78} y={SVG_H - 16} width={7} height={7} rx={1.5} fill="var(--gantt-bar)" opacity={0.6} />
            <text x={LABEL_W + 89} y={SVG_H - 10} fill="var(--text-muted)" fontSize={8} fontFamily="Inter, sans-serif">
              Non-Critical
            </text>
          </motion.g>
        </svg>
      </div>

      {/* Ambient glow behind card */}
      <div
        className="absolute -inset-8 -z-10 rounded-3xl pointer-events-none"
        style={{
          background: 'radial-gradient(ellipse at center, rgba(59,130,246,0.04) 0%, transparent 65%)',
          filter: 'blur(24px)',
        }}
      />
    </motion.div>
  );
}
