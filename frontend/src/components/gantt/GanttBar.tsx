'use client';

import { useState } from 'react';
import type { GanttBarData } from '../../lib/ganttUtils';
import { ROW_HEIGHT } from '../../lib/ganttUtils';
import { formatDate, formatDuration } from '../../lib/formatters';

interface GanttBarProps {
  bar: GanttBarData;
  highlighted?: boolean;
  newActivity?: boolean;    // purple — fragnet new
  modifiedActivity?: boolean; // amber — fragnet modified
}

export default function GanttBar({ bar, highlighted, newActivity, modifiedActivity }: GanttBarProps) {
  const [tooltip, setTooltip] = useState(false);
  const { activity, left, width, row } = bar;

  const isMilestone = activity.is_milestone;
  const isCritical = activity.is_critical;

  let barColor = 'var(--gantt-bar)';
  if (newActivity) barColor = 'var(--fragnet-new)';
  else if (modifiedActivity) barColor = 'var(--fragnet-modified)';
  else if (isCritical) barColor = 'var(--critical-red)';
  else if (highlighted) barColor = 'var(--blue-hover)';

  const barTop = row * ROW_HEIGHT + (ROW_HEIGHT - 20) / 2;

  if (isMilestone) {
    const cx = left;
    const cy = barTop + 10;
    const size = 8;
    return (
      <g
        onMouseEnter={() => setTooltip(true)}
        onMouseLeave={() => setTooltip(false)}
        className="cursor-pointer"
      >
        <polygon
          points={`${cx},${cy - size} ${cx + size},${cy} ${cx},${cy + size} ${cx - size},${cy}`}
          fill="var(--gantt-milestone)"
        />
        {tooltip && (
          <TooltipBox activity={activity} x={cx} y={cy - size - 8} />
        )}
      </g>
    );
  }

  return (
    <g
      onMouseEnter={() => setTooltip(true)}
      onMouseLeave={() => setTooltip(false)}
      className="cursor-pointer"
    >
      <rect
        x={left}
        y={barTop}
        width={Math.max(width, 4)}
        height={20}
        fill={barColor}
        rx={0}
        opacity={newActivity || modifiedActivity ? 0.85 : 1}
      />
      {width > 48 && (
        <text
          x={left + 4}
          y={barTop + 13}
          fontSize={10}
          fill="white"
          fontFamily="JetBrains Mono, monospace"
          clipPath={`inset(0 0 0 ${left}px)`}
        >
          {activity.id}
        </text>
      )}
      {tooltip && (
        <TooltipBox activity={activity} x={left + width / 2} y={barTop - 8} />
      )}
    </g>
  );
}

function TooltipBox({ activity, x, y }: { activity: GanttBarProps['bar']['activity']; x: number; y: number }) {
  const lines = [
    activity.id,
    activity.name.length > 30 ? activity.name.slice(0, 28) + '…' : activity.name,
    `${formatDuration(activity.duration_days)} · Float: ${activity.total_float ?? '—'}d`,
    `ES: ${formatDate(activity.early_start)} · EF: ${formatDate(activity.early_finish)}`,
  ];
  const width = 220;
  const lineH = 14;
  const padding = 8;
  const height = lines.length * lineH + padding * 2;
  const tx = Math.max(width / 2, x) - width / 2;
  const ty = y - height;

  return (
    <g>
      <rect x={tx} y={ty} width={width} height={height} fill="var(--text-primary)" rx={4} opacity={0.92} />
      {lines.map((line, i) => (
        <text
          key={i}
          x={tx + padding}
          y={ty + padding + (i + 1) * lineH - 2}
          fontSize={10}
          fill="white"
          fontFamily={i <= 1 ? 'Inter, sans-serif' : 'JetBrains Mono, monospace'}
          fontWeight={i === 0 ? 600 : 400}
        >
          {line}
        </text>
      ))}
    </g>
  );
}
