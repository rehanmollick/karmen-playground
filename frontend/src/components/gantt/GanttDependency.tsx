'use client';

import type { GanttBarData } from '../../lib/ganttUtils';
import { ROW_HEIGHT } from '../../lib/ganttUtils';

interface GanttDependencyProps {
  fromBar: GanttBarData;
  toBar: GanttBarData;
}

export default function GanttDependency({ fromBar, toBar }: GanttDependencyProps) {
  const fromMid = fromBar.row * ROW_HEIGHT + ROW_HEIGHT / 2;
  const toMid = toBar.row * ROW_HEIGHT + ROW_HEIGHT / 2;

  const x1 = fromBar.left + fromBar.width;
  const x2 = toBar.left;

  const margin = 6;
  const arrowSize = 5;

  let path: string;
  if (x2 > x1 + margin * 2) {
    // Straight right then down/up
    const midX = x1 + margin;
    path = `M ${x1} ${fromMid} H ${midX} V ${toMid} H ${x2 - arrowSize}`;
  } else {
    // Step around
    const detourX = x1 + margin;
    const belowY = Math.max(fromMid, toMid) + ROW_HEIGHT * 0.4;
    path = `M ${x1} ${fromMid} H ${detourX} V ${belowY} H ${x2 - margin} V ${toMid} H ${x2 - arrowSize}`;
  }

  return (
    <g>
      <path
        d={path}
        fill="none"
        stroke="var(--gantt-dependency)"
        strokeWidth={1.5}
        markerEnd="url(#arrowhead)"
      />
    </g>
  );
}

export function ArrowheadDef() {
  return (
    <defs>
      <marker
        id="arrowhead"
        markerWidth="6"
        markerHeight="6"
        refX="3"
        refY="3"
        orient="auto"
      >
        <path d="M 0 0 L 6 3 L 0 6 Z" fill="var(--gantt-dependency)" />
      </marker>
    </defs>
  );
}
