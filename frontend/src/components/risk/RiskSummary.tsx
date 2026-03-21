'use client';

import type { SimulationResult } from '../../types/risk';
import { formatDate } from '../../lib/formatters';

interface RiskSummaryProps {
  result: SimulationResult;
  deterministicDate: string;
}

const STAT_CONFIG = [
  { label: 'P50 — 50% confidence', key: 'p50_date' as const, color: 'var(--mc-p50)', bg: 'bg-green-50' },
  { label: 'P80 — 80% confidence', key: 'p80_date' as const, color: 'var(--mc-p80)', bg: 'bg-amber-50' },
  { label: 'P95 — 95% confidence', key: 'p95_date' as const, color: 'var(--mc-p95)', bg: 'bg-red-50' },
];

export default function RiskSummary({ result, deterministicDate }: RiskSummaryProps) {
  return (
    <div className="grid grid-cols-4 gap-3">
      <div className="bg-[var(--bg-secondary)] rounded-[var(--radius-md)] p-3 border border-[var(--border-default)]">
        <div className="text-[10px] font-medium text-[var(--text-muted)] mb-1">Planned Finish</div>
        <div className="font-mono text-sm font-semibold text-[var(--text-primary)]">
          {formatDate(deterministicDate)}
        </div>
        <div className="text-[10px] text-[var(--text-muted)] mt-1">{result.total_iterations.toLocaleString()} runs</div>
      </div>

      {STAT_CONFIG.map(({ label, key, color, bg }) => (
        <div key={key} className={`${bg} rounded-[var(--radius-md)] p-3 border border-transparent`}>
          <div className="text-[10px] font-medium text-[var(--text-muted)] mb-1">{label}</div>
          <div className="font-mono text-sm font-semibold" style={{ color }}>
            {formatDate(result[key])}
          </div>
          <div className="text-[10px] text-[var(--text-muted)] mt-1">
            {result.execution_time_ms < 1000
              ? `${result.execution_time_ms}ms`
              : `${(result.execution_time_ms / 1000).toFixed(1)}s`}
          </div>
        </div>
      ))}
    </div>
  );
}
