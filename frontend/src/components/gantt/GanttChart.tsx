'use client';

import { useRef, useState, useEffect } from 'react';
import type { Project } from '../../types/schedule';
import { buildGanttLayout, barById, DAY_WIDTH, ROW_HEIGHT } from '../../lib/ganttUtils';
import GanttTimeline from './GanttTimeline';
import GanttBar from './GanttBar';
import GanttDependency, { ArrowheadDef } from './GanttDependency';

interface GanttChartProps {
  project: Project;
  highlightedId?: string;
  flashIds?: Set<string>;
  newActivityIds?: Set<string>;
  modifiedActivityIds?: Set<string>;
}

export default function GanttChart({
  project,
  highlightedId,
  flashIds,
  newActivityIds,
  modifiedActivityIds,
}: GanttChartProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [zoom, setZoom] = useState(1);
  const [isFullscreen, setIsFullscreen] = useState(false);

  function toggleFullscreen() {
    if (!containerRef.current) return;
    if (!document.fullscreenElement) {
      containerRef.current.requestFullscreen().then(() => setIsFullscreen(true)).catch(() => { /* Fullscreen may be blocked by browser/iframe policy */ });
    } else {
      document.exitFullscreen().then(() => setIsFullscreen(false)).catch(() => { /* Already exited */ });
    }
  }

  useEffect(() => {
    function onFSChange() {
      setIsFullscreen(!!document.fullscreenElement);
    }
    document.addEventListener('fullscreenchange', onFSChange);
    return () => document.removeEventListener('fullscreenchange', onFSChange);
  }, []);

  const layout = buildGanttLayout(project);
  const { weeks, bars, totalDays } = layout;
  const barsMap = barById(bars);

  // Scroll to first flash activity
  useEffect(() => {
    if (!flashIds || flashIds.size === 0 || !scrollRef.current) return;
    const firstId = Array.from(flashIds)[0];
    const bar = bars.find((b) => b.activity.id === firstId);
    if (bar) {
      const scrollTop = bar.row * ROW_HEIGHT - scrollRef.current.clientHeight / 3;
      const scrollLeft = bar.left * zoom - scrollRef.current.clientWidth / 3;
      scrollRef.current.scrollTo({
        top: Math.max(0, scrollTop),
        left: Math.max(0, scrollLeft),
        behavior: 'smooth',
      });
    }
  }, [flashIds, bars, zoom]);

  const svgWidth = totalDays * DAY_WIDTH * zoom;

  // Build dependency lines
  const depLines: Array<{ from: string; to: string }> = [];
  project.activities.forEach((activity) => {
    activity.predecessors?.forEach((dep) => {
      if (dep.type === 'FS') {
        depLines.push({ from: dep.predecessor_id, to: activity.id });
      }
    });
  });

  return (
    <div ref={containerRef} className={`flex flex-col h-full ${isFullscreen ? 'bg-white' : ''}`}>
      {/* Controls */}
      <div className="flex items-center justify-between px-3 py-2 border-b border-[var(--border-subtle)] bg-[var(--bg-secondary)]">
        <span className="text-xs text-[var(--text-muted)]">
          {project.activities.length} activities · {project.project_duration_days}d
        </span>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setZoom((z) => Math.max(0.4, z - 0.2))}
            aria-label="Zoom out"
            className="w-6 h-6 flex items-center justify-center rounded text-[var(--text-secondary)] hover:bg-[var(--bg-tertiary)] text-sm"
          >
            −
          </button>
          <span className="text-xs text-[var(--text-muted)] w-10 text-center">{Math.round(zoom * 100)}%</span>
          <button
            onClick={() => setZoom((z) => Math.min(2, z + 0.2))}
            aria-label="Zoom in"
            className="w-6 h-6 flex items-center justify-center rounded text-[var(--text-secondary)] hover:bg-[var(--bg-tertiary)] text-sm"
          >
            +
          </button>
          <div className="w-px h-4 bg-[var(--border-default)]" />
          <button
            onClick={toggleFullscreen}
            className="w-6 h-6 flex items-center justify-center rounded text-[var(--text-secondary)] hover:bg-[var(--bg-tertiary)]"
            aria-label={isFullscreen ? 'Exit fullscreen' : 'Fullscreen'}
            title={isFullscreen ? 'Exit fullscreen' : 'Fullscreen'}
          >
            {isFullscreen ? (
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                <path d="M5 1v3H1M9 1v3h4M5 13v-3H1M9 13v-3h4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            ) : (
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                <path d="M1 5V1h4M13 5V1H9M1 9v4h4M13 9v4H9" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            )}
          </button>
        </div>
      </div>

      {/* Scrollable chart */}
      <div
        ref={scrollRef}
        className="flex-1 overflow-x-auto overflow-y-auto"
        style={{ minHeight: 0 }}
      >
        <div style={{ width: svgWidth, minWidth: '100%', position: 'relative' }}>
          <GanttTimeline weeks={weeks} />

          {/* Rows */}
          <svg
            width={svgWidth}
            height={bars.length * ROW_HEIGHT + 20}
            style={{ display: 'block' }}
          >
            <ArrowheadDef />

            {/* Grid lines */}
            {weeks.map((week, wi) =>
              week.days.map((day, di) => {
                const x = (wi * 7 + di) * DAY_WIDTH * zoom;
                return (
                  <line
                    key={`grid-${wi}-${di}`}
                    x1={x}
                    y1={0}
                    x2={x}
                    y2={bars.length * ROW_HEIGHT + 20}
                    stroke={day.isWeekend ? 'var(--gantt-grid)' : 'var(--border-subtle)'}
                    strokeWidth={day.dayOfWeek === 1 ? 1 : 0.5}
                  />
                );
              })
            )}

            {/* Row backgrounds */}
            {bars.map((bar, i) => (
              <rect
                key={`row-${i}`}
                x={0}
                y={i * ROW_HEIGHT}
                width={svgWidth}
                height={ROW_HEIGHT}
                fill={i % 2 === 0 ? 'transparent' : 'rgba(249,250,251,0.5)'}
              />
            ))}

            {/* Dependencies */}
            {depLines.map(({ from, to }) => {
              const fromBar = barsMap.get(from);
              const toBar = barsMap.get(to);
              if (!fromBar || !toBar) return null;

              const scaledFrom = { ...fromBar, left: fromBar.left * zoom, width: fromBar.width * zoom };
              const scaledTo = { ...toBar, left: toBar.left * zoom, width: toBar.width * zoom };
              return (
                <GanttDependency key={`dep-${from}-${to}`} fromBar={scaledFrom} toBar={scaledTo} />
              );
            })}

            {/* Bars */}
            {bars.map((bar, index) => {
              const scaledBar = { ...bar, left: bar.left * zoom, width: bar.width * zoom };
              return (
                <GanttBar
                  key={bar.activity.id}
                  bar={scaledBar}
                  index={index}
                  highlighted={bar.activity.id === highlightedId}
                  flash={flashIds?.has(bar.activity.id)}
                  newActivity={newActivityIds?.has(bar.activity.id)}
                  modifiedActivity={modifiedActivityIds?.has(bar.activity.id)}
                />
              );
            })}
          </svg>
        </div>
      </div>
    </div>
  );
}
