'use client';

import type { SimulationResult } from '../../types/risk';
import { formatDate, daysBetween } from '../../lib/formatters';

interface RiskSummaryProps {
  result: SimulationResult;
  deterministicDate: string;
}

const STAT_CONFIG = [
  {
    tag: 'P50',
    label: 'Best Estimate',
    sublabel: '50/50 chance of hitting this date',
    key: 'p50_date' as const,
    color: 'var(--mc-p50)',
    bg: 'bg-green-50',
    border: 'border-green-200',
  },
  {
    tag: 'P80',
    label: 'Safe to Quote',
    sublabel: '4 of 5 scenarios finish by this date',
    key: 'p80_date' as const,
    color: 'var(--mc-p80)',
    bg: 'bg-amber-50',
    border: 'border-amber-200',
  },
  {
    tag: 'P95',
    label: 'Conservative Buffer',
    sublabel: '19 of 20 scenarios finish by this date',
    key: 'p95_date' as const,
    color: 'var(--mc-p95)',
    bg: 'bg-red-50',
    border: 'border-red-200',
  },
];

export default function RiskSummary({ result, deterministicDate }: RiskSummaryProps) {
  const p80Delta = daysBetween(deterministicDate, result.p80_date);

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-2 xl:grid-cols-4 gap-3">
        {/* Planned finish */}
        <div className="bg-[var(--bg-secondary)] rounded-[var(--radius-md)] p-4 border border-[var(--border-default)]">
          <div className="text-xs font-medium text-[var(--text-muted)] mb-2 uppercase tracking-wide">Planned Finish</div>
          <div className="font-mono text-lg font-bold text-[var(--text-primary)] leading-tight">
            {formatDate(deterministicDate)}
          </div>
          <div className="text-xs text-[var(--text-muted)] mt-2">Based on current schedule</div>
        </div>

        {STAT_CONFIG.map(({ tag, label, sublabel, key, color, bg, border }) => {
          const delta = daysBetween(deterministicDate, result[key]);
          return (
            <div key={key} className={`${bg} rounded-[var(--radius-md)] p-4 border ${border}`}>
              <div className="mb-1">
                <span
                  className="text-[10px] font-bold px-1.5 py-0.5 rounded"
                  style={{ color, backgroundColor: `${color}25` }}
                >
                  {tag}
                </span>
              </div>
              <div className="text-xs font-semibold text-[var(--text-primary)] mb-1 leading-tight">{label}</div>
              <div className="font-mono text-lg font-bold leading-tight" style={{ color }}>
                {formatDate(result[key])}
              </div>
              <div className="text-[10px] text-[var(--text-muted)] mt-1.5 leading-snug">{sublabel}</div>
              {delta > 0 && (
                <div className="text-[10px] font-semibold mt-1" style={{ color }}>
                  +{delta}d from planned
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Plain-English recommendation */}
      <div className="bg-blue-50 border border-blue-200 rounded-[var(--radius-md)] px-4 py-3 flex items-start gap-2.5">
        <span className="text-sm mt-0.5 flex-shrink-0">💡</span>
        <p className="text-xs text-blue-800 leading-relaxed">
          <span className="font-semibold">Recommend quoting clients {formatDate(result.p80_date)}</span>
          {p80Delta > 0 && <span className="text-blue-600"> (+{p80Delta} days from planned)</span>}.{' '}
          You have an 80% chance of on-time delivery. The current schedule date ({formatDate(deterministicDate)}) is only a 50/50 shot.
        </p>
      </div>
    </div>
  );
}
