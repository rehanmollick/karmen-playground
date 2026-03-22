'use client';

import { motion } from 'framer-motion';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ReferenceLine,
  ResponsiveContainer,
  Cell,
} from 'recharts';
import type { SensitivityItem } from '../../types/risk';

interface TornadoChartProps {
  sensitivity: SensitivityItem[];
}

export default function TornadoChart({ sensitivity }: TornadoChartProps) {
  const sorted = [...sensitivity]
    .sort((a, b) => Math.abs(b.correlation) - Math.abs(a.correlation))
    .slice(0, 12);

  const data = sorted.map((item) => ({
    name: item.activity_name.length > 28 ? item.activity_name.slice(0, 26) + '…' : item.activity_name,
    id: item.activity_id,
    correlation: parseFloat((item.correlation * 100).toFixed(1)),
  }));

  return (
    <motion.div
      className="w-full h-full"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.4 }}
    >
      <h3 className="text-sm font-semibold text-[var(--text-primary)] mb-3">Which tasks drive the most risk?</h3>
      <ResponsiveContainer width="100%" height={Math.max(data.length * 28 + 40, 200)}>
        <BarChart
          data={data}
          layout="vertical"
          margin={{ top: 4, right: 40, bottom: 4, left: 4 }}
        >
          <XAxis
            type="number"
            domain={[-100, 100]}
            tick={{ fontSize: 9, fontFamily: 'JetBrains Mono, monospace', fill: 'var(--text-muted)' }}
            tickLine={false}
            tickFormatter={(v) => `${v}%`}
          />
          <YAxis
            type="category"
            dataKey="name"
            width={160}
            tick={{ fontSize: 10, fill: 'var(--text-secondary)' }}
            tickLine={false}
            axisLine={false}
          />
          <Tooltip
            contentStyle={{
              fontSize: 11,
              fontFamily: 'JetBrains Mono, monospace',
              border: '1px solid var(--border-default)',
              borderRadius: 6,
              padding: '6px 10px',
            }}
            formatter={(value) => [`${value}%`, 'Correlation']}
          />
          <ReferenceLine x={0} stroke="var(--border-strong)" strokeWidth={1} />
          <Bar dataKey="correlation" radius={[0, 2, 2, 0]} maxBarSize={18}>
            {data.map((entry, index) => (
              <Cell
                key={`cell-${index}`}
                fill={entry.correlation >= 0 ? 'var(--blue-primary)' : 'var(--critical-red)'}
                opacity={1 - index * 0.04}
              />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </motion.div>
  );
}
