'use client';

import type { GanttWeek } from '../../lib/ganttUtils';
import { DAY_WIDTH, HEADER_HEIGHT, formatMonthYear, getDayLabel } from '../../lib/ganttUtils';

interface GanttTimelineProps {
  weeks: GanttWeek[];
}

export default function GanttTimeline({ weeks }: GanttTimelineProps) {
  // Group weeks by month for the top row
  const months: Array<{ label: string; weekStart: number; weekCount: number }> = [];
  let currentMonth = '';
  let currentStart = 0;
  let currentCount = 0;

  weeks.forEach((week, i) => {
    const monthLabel = formatMonthYear(week.startDate);
    if (monthLabel !== currentMonth) {
      if (currentMonth) {
        months.push({ label: currentMonth, weekStart: currentStart, weekCount: currentCount });
      }
      currentMonth = monthLabel;
      currentStart = i;
      currentCount = 1;
    } else {
      currentCount++;
    }
  });
  if (currentMonth) {
    months.push({ label: currentMonth, weekStart: currentStart, weekCount: currentCount });
  }

  const totalWidth = weeks.length * 7 * DAY_WIDTH;

  return (
    <div
      className="border-b border-[var(--border-default)] bg-[var(--gantt-header-bg)] sticky top-0 z-10"
      style={{ height: HEADER_HEIGHT, minWidth: totalWidth }}
    >
      {/* Month row */}
      <div className="flex" style={{ height: HEADER_HEIGHT / 2, borderBottom: '1px solid var(--border-subtle)' }}>
        {months.map((month, i) => (
          <div
            key={i}
            className="text-xs font-medium text-[var(--text-secondary)] flex items-center px-2 border-r border-[var(--border-subtle)] overflow-hidden"
            style={{ width: month.weekCount * 7 * DAY_WIDTH, flexShrink: 0 }}
          >
            {month.label}
          </div>
        ))}
      </div>

      {/* Day of week row */}
      <div className="flex" style={{ height: HEADER_HEIGHT / 2 }}>
        {weeks.map((week, wi) =>
          week.days.map((day, di) => (
            <div
              key={`${wi}-${di}`}
              className={`
                flex items-center justify-center text-[10px] font-medium border-r border-[var(--border-subtle)]
                ${day.isWeekend ? 'text-[var(--text-muted)] bg-[var(--bg-tertiary)]' : 'text-[var(--text-secondary)]'}
              `}
              style={{ width: DAY_WIDTH, flexShrink: 0 }}
            >
              {getDayLabel(day.dayOfWeek)}
            </div>
          ))
        )}
      </div>
    </div>
  );
}
