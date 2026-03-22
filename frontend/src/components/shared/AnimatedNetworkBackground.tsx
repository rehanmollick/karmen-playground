'use client';

import { motion } from 'framer-motion';

// CPM network nodes: [x, y] in a 1140×580 viewBox
// Compressed vertical range (150–430) to minimize long diagonals
const NODES: [number, number][] = [
  [100,  290],  // 0: START
  [250,  175],  // 1: Foundation
  [250,  400],  // 2: Site Prep
  [390,  225],  // 3: Framing
  [390,  420],  // 4: Underground
  [530,  155],  // 5: Electrical Rough
  [530,  290],  // 6: Plumbing Rough
  [530,  420],  // 7: Concrete Slab
  [660,  190],  // 8: Drywall
  [660,  340],  // 9: Mechanical
  [660,  430],  // 10: Flooring
  [790,  155],  // 11: Painting
  [790,  280],  // 12: Finishes
  [790,  380],  // 13: Electrical Finish
  [790,  435],  // 14: Landscaping
  [920,  210],  // 15: Inspection
  [920,  335],  // 16: Punch List
  [920,  430],  // 17: Site Cleanup
  [1060, 290],  // 18: END
];

const EDGES: [number, number][] = [
  [0, 1], [0, 2],
  [1, 3], [2, 3], [2, 4],
  [3, 5], [3, 6], [4, 7],
  [5, 8], [6, 9], [7, 9], [7, 10],
  [8, 11], [8, 12], [9, 12], [9, 13], [10, 14],
  [11, 15], [12, 15], [12, 16], [13, 16], [13, 17], [14, 17],
  [15, 18], [16, 18], [17, 18],
];

// Critical path nodes get slightly larger radius
const CRITICAL_PATH = new Set([0, 1, 3, 6, 9, 12, 16, 18]);

export default function AnimatedNetworkBackground() {
  return (
    <div
      className="absolute inset-0 pointer-events-none overflow-hidden"
      aria-hidden="true"
    >
      <svg
        viewBox="0 0 1160 580"
        preserveAspectRatio="xMidYMid slice"
        className="w-full h-full"
      >
        {/* Edges — draw progressively using Framer Motion pathLength */}
        {EDGES.map(([from, to], i) => (
          <motion.path
            key={`e-${i}`}
            d={`M${NODES[from][0]},${NODES[from][1]} L${NODES[to][0]},${NODES[to][1]}`}
            stroke="rgba(59,130,246,0.045)"
            strokeWidth="1"
            fill="none"
            initial={{ pathLength: 0, opacity: 0 }}
            animate={{ pathLength: 1, opacity: 1 }}
            transition={{
              pathLength: { duration: 0.9, delay: 0.5 + i * 0.045, ease: 'easeOut' },
              opacity: { duration: 0.05, delay: 0.5 + i * 0.045 },
            }}
          />
        ))}

        {/* Nodes — fade in with stagger */}
        {NODES.map(([x, y], i) => {
          const isCritical = CRITICAL_PATH.has(i);
          return (
            <motion.circle
              key={`n-${i}`}
              cx={x}
              cy={y}
              r={isCritical ? 4.5 : 3}
              fill={isCritical ? 'rgba(59,130,246,0.12)' : 'rgba(59,130,246,0.07)'}
              stroke="rgba(59,130,246,0.16)"
              strokeWidth="0.75"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.55, delay: 0.08 + i * 0.05, ease: 'easeOut' }}
            />
          );
        })}
      </svg>
    </div>
  );
}
