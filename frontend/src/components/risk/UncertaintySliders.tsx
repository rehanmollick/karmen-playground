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

export default function UncertaintySliders({ ranges: initialRanges, activities, onRunSimulation, isRunning }: UncertaintySlidersProps) {
  const [ranges, setRanges] = useState<UncertaintyRange[]>(initialRanges);

  const activityMap = new Map(activities.map((a) => [a.id, a]));

  function updateRange(activityId: string, field: keyof UncertaintyRange, value: number | string) {
    setRanges((prev) =>
      prev.map((r) => (r.activity_id === activityId ? { ...r, [field]: value } : r))
    );
  }

  return (
    <div className="flex flex-col h-full">
      <div className="px-4 py-3 border-b border-[var(--border-subtle)]">
        <span className="inline-block px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-[var(--accent-pink-light)] text-[var(--accent-pink)] mb-2">
          Risk Analysis
        </span>
        <p className="text-xs text-[var(--text-muted)]">Set three-point duration estimates per activity.</p>
      </div>

      <div className="flex-1 overflow-y-auto px-3 py-3 space-y-3 min-h-0">
        {ranges.map((range) => {
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
