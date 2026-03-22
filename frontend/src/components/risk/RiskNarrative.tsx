'use client';

import type { SimulationResult } from '../../types/risk';
import { formatDate, daysBetween } from '../../lib/formatters';

interface RiskNarrativeProps {
  result: SimulationResult;
  deterministicDate: string;
}

export default function RiskNarrative({ result, deterministicDate }: RiskNarrativeProps) {
  const p50Delta = daysBetween(deterministicDate, result.p50_date);
  const p80Delta = daysBetween(deterministicDate, result.p80_date);
  const p95Delta = daysBetween(deterministicDate, result.p95_date);

  // Estimate the probability of hitting the planned date from the distribution
  const totalCount = result.completion_distribution.reduce((sum, b) => sum + b.count, 0);
  const onTimeBuckets = result.completion_distribution.filter((b) => b.date <= deterministicDate);
  const onTimeCount = onTimeBuckets.reduce((sum, b) => sum + b.count, 0);
  const onTimePct = totalCount > 0 ? Math.round((onTimeCount / totalCount) * 100) : 0;

  const topDrivers = result.sensitivity.slice(0, 3);

  return (
    <div className="bg-white border border-[var(--border-default)] rounded-[var(--radius-md)] p-5">
      <div className="flex items-center gap-2 mb-4">
        <span className="inline-block px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-[var(--accent-pink-light)] text-[var(--accent-pink)]">
          Risk Summary
        </span>
        <span className="text-xs text-[var(--text-muted)]">Based on {result.total_iterations.toLocaleString()} simulations</span>
      </div>

      <p className="text-sm text-[var(--text-primary)] leading-relaxed mb-3">
        Your planned finish date of <span className="font-semibold">{formatDate(deterministicDate)}</span> has only a{' '}
        <span className="font-semibold" style={{ color: onTimePct < 30 ? 'var(--critical-red)' : onTimePct < 60 ? 'var(--warning-amber)' : 'var(--success-green)' }}>
          {onTimePct}%
        </span>{' '}
        probability of being achieved.
      </p>

      <p className="text-sm text-[var(--text-secondary)] leading-relaxed mb-4">
        There is a 50% probability the project finishes by{' '}
        <span className="font-medium text-[var(--mc-p50)]">{formatDate(result.p50_date)}</span>
        {p50Delta > 0 ? ` (+${p50Delta} days)` : ''}, an 80% probability by{' '}
        <span className="font-medium text-[var(--mc-p80)]">{formatDate(result.p80_date)}</span>
        {p80Delta > 0 ? ` (+${p80Delta} days)` : ''}, and a 95% probability by{' '}
        <span className="font-medium text-[var(--mc-p95)]">{formatDate(result.p95_date)}</span>
        {p95Delta > 0 ? ` (+${p95Delta} days)` : ''}.
      </p>

      {topDrivers.length > 0 && (
        <div>
          <p className="text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-wide mb-2">Top Risk Drivers</p>
          <ol className="space-y-1.5">
            {topDrivers.map((item, i) => (
              <li key={item.activity_id} className="flex items-start gap-2">
                <span className="text-xs font-bold text-[var(--text-muted)] w-4 flex-shrink-0 pt-0.5">{i + 1}.</span>
                <div className="flex-1 min-w-0">
                  <span className="text-sm text-[var(--text-primary)]">{item.activity_name}</span>
                  <span className="text-xs text-[var(--text-muted)] ml-2">
                    — {Math.abs(item.correlation).toFixed(2)} correlation with project end date
                  </span>
                </div>
              </li>
            ))}
          </ol>
          <p className="text-xs text-[var(--text-muted)] mt-3 leading-relaxed">
            These activities have the most uncertainty and the strongest influence on your completion date.
            Narrowing the range on these tasks will have the biggest impact on schedule confidence.
          </p>
        </div>
      )}
    </div>
  );
}
