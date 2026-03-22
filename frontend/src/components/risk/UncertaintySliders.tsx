'use client';

import { useState } from 'react';
import type { UncertaintyRange } from '../../types/risk';
import type { Activity } from '../../types/schedule';

interface UncertaintySlidersProps {
  ranges: UncertaintyRange[];
  activities: Activity[];
  onRunSimulation: (ranges: UncertaintyRange[]) => void;
  isRunning?: boolean;
}

const CONFIDENCE_LEVELS = [
  { key: 'very',   line1: 'Very',   line2: 'Sure',   optFactor: 0.93, pessFactor: 1.07, color: '#22C55E' },
  { key: 'fairly', line1: 'Fairly', line2: 'Sure',   optFactor: 0.85, pessFactor: 1.20, color: '#84CC16' },
  { key: 'unsure', line1: 'Not',    line2: 'Sure',   optFactor: 0.75, pessFactor: 1.35, color: '#F59E0B' },
  { key: 'risk',   line1: 'At',     line2: 'Risk',   optFactor: 0.65, pessFactor: 1.55, color: '#F97316' },
  { key: 'major',  line1: 'High',   line2: 'Risk',   optFactor: 0.50, pessFactor: 1.75, color: '#EF4444' },
] as const;

type ConfidenceKey = typeof CONFIDENCE_LEVELS[number]['key'];

function detectConfidence(opt: number, ml: number, pess: number): ConfidenceKey {
  const spread = (pess - opt) / Math.max(ml, 1);
  if (spread < 0.24) return 'very';
  if (spread < 0.47) return 'fairly';
  if (spread < 0.74) return 'unsure';
  if (spread < 1.07) return 'risk';
  return 'major';
}

function getRiskHint(name: string): string | null {
  const n = name.toLowerCase();
  if (n.includes('permit') || n.includes('approval')) return 'City approvals often run longer than expected';
  if (n.includes('excavat') || n.includes('foundation')) return 'Site conditions can cause unexpected delays';
  if (n.includes('concrete') || n.includes('pour')) return 'Weather-sensitive — rain delays are common';
  if (n.includes('inspection')) return 'Inspector scheduling can add waiting days';
  if (n.includes('steel') || n.includes('structural')) return 'Fabrication lead times vary by supplier';
  if (n.includes('electrical') || n.includes('plumbing') || n.includes('mechanical') || n.includes('hvac')) return 'Subcontractor scheduling can be unpredictable';
  return null;
}

function SimpleCard({
  range,
  activity,
  onSelectConfidence,
}: {
  range: UncertaintyRange;
  activity: Activity | undefined;
  onSelectConfidence: (level: typeof CONFIDENCE_LEVELS[number]) => void;
}) {
  const isCritical = activity?.is_critical;
  const hint = getRiskHint(activity?.name ?? '');
  const currentKey = detectConfidence(range.optimistic_days, range.most_likely_days, range.pessimistic_days);

  return (
    <div
      className={`p-3 rounded-[var(--radius-md)] border ${
        isCritical ? 'border-red-200 bg-red-50' : 'border-[var(--border-default)] bg-white'
      }`}
    >
      {/* Task name + CRITICAL badge */}
      <div className="flex items-start justify-between gap-2 mb-1">
        <span className="text-xs font-semibold text-[var(--text-primary)] leading-tight flex-1">
          {activity?.name ?? range.activity_id}
        </span>
        {isCritical && (
          <span className="text-[9px] font-medium text-[var(--critical-red)] px-1.5 py-0.5 bg-red-100 rounded flex-shrink-0">
            CRITICAL
          </span>
        )}
      </div>

      {/* Construction-domain risk hint */}
      {hint && (
        <p className="text-[10px] text-[var(--text-muted)] italic mb-2">{hint}</p>
      )}

      {/* Confidence question */}
      <p className="text-[10px] font-medium text-[var(--text-secondary)] mb-1.5">
        How confident are you this finishes on time?
      </p>

      {/* 5-point confidence selector: Very Sure → High Risk */}
      <div className="grid grid-cols-5 gap-1 mb-2">
        {CONFIDENCE_LEVELS.map((level) => {
          const isSelected = currentKey === level.key;
          return (
            <button
              key={level.key}
              onClick={() => onSelectConfidence(level)}
              className="flex flex-col items-center justify-center py-1.5 rounded-[var(--radius-sm)] border transition-all"
              style={
                isSelected
                  ? { backgroundColor: level.color, borderColor: level.color }
                  : { borderColor: 'var(--border-default)', backgroundColor: 'white' }
              }
            >
              <span
                className="text-[9px] font-semibold leading-none block"
                style={{ color: isSelected ? 'white' : 'var(--text-muted)' }}
              >
                {level.line1}
              </span>
              <span
                className="text-[9px] font-semibold leading-none block mt-0.5"
                style={{ color: isSelected ? 'white' : 'var(--text-muted)' }}
              >
                {level.line2}
              </span>
            </button>
          );
        })}
      </div>

      {/* Modeled range confirmation */}
      <p className="text-[10px] text-[var(--text-muted)]">
        Modeling{' '}
        <span className="font-mono font-semibold text-[var(--text-secondary)]">
          {range.optimistic_days}d – {range.pessimistic_days}d
        </span>{' '}
        around expected{' '}
        <span className="font-mono font-semibold text-[var(--text-primary)]">{range.most_likely_days}d</span>
      </p>
    </div>
  );
}

export default function UncertaintySliders({
  ranges: initialRanges,
  activities,
  onRunSimulation,
  isRunning,
}: UncertaintySlidersProps) {
  const [ranges, setRanges] = useState<UncertaintyRange[]>(initialRanges);
  const [mode, setMode] = useState<'simple' | 'advanced'>('simple');
  const [showNonCritical, setShowNonCritical] = useState(false);

  const activityMap = new Map(activities.map((a) => [a.id, a]));

  function applyConfidence(activityId: string, level: typeof CONFIDENCE_LEVELS[number]) {
    setRanges((prev) =>
      prev.map((r) => {
        if (r.activity_id !== activityId) return r;
        const ml = r.most_likely_days;
        return {
          ...r,
          optimistic_days: Math.max(1, Math.round(ml * level.optFactor)),
          pessimistic_days: Math.max(ml + 1, Math.round(ml * level.pessFactor)),
        };
      })
    );
  }

  function updateRange(activityId: string, field: keyof UncertaintyRange, value: number | string) {
    setRanges((prev) =>
      prev.map((r) => (r.activity_id === activityId ? { ...r, [field]: value } : r))
    );
  }

  const criticalRanges = ranges.filter((r) => activityMap.get(r.activity_id)?.is_critical);
  const nonCriticalRanges = ranges.filter((r) => !activityMap.get(r.activity_id)?.is_critical);

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="px-4 py-3 border-b border-[var(--border-subtle)]">
        <span className="inline-block px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-[var(--accent-pink-light)] text-[var(--accent-pink)] mb-2">
          Risk Analysis
        </span>
        <p className="text-xs text-[var(--text-muted)]">
          {mode === 'simple'
            ? 'Rate your confidence in each task. We\'ll model the range for you.'
            : 'Set three-point duration estimates per activity.'}
        </p>
      </div>

      {/* Simple / Advanced toggle */}
      <div className="px-4 pt-3 pb-2">
        <div className="inline-flex rounded-full border border-[var(--border-default)] bg-[var(--bg-secondary)] p-0.5 text-xs">
          {(['simple', 'advanced'] as const).map((m) => (
            <button
              key={m}
              onClick={() => setMode(m)}
              className={`px-3 py-1 rounded-full font-medium capitalize transition-colors ${
                mode === m
                  ? 'bg-white text-[var(--blue-primary)] shadow-[var(--shadow-sm)]'
                  : 'text-[var(--text-muted)] hover:text-[var(--text-secondary)]'
              }`}
            >
              {m}
            </button>
          ))}
        </div>
      </div>

      {/* Task list */}
      <div className="flex-1 overflow-y-auto px-3 pb-3 space-y-2 min-h-0">
        {mode === 'simple' ? (
          <>
            {/* Critical path tasks — always visible */}
            {criticalRanges.map((range) => (
              <SimpleCard
                key={range.activity_id}
                range={range}
                activity={activityMap.get(range.activity_id)}
                onSelectConfidence={(level) => applyConfidence(range.activity_id, level)}
              />
            ))}

            {/* Non-critical tasks — collapsed by default */}
            {nonCriticalRanges.length > 0 && (
              <div>
                <button
                  onClick={() => setShowNonCritical((v) => !v)}
                  className="w-full flex items-center gap-2 py-2 text-[10px] text-[var(--text-muted)] hover:text-[var(--text-secondary)] transition-colors"
                >
                  <div className="flex-1 h-px bg-[var(--border-default)]" />
                  <span className="whitespace-nowrap">
                    {showNonCritical ? '▲' : '▼'} {nonCriticalRanges.length} other tasks — won't shift the end date
                  </span>
                  <div className="flex-1 h-px bg-[var(--border-default)]" />
                </button>
                {showNonCritical && (
                  <div className="space-y-2 mt-1">
                    {nonCriticalRanges.map((range) => (
                      <SimpleCard
                        key={range.activity_id}
                        range={range}
                        activity={activityMap.get(range.activity_id)}
                        onSelectConfidence={(level) => applyConfidence(range.activity_id, level)}
                      />
                    ))}
                  </div>
                )}
              </div>
            )}
          </>
        ) : (
          /* Advanced mode — unchanged */
          ranges.map((range) => {
            const activity = activityMap.get(range.activity_id);
            const isCritical = activity?.is_critical;
            return (
              <div
                key={range.activity_id}
                className={`p-3 rounded-[var(--radius-md)] border ${
                  isCritical ? 'border-red-200 bg-red-50' : 'border-[var(--border-default)] bg-white'
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="font-mono text-[11px] text-[var(--text-muted)]">{range.activity_id}</span>
                  {isCritical && (
                    <span className="text-[9px] font-medium text-[var(--critical-red)] px-1.5 py-0.5 bg-red-100 rounded">CRITICAL</span>
                  )}
                </div>
                <div className="text-xs font-medium text-[var(--text-primary)] mb-2 leading-tight">
                  {activity?.name ?? range.activity_id}
                </div>
                <div className="grid grid-cols-3 gap-2">
                  {(['optimistic_days', 'most_likely_days', 'pessimistic_days'] as const).map((field) => {
                    const labels = { optimistic_days: 'Opt', most_likely_days: 'ML', pessimistic_days: 'Pess' };
                    return (
                      <div key={field}>
                        <label className="text-[10px] text-[var(--text-muted)] block mb-1">{labels[field]}</label>
                        <input
                          type="number"
                          min={1}
                          value={range[field]}
                          onChange={(e) => updateRange(range.activity_id, field, parseInt(e.target.value) || 1)}
                          className="w-full px-2 py-1 text-xs font-mono text-[var(--text-primary)] bg-white border border-[var(--border-default)] rounded focus:border-[var(--blue-primary)] outline-none"
                        />
                      </div>
                    );
                  })}
                </div>
                <div className="mt-2">
                  <label className="text-[10px] text-[var(--text-muted)]">Distribution</label>
                  <select
                    value={range.distribution}
                    onChange={(e) => updateRange(range.activity_id, 'distribution', e.target.value)}
                    className="mt-1 w-full px-2 py-1 text-xs text-[var(--text-primary)] bg-white border border-[var(--border-default)] rounded outline-none focus:border-[var(--blue-primary)]"
                  >
                    <option value="pert">PERT</option>
                    <option value="triangular">Triangular</option>
                    <option value="uniform">Uniform</option>
                  </select>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Run button */}
      <div className="px-4 py-3 border-t border-[var(--border-subtle)]">
        <button
          onClick={() => onRunSimulation(ranges)}
          disabled={isRunning}
          className="w-full py-2.5 text-sm font-medium text-white rounded-[var(--radius-md)] transition-all disabled:opacity-60"
          style={{ backgroundColor: 'var(--blue-primary)' }}
        >
          {isRunning ? (
            <span className="flex items-center justify-center gap-2">
              <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              Analyzing schedule risk…
            </span>
          ) : (
            'Analyze Schedule Risk →'
          )}
        </button>
      </div>
    </div>
  );
}
