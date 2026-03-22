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

function getRiskLevel(opt: number, ml: number, pess: number): { label: string; color: string; bg: string } {
  const spread = (pess - opt) / ml;
  if (spread < 0.35) return { label: 'Low', color: 'var(--success-green)', bg: 'bg-green-50' };
  if (spread < 0.7) return { label: 'Medium', color: 'var(--warning-amber)', bg: 'bg-amber-50' };
  return { label: 'High', color: 'var(--critical-red)', bg: 'bg-red-50' };
}

export default function UncertaintySliders({ ranges: initialRanges, activities, onRunSimulation, isRunning }: UncertaintySlidersProps) {
  const [ranges, setRanges] = useState<UncertaintyRange[]>(initialRanges);
  const [mode, setMode] = useState<'simple' | 'advanced'>('simple');

  const activityMap = new Map(activities.map((a) => [a.id, a]));

  function updateRange(activityId: string, field: keyof UncertaintyRange, value: number | string) {
    setRanges((prev) =>
      prev.map((r) => (r.activity_id === activityId ? { ...r, [field]: value } : r))
    );
  }

  function setOptimistic(activityId: string, val: number) {
    setRanges((prev) =>
      prev.map((r) => {
        if (r.activity_id !== activityId) return r;
        const clamped = Math.max(1, Math.min(val, r.most_likely_days - 1));
        return { ...r, optimistic_days: clamped };
      })
    );
  }

  function setPessimistic(activityId: string, val: number) {
    setRanges((prev) =>
      prev.map((r) => {
        if (r.activity_id !== activityId) return r;
        const clamped = Math.max(r.most_likely_days + 1, val);
        return { ...r, pessimistic_days: clamped };
      })
    );
  }

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="px-4 py-3 border-b border-[var(--border-subtle)]">
        <span className="inline-block px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-[var(--accent-pink-light)] text-[var(--accent-pink)] mb-2">
          Risk Analysis
        </span>
        {mode === 'simple' ? (
          <p className="text-xs text-[var(--text-muted)]">How uncertain is each task? Wider range = more schedule risk.</p>
        ) : (
          <p className="text-xs text-[var(--text-muted)]">Set three-point duration estimates per activity.</p>
        )}
      </div>

      {/* Mode toggle */}
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

      {/* Activity cards */}
      <div className="flex-1 overflow-y-auto px-3 pb-3 space-y-3 min-h-0">
        {ranges.map((range) => {
          const activity = activityMap.get(range.activity_id);
          const isCritical = activity?.is_critical;
          const risk = getRiskLevel(range.optimistic_days, range.most_likely_days, range.pessimistic_days);

          if (mode === 'simple') {
            const optMax = Math.max(1, range.most_likely_days - 1);
            const pessMin = range.most_likely_days + 1;
            const pessMax = Math.ceil(range.most_likely_days * 2.5);

            return (
              <div
                key={range.activity_id}
                className={`p-3 rounded-[var(--radius-md)] border ${
                  isCritical ? 'border-red-200 bg-red-50' : 'border-[var(--border-default)] bg-white'
                }`}
              >
                {/* Header */}
                <div className="flex items-start justify-between mb-2">
                  <span className="text-xs font-semibold text-[var(--text-primary)] leading-tight pr-2 flex-1">
                    {activity?.name || range.activity_id}
                  </span>
                  <div className="flex items-center gap-1.5 flex-shrink-0">
                    {isCritical && (
                      <span className="text-[9px] font-medium text-[var(--critical-red)] px-1.5 py-0.5 bg-red-100 rounded">CRITICAL</span>
                    )}
                    <span
                      className={`text-[9px] font-semibold px-1.5 py-0.5 rounded ${risk.bg}`}
                      style={{ color: risk.color }}
                    >
                      {risk.label}
                    </span>
                  </div>
                </div>

                <p className="text-[11px] text-[var(--text-muted)] mb-3">
                  {range.most_likely_days} days expected (could be {range.optimistic_days}–{range.pessimistic_days})
                </p>

                {/* Best case slider */}
                <div className="mb-2">
                  <div className="flex justify-between text-[10px] text-[var(--text-muted)] mb-1">
                    <label>Best Case</label>
                    <span className="font-mono font-medium text-[var(--success-green)]">{range.optimistic_days}d</span>
                  </div>
                  <input
                    type="range"
                    min={1}
                    max={optMax}
                    value={range.optimistic_days}
                    onChange={(e) => setOptimistic(range.activity_id, parseInt(e.target.value))}
                    className="w-full h-1.5 rounded-full appearance-none cursor-pointer"
                    style={{ accentColor: 'var(--success-green)' }}
                  />
                </div>

                {/* Expected (read-only center marker) */}
                <div className="flex items-center gap-2 py-1.5 px-2 rounded bg-[var(--bg-tertiary)] mb-2">
                  <span className="text-[10px] text-[var(--text-muted)] flex-1">Expected</span>
                  <span className="font-mono text-xs font-semibold text-[var(--text-primary)]">{range.most_likely_days}d</span>
                </div>

                {/* Worst case slider */}
                <div>
                  <div className="flex justify-between text-[10px] text-[var(--text-muted)] mb-1">
                    <label>Worst Case</label>
                    <span className="font-mono font-medium text-[var(--critical-red)]">{range.pessimistic_days}d</span>
                  </div>
                  <input
                    type="range"
                    min={pessMin}
                    max={pessMax}
                    value={range.pessimistic_days}
                    onChange={(e) => setPessimistic(range.activity_id, parseInt(e.target.value))}
                    className="w-full h-1.5 rounded-full appearance-none cursor-pointer"
                    style={{ accentColor: 'var(--critical-red)' }}
                  />
                </div>
              </div>
            );
          }

          // Advanced mode — original layout
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
                {activity?.name || range.activity_id}
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
        })}
      </div>

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
              Running 10,000 simulations…
            </span>
          ) : (
            'Run 10,000 Simulations'
          )}
        </button>
      </div>
    </div>
  );
}
