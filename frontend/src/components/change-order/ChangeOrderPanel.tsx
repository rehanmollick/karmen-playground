'use client';

import type { ChangeOrder } from '../../types/changeOrder';

const SOURCE_COLORS: Record<string, string> = {
  'Owner Directive': 'var(--blue-primary)',
  'Field Condition': 'var(--warning-amber)',
  'Design Error': 'var(--critical-red)',
  'Regulatory': 'var(--success-green)',
};

interface ChangeOrderPanelProps {
  changeOrders: ChangeOrder[];
  selectedId: string | null;
  onSelect: (id: string) => void;
  isAnalyzing?: boolean;
}

export default function ChangeOrderPanel({ changeOrders, selectedId, onSelect, isAnalyzing }: ChangeOrderPanelProps) {
  return (
    <div className="flex flex-col h-full">
      <div className="px-4 py-3 border-b border-[var(--border-subtle)]">
        <div className="flex items-center gap-2 mb-1">
          <span className="inline-block px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-[var(--accent-pink-light)] text-[var(--accent-pink)]">
            Change Orders
          </span>
        </div>
        <p className="text-xs text-[var(--text-muted)]">Select a change order to analyze its schedule impact.</p>
      </div>

      <div className="flex-1 overflow-y-auto px-3 py-3 space-y-2">
        {changeOrders.map((co) => {
          const isSelected = co.id === selectedId;
          const sourceColor = SOURCE_COLORS[co.source] || 'var(--text-muted)';

          return (
            <button
              key={co.id}
              onClick={() => onSelect(co.id)}
              className={`
                w-full text-left p-3 rounded-[var(--radius-md)] border transition-all
                ${isSelected
                  ? 'border-[var(--blue-primary)] bg-[var(--blue-light)]'
                  : 'border-[var(--border-default)] bg-white hover:border-[var(--border-strong)] hover:shadow-[var(--shadow-sm)]'
                }
              `}
            >
              <div className="flex items-start justify-between gap-2 mb-1">
                <span className="text-xs font-semibold text-[var(--text-primary)] leading-tight">{co.name}</span>
                {isSelected && isAnalyzing && (
                  <span className="w-3 h-3 border-2 border-[var(--blue-primary)] border-t-transparent rounded-full animate-spin flex-shrink-0 mt-0.5" />
                )}
              </div>
              <p className="text-xs text-[var(--text-secondary)] mb-2 line-clamp-2">{co.description}</p>
              <div className="flex items-center gap-2">
                <span
                  className="text-[10px] font-medium px-1.5 py-0.5 rounded"
                  style={{ color: sourceColor, backgroundColor: `${sourceColor}18` }}
                >
                  {co.source}
                </span>
                <span className="text-[10px] text-[var(--text-muted)]">
                  {co.affected_activities.length} activities
                </span>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
