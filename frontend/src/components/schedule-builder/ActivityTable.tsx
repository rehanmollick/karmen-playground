'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import type { Project, WBSNode } from '../../types/schedule';
import { formatDate, formatDuration } from '../../lib/formatters';

interface ActivityTableProps {
  project: Project;
  highlightedId?: string;
  flashIds?: Set<string>;
  onActivityClick?: (id: string) => void;
}

export default function ActivityTable({ project, highlightedId, flashIds, onActivityClick }: ActivityTableProps) {
  const tableRef = useRef<HTMLDivElement>(null);

  // Scroll to first flash activity
  useEffect(() => {
    if (!flashIds || flashIds.size === 0 || !tableRef.current) return;
    const firstId = Array.from(flashIds)[0];
    const row = tableRef.current.querySelector(`[data-activity-id="${firstId}"]`);
    if (row) {
      row.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  }, [flashIds]);
  const [collapsedWBS, setCollapsedWBS] = useState<Set<string>>(new Set());

  const toggleWBS = (id: string) => {
    setCollapsedWBS((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  // Build ordered list: WBS header then activities
  type Row = { type: 'wbs'; node: WBSNode; depth: number } | { type: 'activity'; actId: string; depth: number };
  const rows: Row[] = [];

  function walkWBS(node: WBSNode, depth: number) {
    rows.push({ type: 'wbs', node, depth });
    if (collapsedWBS.has(node.id)) return;

    node.activities.forEach((actId) => {
      rows.push({ type: 'activity', actId, depth: depth + 1 });
    });
    node.children.forEach((child) => walkWBS(child, depth + 1));
  }

  project.wbs.forEach((node) => walkWBS(node, 0));

  const activityMap = new Map(project.activities.map((a) => [a.id, a]));

  return (
    <div ref={tableRef} className="overflow-x-auto overflow-y-auto h-full">
      <table className="w-full border-collapse text-sm" style={{ minWidth: 560 }}>
        <thead className="sticky top-0 bg-[var(--bg-secondary)] z-10">
          <tr>
            <th className="text-left px-3 py-2 text-xs font-medium text-[var(--text-muted)] border-b border-[var(--border-default)] w-24 font-mono">
              ID
            </th>
            <th className="text-left px-3 py-2 text-xs font-medium text-[var(--text-muted)] border-b border-[var(--border-default)]">
              Name
            </th>
            <th className="text-left px-3 py-2 text-xs font-medium text-[var(--text-muted)] border-b border-[var(--border-default)] w-24 font-mono">
              Start
            </th>
            <th className="text-left px-3 py-2 text-xs font-medium text-[var(--text-muted)] border-b border-[var(--border-default)] w-24 font-mono">
              Finish
            </th>
            <th className="text-right px-3 py-2 text-xs font-medium text-[var(--text-muted)] border-b border-[var(--border-default)] w-16 font-mono">
              Dur
            </th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => {
            if (row.type === 'wbs') {
              const isCollapsed = collapsedWBS.has(row.node.id);
              return (
                <tr
                  key={`wbs-${row.node.id}`}
                  className="bg-[var(--bg-secondary)] cursor-pointer hover:bg-[var(--bg-tertiary)]"
                  onClick={() => toggleWBS(row.node.id)}
                >
                  <td
                    colSpan={5}
                    className="px-3 py-1.5 border-b border-[var(--border-subtle)]"
                    style={{ paddingLeft: `${12 + row.depth * 16}px` }}
                  >
                    <div className="flex items-center gap-1.5">
                      <span className="text-[var(--text-muted)] text-xs transition-transform" style={{ transform: isCollapsed ? 'rotate(-90deg)' : 'none' }}>
                        ▼
                      </span>
                      <span className="text-xs font-medium text-[var(--text-secondary)]">{row.node.name}</span>
                    </div>
                  </td>
                </tr>
              );
            }

            const activity = activityMap.get(row.actId);
            if (!activity) return null;
            const isHighlighted = activity.id === highlightedId;
            const isFlashing = flashIds?.has(activity.id);

            return (
              <tr
                key={`act-${activity.id}`}
                data-activity-id={activity.id}
                className={`
                  border-b border-[var(--border-subtle)] cursor-pointer transition-colors
                  ${isFlashing ? 'animate-flash-highlight' : isHighlighted ? 'bg-[var(--blue-light)]' : 'hover:bg-[var(--bg-tertiary)]'}
                `}
                onClick={() => onActivityClick?.(activity.id)}
              >
                <td
                  className="px-3 py-1.5 font-mono text-xs text-[var(--text-secondary)]"
                  style={{ paddingLeft: `${12 + row.depth * 16}px` }}
                >
                  <span className={`${activity.is_critical ? 'text-[var(--critical-red)]' : ''}`}>
                    {activity.id}
                  </span>
                  {activity.is_milestone && (
                    <span className="ml-1 text-[8px] text-[var(--text-muted)]">◆</span>
                  )}
                </td>
                <td className="px-3 py-1.5 text-xs text-[var(--text-primary)] max-w-[200px] truncate">
                  {activity.name}
                </td>
                <td className="px-3 py-1.5 font-mono text-xs text-[var(--text-secondary)] whitespace-nowrap">
                  {formatDate(activity.early_start || activity.start_date)}
                </td>
                <td className="px-3 py-1.5 font-mono text-xs text-[var(--text-secondary)] whitespace-nowrap">
                  {formatDate(activity.early_finish || activity.end_date)}
                </td>
                <td className="px-3 py-1.5 font-mono text-xs text-[var(--text-secondary)] text-right">
                  {formatDuration(activity.duration_days)}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
