'use client';

import { useEffect, useRef } from 'react';
import { motion, useReducedMotion } from 'framer-motion';

// ─── Background: dot grid + floating accent nodes + elegant flowing paths ────
// Design: clean blueprint feel (like linear.app / resend.com) with organic motion.
// A few curated curved paths suggest a CPM network without ugly polygon shapes.

// Generate a regular grid of tiny dots (graph paper texture)
const GRID_SPACING = 48;
const GRID_COLS = Math.ceil(1400 / GRID_SPACING);
const GRID_ROWS = Math.ceil(800 / GRID_SPACING);
const GRID_DOTS: [number, number][] = [];
for (let row = 0; row < GRID_ROWS; row++) {
  for (let col = 0; col < GRID_COLS; col++) {
    GRID_DOTS.push([col * GRID_SPACING + 24, row * GRID_SPACING + 16]);
  }
}

// Larger accent nodes — key milestones floating organically
const ACCENT_NODES: { x: number; y: number; r: number; delay: number; drift: [number, number]; pulse?: boolean }[] = [
  { x: 120,  y: 140,  r: 5,   delay: 0.2,  drift: [0, -8],  pulse: true },
  { x: 380,  y: 80,   r: 4.5, delay: 0.4,  drift: [5, 0] },
  { x: 280,  y: 350,  r: 4,   delay: 0.35, drift: [-4, 5] },
  { x: 580,  y: 220,  r: 6,   delay: 0.15, drift: [0, 6],   pulse: true },
  { x: 750,  y: 120,  r: 4,   delay: 0.5,  drift: [4, -4] },
  { x: 900,  y: 380,  r: 5,   delay: 0.3,  drift: [-5, 0],  pulse: true },
  { x: 1080, y: 180,  r: 5,   delay: 0.4,  drift: [0, 5] },
  { x: 1200, y: 320,  r: 4,   delay: 0.55, drift: [3, -5] },
  { x: 480,  y: 450,  r: 3.5, delay: 0.6,  drift: [-3, -4] },
  { x: 1320, y: 200,  r: 3.5, delay: 0.65, drift: [0, 4] },
  { x: 200,  y: 500,  r: 4,   delay: 0.45, drift: [4, -3] },
  { x: 700,  y: 500,  r: 3.5, delay: 0.7,  drift: [-2, 3] },
];

// Elegant curved paths — suggest schedule dependencies without creating polygon shapes
// Using quadratic bezier curves for organic feel. Only 4 curated paths.
const FLOWING_PATHS = [
  'M 120 140 Q 250 60 380 80',       // node 0 → node 1
  'M 580 220 Q 660 170 750 120',     // node 3 → node 4
  'M 900 380 Q 990 280 1080 180',    // node 5 → node 6
  'M 280 350 Q 380 400 480 450',     // node 2 → node 8
];

export default function AnimatedNetworkBackground() {
  const containerRef = useRef<HTMLDivElement>(null);
  const prefersReduced = useReducedMotion();

  // Subtle mouse parallax on the accent layer
  useEffect(() => {
    if (prefersReduced) return;
    const el = containerRef.current?.querySelector<SVGGElement>('.accent-layer');
    if (!el) return;

    function handleMouseMove(e: MouseEvent) {
      const x = (e.clientX / window.innerWidth - 0.5) * 14;
      const y = (e.clientY / window.innerHeight - 0.5) * 10;
      el!.style.transform = `translate(${x}px, ${y}px)`;
    }

    window.addEventListener('mousemove', handleMouseMove, { passive: true });
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, [prefersReduced]);

  return (
    <div
      ref={containerRef}
      className="absolute inset-0 pointer-events-none overflow-hidden"
      aria-hidden="true"
    >
      {/* Multi-layer gradient wash — slow drifting */}
      <div
        className="absolute inset-0"
        style={{
          background: `
            radial-gradient(ellipse 70% 55% at 20% 30%, rgba(59,130,246,0.06) 0%, transparent 70%),
            radial-gradient(ellipse 55% 65% at 80% 45%, rgba(45,212,191,0.04) 0%, transparent 70%),
            radial-gradient(ellipse 40% 40% at 50% 70%, rgba(59,130,246,0.03) 0%, transparent 60%)
          `,
          animation: prefersReduced ? 'none' : 'gradientDrift 25s ease-in-out infinite alternate',
        }}
      />

      <svg
        viewBox="0 0 1400 800"
        preserveAspectRatio="xMidYMid slice"
        className="w-full h-full"
      >
        {/* Dot grid — subtle graph-paper texture, slightly more visible */}
        {GRID_DOTS.map(([x, y], i) => (
          <circle
            key={`g-${i}`}
            cx={x}
            cy={y}
            r={1.1}
            fill="rgba(59,130,246,0.09)"
          />
        ))}

        {/* Flowing curved paths — draw on with animation */}
        <g className="accent-layer" style={{ transition: 'transform 0.4s ease-out', willChange: 'transform' }}>
          {FLOWING_PATHS.map((d, i) => (
            <motion.path
              key={`p-${i}`}
              d={d}
              fill="none"
              stroke="rgba(59,130,246,0.10)"
              strokeWidth="1"
              strokeDasharray="4 6"
              initial={prefersReduced ? { pathLength: 1 } : { pathLength: 0, opacity: 0 }}
              animate={
                prefersReduced
                  ? { pathLength: 1 }
                  : { pathLength: 1, opacity: 1 }
              }
              transition={
                prefersReduced
                  ? { duration: 0 }
                  : {
                      pathLength: { duration: 2, delay: 0.5 + i * 0.3, ease: [0.22, 1, 0.36, 1] },
                      opacity: { duration: 0.4, delay: 0.5 + i * 0.3 },
                    }
              }
            />
          ))}

          {/* Accent nodes — larger, animated, with gentle drift */}
          {ACCENT_NODES.map((node, i) => (
            <g key={`a-${i}`}>
              {/* Soft glow halo on pulse nodes */}
              {node.pulse && (
                <motion.circle
                  cx={node.x}
                  cy={node.y}
                  r={node.r * 3}
                  fill="rgba(59,130,246,0.03)"
                  initial={prefersReduced ? { opacity: 1 } : { opacity: 0, scale: 0.5 }}
                  animate={
                    prefersReduced
                      ? { opacity: 1 }
                      : {
                          opacity: [0, 0.6, 0],
                          scale: [0.5, 1.2, 0.5],
                        }
                  }
                  transition={
                    prefersReduced
                      ? { duration: 0 }
                      : {
                          duration: 6,
                          delay: node.delay + 2,
                          ease: 'easeInOut',
                          repeat: Infinity,
                        }
                  }
                />
              )}
              <motion.circle
                cx={node.x}
                cy={node.y}
                r={node.r}
                fill="rgba(59,130,246,0.14)"
                stroke="rgba(59,130,246,0.20)"
                strokeWidth="1"
                initial={prefersReduced ? { opacity: 1 } : { opacity: 0, scale: 0.3 }}
                animate={
                  prefersReduced
                    ? { opacity: 1 }
                    : {
                        opacity: 1,
                        scale: 1,
                        x: [0, node.drift[0], 0],
                        y: [0, node.drift[1], 0],
                      }
                }
                transition={
                  prefersReduced
                    ? { duration: 0 }
                    : {
                        opacity: { duration: 0.6, delay: node.delay },
                        scale: { duration: 0.6, delay: node.delay, ease: [0.22, 1, 0.36, 1] },
                        x: { duration: 8, delay: node.delay + 1, ease: 'easeInOut', repeat: Infinity, repeatType: 'reverse' as const },
                        y: { duration: 8, delay: node.delay + 1, ease: 'easeInOut', repeat: Infinity, repeatType: 'reverse' as const },
                      }
                }
              />
            </g>
          ))}
        </g>
      </svg>
    </div>
  );
}
