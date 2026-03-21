'use client';

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ReferenceLine,
  ResponsiveContainer,
  CartesianGrid,
} from 'recharts';
import type { SimulationResult } from '../../types/risk';
import { formatDateShort } from '../../lib/formatters';

interface CompletionDistributionProps {
  result: SimulationResult;
}

export default function CompletionDistribution({ result }: CompletionDistributionProps) {
  const data = result.completion_distribution.map((bucket) => ({
    date: bucket.date,
    count: bucket.count,
    cumulative: Math.round(bucket.cumulative_probability * 100),
    label: formatDateShort(bucket.date),
  }));

  // Find x-indices for P50/P80/P95
  const refLines = [
    { date: result.p50_date, color: 'var(--mc-p50)', label: 'P50' },
    { date: result.p80_date, color: 'var(--mc-p80)', label: 'P80' },
    { date: result.p95_date, color: 'var(--mc-p95)', label: 'P95' },
  ];

  return (
    <div className="w-full h-full">
      <div className="flex items-center gap-4 mb-3">
        <h3 className="text-sm font-semibold text-[var(--text-primary)]">Completion Distribution</h3>
        <div className="flex items-center gap-3 text-[10px] text-[var(--text-muted)]">
          {refLines.map((r) => (
            <span key={r.label} className="flex items-center gap-1">
              <span className="w-3 h-0.5 inline-block" style={{ backgroundColor: r.color }} />
              {r.label}
            </span>
          ))}
        </div>
      </div>
      <ResponsiveContainer width="100%" height={220}>
        <BarChart data={data} margin={{ top: 4, right: 8, bottom: 20, left: 8 }}>
          <CartesianGrid vertical={false} stroke="var(--gantt-grid)" />
          <XAxis
            dataKey="label"
            tick={{ fontSize: 9, fontFamily: 'JetBrains Mono, monospace', fill: 'var(--text-muted)' }}
            interval="preserveStartEnd"
            angle={-45}
            textAnchor="end"
            tickLine={false}
          />
          <YAxis
            tick={{ fontSize: 9, fontFamily: 'JetBrains Mono, monospace', fill: 'var(--text-muted)' }}
            tickLine={false}
            axisLine={false}
            width={30}
          />
          <Tooltip
            contentStyle={{
              fontSize: 11,
              fontFamily: 'JetBrains Mono, monospace',
              border: '1px solid var(--border-default)',
              borderRadius: 6,
              padding: '6px 10px',
            }}
            formatter={(value, name) => {
              if (name === 'count') return [value, 'Simulations'];
              return [String(value) + '%', 'Cumulative'];
            }}
          />
          <Bar dataKey="count" fill="var(--mc-histogram)" radius={[2, 2, 0, 0]} maxBarSize={24} />
          {refLines.map((r) => (
            <ReferenceLine
              key={r.label}
              x={formatDateShort(r.date)}
              stroke={r.color}
              strokeWidth={2}
              strokeDasharray="4 2"
              label={{ value: r.label, fill: r.color, fontSize: 9, position: 'top' }}
            />
          ))}
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
