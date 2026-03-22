'use client';

import { useEffect, useRef } from 'react';
import { motion, useReducedMotion } from 'framer-motion';

// ─── CPM Network Layout ──────────────────────────────────────────────────────
// Expanded viewBox with more nodes for visual density.
// Layout represents a realistic construction CPM network.

const NODES: [number, number][] = [
  // Main network (construction phases left-to-right)
  [120,  320],   // 0:  START
  [240,  180],   // 1:  Permits
  [240,  420],   // 2:  Site Prep
  [380,  140],   // 3:  Foundation
  [380,  280],   // 4:  Grading
  [380,  440],   // 5:  Underground Util
  [520,  100],   // 6:  Steel Erection
  [520,  230],   // 7:  Framing
  [520,  360],   // 8:  Plumbing Rough
  [520,  480],   // 9:  Concrete Slab
  [660,  140],   // 10: Electrical Rough
  [660,  260],   // 11: HVAC
  [660,  380],   // 12: Fire Protection
  [660,  480],   // 13: Flooring
  [800,  110],   // 14: Drywall
  [800,  240],   // 15: Insulation
  [800,  370],   // 16: Painting
  [800,  470],   // 17: Tile
  [940,  160],   // 18: Finishes
  [940,  310],   // 19: MEP Trim
  [940,  440],   // 20: Landscaping
  [1080, 300],   // 21: Inspection
  [1200, 300],   // 22: END
  // Decorative scatter nodes (peripheral visual texture)
  [60,   140],   // 23
  [60,   460],   // 24
  [180,  60],    // 25
  [180,  520],   // 26
  [440,  40],    // 27
  [600,  540],   // 28
  [740,  40],    // 29
  [880,  540],   // 30
  [1020, 60],    // 31
  [1020, 520],   // 32
  [1160, 140],   // 33
  [1160, 460],   // 34
  [1280, 200],   // 35
  [1280, 400],   // 36
];

const EDGES: [number, number][] = [
  // Main network flow
  [0, 1], [0, 2],
  [1, 3], [1, 4], [2, 4], [2, 5],
  [3, 6], [3, 7], [4, 7], [4, 8], [5, 8], [5, 9],
  [6, 10], [7, 10], [7, 11], [8, 11], [8, 12], [9, 12], [9, 13],
  [10, 14], [10, 15], [11, 15], [11, 16], [12, 16], [12, 17], [13, 17],
  [14, 18], [15, 18], [15, 19], [16, 19], [16, 20], [17, 20],
  [18, 21], [19, 21], [20, 21],
  [21, 22],
  // Decorative connections (scatter nodes to main network)
  [23, 0], [24, 0], [25, 1], [26, 2],
  [27, 6], [28, 9], [29, 10], [30, 13],
  [31, 18], [32, 20], [33, 22], [34, 22], [35, 22], [36, 22],
];

// Critical path: START→Permits→Foundation→Framing→HVAC→Painting→MEP Trim→Inspection→END
const CRITICAL_PATH_NODES = new Set([0, 1, 3, 7, 11, 16, 19, 21, 22]);
// Edge indices: 0→1=0, 1→3=2, 3→7=7, 7→11=14, 11→16=22, 16→19=29, 19→21=33, 21→22=35
const CRITICAL_PATH_EDGES = new Set([0, 2, 7, 14, 22, 29, 33, 35]);

const DECORATIVE_NODES = new Set([23, 24, 25, 26, 27, 28, 29, 30, 31, 32, 33, 34, 35, 36]);

export default function AnimatedNetworkBackground() {
  const svgRef = useRef<SVGSVGElement>(null);
  const prefersReduced = useReducedMotion();

  // Mouse parallax — shift the entire SVG slightly based on cursor position
  useEffect(() => {
    if (prefersReduced) return;
    const svg = svgRef.current;
    if (!svg) return;

    function handleMouseMove(e: MouseEvent) {
      const x = (e.clientX / window.innerWidth - 0.5) * 12;
      const y = (e.clientY / window.innerHeight - 0.5) * 8;
      svg!.style.transform = `translate(${x}px, ${y}px)`;
    }

    window.addEventListener('mousemove', handleMouseMove, { passive: true });
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, [prefersReduced]);

  return (
    <div
      className="absolute inset-0 pointer-events-none overflow-hidden"
      aria-hidden="true"
    >
      <svg
        ref={svgRef}
        viewBox="-40 -20 1380 600"
        preserveAspectRatio="xMidYMid slice"
        className="w-full h-full"
        style={{
          transition: 'transform 0.3s ease-out',
          willChange: 'transform',
        }}
      >
        <defs>
          {/* Radial fade so network fades at edges */}
          <radialGradient id="netFade" cx="50%" cy="45%" r="55%">
            <stop offset="0%" stopColor="white" stopOpacity="1" />
            <stop offset="75%" stopColor="white" stopOpacity="1" />
            <stop offset="100%" stopColor="white" stopOpacity="0" />
          </radialGradient>
          <mask id="netMask">
            <rect x="-40" y="-20" width="1380" height="600" fill="url(#netFade)" />
          </mask>
        </defs>

        <g mask="url(#netMask)">
          {/* Background edges — draw progressively */}
          {EDGES.map(([from, to], i) => {
            const isCritical = CRITICAL_PATH_EDGES.has(i);
            const isDecorative = DECORATIVE_NODES.has(from) || DECORATIVE_NODES.has(to);
            return (
              <motion.path
                key={`e-${i}`}
                d={`M${NODES[from][0]},${NODES[from][1]} L${NODES[to][0]},${NODES[to][1]}`}
                stroke={
                  isCritical
                    ? 'rgba(59,130,246,0.10)'
                    : isDecorative
                    ? 'rgba(59,130,246,0.025)'
                    : 'rgba(59,130,246,0.055)'
                }
                strokeWidth={isCritical ? 1.25 : isDecorative ? 0.5 : 0.75}
                fill="none"
                initial={prefersReduced ? { pathLength: 1, opacity: 1 } : { pathLength: 0, opacity: 0 }}
                animate={{ pathLength: 1, opacity: 1 }}
                transition={
                  prefersReduced
                    ? { duration: 0 }
                    : {
                        pathLength: { duration: 1.2, delay: 0.3 + i * 0.04, ease: 'easeOut' },
                        opacity: { duration: 0.05, delay: 0.3 + i * 0.04 },
                      }
                }
              />
            );
          })}

          {/* Critical path pulse — animated dash that flows along critical edges */}
          {!prefersReduced &&
            EDGES.filter((_, i) => CRITICAL_PATH_EDGES.has(i)).map(([from, to], idx) => (
              <motion.path
                key={`cp-${idx}`}
                d={`M${NODES[from][0]},${NODES[from][1]} L${NODES[to][0]},${NODES[to][1]}`}
                stroke="rgba(59,130,246,0.15)"
                strokeWidth="1.5"
                fill="none"
                strokeDasharray="6 14"
                initial={{ strokeDashoffset: 20, opacity: 0 }}
                animate={{ strokeDashoffset: [20, 0], opacity: [0, 0.6, 0] }}
                transition={{
                  strokeDashoffset: {
                    duration: 3,
                    delay: 2.5 + idx * 0.4,
                    ease: 'linear',
                    repeat: Infinity,
                    repeatDelay: 6,
                  },
                  opacity: {
                    duration: 3,
                    delay: 2.5 + idx * 0.4,
                    ease: 'easeInOut',
                    repeat: Infinity,
                    repeatDelay: 6,
                  },
                }}
              />
            ))}

          {/* Nodes — fade in with stagger */}
          {NODES.map(([x, y], i) => {
            const isCritical = CRITICAL_PATH_NODES.has(i);
            const isDecorative = DECORATIVE_NODES.has(i);
            return (
              <motion.circle
                key={`n-${i}`}
                cx={x}
                cy={y}
                r={isCritical ? 5 : isDecorative ? 2 : 3.5}
                fill={
                  isCritical
                    ? 'rgba(59,130,246,0.12)'
                    : isDecorative
                    ? 'rgba(59,130,246,0.035)'
                    : 'rgba(59,130,246,0.07)'
                }
                stroke={
                  isCritical
                    ? 'rgba(59,130,246,0.20)'
                    : isDecorative
                    ? 'none'
                    : 'rgba(59,130,246,0.10)'
                }
                strokeWidth={isCritical ? 1 : 0.75}
                initial={prefersReduced ? { opacity: 1 } : { opacity: 0, scale: 0.5 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={
                  prefersReduced
                    ? { duration: 0 }
                    : { duration: 0.5, delay: 0.1 + i * 0.04, ease: [0.22, 1, 0.36, 1] }
                }
              />
            );
          })}

          {/* Critical path node rings — subtle pulsing halos */}
          {!prefersReduced &&
            NODES.filter((_, i) => CRITICAL_PATH_NODES.has(i)).map(([x, y], idx) => (
              <motion.circle
                key={`halo-${idx}`}
                cx={x}
                cy={y}
                r={7}
                fill="none"
                stroke="rgba(59,130,246,0.08)"
                strokeWidth="0.75"
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: [0, 0.3, 0], scale: [0.8, 1.3, 1.6] }}
                transition={{
                  duration: 3,
                  delay: 3 + idx * 0.5,
                  ease: 'easeOut',
                  repeat: Infinity,
                  repeatDelay: 8,
                }}
              />
            ))}
        </g>
      </svg>
    </div>
  );
}
