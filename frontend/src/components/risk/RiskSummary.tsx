'use client';

import type { SimulationResult } from '../../types/risk';
import { formatDate, daysBetween } from '../../lib/formatters';

interface RiskSummaryProps {
  result: SimulationResult;
  deterministicDate: string;
}

const STAT_CONFIG = [
  { label: 'P50', sublabel: '50% confidence', key: 'p50_date' as const, color: 'var(--mc-p50)', bg: 'bg-green-50', border: 'border-green-200' },
  { label: 'P80', sublabel: '80% confidence', key: 'p80_date' as const, color: 'var(--mc-p80)', bg: 'bg-amber-50', border: 'border-amber-200' },
  { label: 'P95', sublabel: '95% confidence', key: 'p95_date' as const, color: 'var(--mc-p95)', bg: 'bg-red-50', border: 'border-red-200' },
];

export default function RiskSummary({ result, deterministicDate }: RiskSummaryProps) {
  return (
    <div className="grid grid-cols-2 xl:grid-cols-4 gap-3">
      {/* Planned finish */}
      <div className="bg-[var(--bg-secondary)] rounded-[var(--radius-md)] p-4 border border-[var(--border-default)]">
        <div className="text-xs font-medium text-[var(--text-muted)] mb-2 uppercase tracking-wide">Planned Finish</div>
        <div className="font-mono text-lg font-bold text-[var(--text-primary)] leading-tight">
          {formatDate(deterministicDate)}
        </div>
        <div className="text-xs text-[var(--text-muted)] mt-2">{result.total_iterations.toLocaleString()} iterations</div>
      </div>

      {STAT_CONFIG.map(({ label, sublabel, key, color, bg, border }) => {
        const delta = daysBetween(deterministicDate, result[key]);
        return (
          <div key={key} className={`${bg} rounded-[var(--radius-md)] p-4 border ${border}`}>
            <div className="flex items-baseline gap-1.5 mb-2">
              <span className="text-base font-bold" style={{ color }}>{label}</span>
              <span className="text-xs text-[var(--text-muted)]">{sublabel}</span>
            </div>
            <div className="font-mono text-lg font-bold leading-tight" style={{ color }}>
              {formatDate(result[key])}
            </div>
            <div className="text-xs text-[var(--text-muted)] mt-2">
              {delta > 0 ? `+${delta} days from planned` : delta < 0 ? `${delta} days from planned` : 'on planned date'}
            </div>
          </div>
        );
      })}
    </div>
  );
}
