import type { Activity, Project } from '../types/schedule';
import { parseDate } from './formatters';

export interface GanttDay {
  date: Date;
  dayOfWeek: number; // 0=Sun, 6=Sat
  isWeekend: boolean;
}

export interface GanttWeek {
  startDate: Date;
  days: GanttDay[];
}

export interface GanttBarData {
  activity: Activity;
  left: number;   // px from chart left
  width: number;  // px
  top: number;    // px row offset
  row: number;
}

export interface GanttDependencyLine {
  fromActivity: Activity;
  toActivity: Activity;
  fromBar: GanttBarData;
  toBar: GanttBarData;
}

export interface GanttLayout {
  weeks: GanttWeek[];
  bars: GanttBarData[];
  totalDays: number;
  startDate: Date;
  endDate: Date;
  dayWidth: number;
  rowHeight: number;
  headerHeight: number;
}

export const DAY_WIDTH = 28;
export const ROW_HEIGHT = 36;
export const HEADER_HEIGHT = 56;
export const CHART_PADDING_RIGHT = 60;

function addDays(date: Date, days: number): Date {
  const d = new Date(date);
  d.setDate(d.getDate() + days);
  return d;
}

function diffDays(a: Date, b: Date): number {
  return Math.round((b.getTime() - a.getTime()) / 86400000);
}

function generateWeeks(startDate: Date, endDate: Date): GanttWeek[] {
  const weeks: GanttWeek[] = [];
  // Start from the Monday of the week containing startDate
  const start = new Date(startDate);
  const dow = start.getDay();
  start.setDate(start.getDate() - dow); // go to Sunday

  const current = new Date(start);
  while (current <= endDate) {
    const week: GanttWeek = { startDate: new Date(current), days: [] };
    for (let i = 0; i < 7; i++) {
      const d = new Date(current);
      d.setDate(d.getDate() + i);
      week.days.push({
        date: d,
        dayOfWeek: d.getDay(),
        isWeekend: d.getDay() === 0 || d.getDay() === 6,
      });
    }
    weeks.push(week);
    current.setDate(current.getDate() + 7);
  }
  return weeks;
}

export function buildGanttLayout(
  project: Project,
  visibleActivityIds?: Set<string>
): GanttLayout {
  const projectStart = parseDate(project.start_date);
  let projectEnd = project.project_end_date
    ? parseDate(project.project_end_date)
    : addDays(projectStart, project.project_duration_days);

  // Add padding
  projectEnd = addDays(projectEnd, 14);

  const totalDays = diffDays(projectStart, projectEnd);
  const weeks = generateWeeks(projectStart, projectEnd);

  // Filter and order activities
  const activities = visibleActivityIds
    ? project.activities.filter((a) => visibleActivityIds.has(a.id))
    : project.activities;

  const bars: GanttBarData[] = activities.map((activity, index) => {
    const startDate = activity.early_start || activity.start_date;
    const endDate = activity.early_finish || activity.end_date;

    let left = 0;
    let width = Math.max(activity.duration_days * DAY_WIDTH, DAY_WIDTH);

    if (startDate) {
      const daysFromStart = diffDays(projectStart, parseDate(startDate));
      left = Math.max(0, daysFromStart * DAY_WIDTH);
    }
    if (startDate && endDate) {
      const duration = diffDays(parseDate(startDate), parseDate(endDate));
      width = Math.max(duration * DAY_WIDTH, DAY_WIDTH);
    }

    return {
      activity,
      left,
      width,
      top: HEADER_HEIGHT + index * ROW_HEIGHT,
      row: index,
    };
  });

  return {
    weeks,
    bars,
    totalDays,
    startDate: projectStart,
    endDate: projectEnd,
    dayWidth: DAY_WIDTH,
    rowHeight: ROW_HEIGHT,
    headerHeight: HEADER_HEIGHT,
  };
}

export function barById(bars: GanttBarData[]): Map<string, GanttBarData> {
  const map = new Map<string, GanttBarData>();
  bars.forEach((b) => map.set(b.activity.id, b));
  return map;
}

export function dateToX(date: Date, startDate: Date): number {
  return diffDays(startDate, date) * DAY_WIDTH;
}

export function formatMonthYear(date: Date): string {
  return date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
}

export function getDayLabel(dayOfWeek: number): string {
  return ['S', 'M', 'T', 'W', 'T', 'F', 'S'][dayOfWeek];
}
