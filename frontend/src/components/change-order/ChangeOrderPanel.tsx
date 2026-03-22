'use client';

import { useState } from 'react';
import type { ChangeOrder } from '../../types/changeOrder';

const SOURCE_COLORS: Record<string, string> = {
  'Owner Directive': 'var(--blue-primary)',
  'Field Condition': 'var(--warning-amber)',
  'Design Error': 'var(--critical-red)',
  'Regulatory': 'var(--success-green)',
};

const SOURCE_OPTIONS = ['Owner Directive', 'Field Condition', 'Design Error'];

interface CustomCO {
  id: string;
  name: string;
  description: string;
  source: string;
  isCustom: true;
}

type COItem = ChangeOrder | CustomCO;

interface ChangeOrderPanelProps {
  changeOrders: ChangeOrder[];
  selectedId: string | null;
  onSelect: (id: string) => void;
  /** Called when user submits a custom CO. Parent should register the CO and trigger analysis. */
  onSubmitCustom?: (id: string, name: string, description: string, source: string) => void;
  isAnalyzing?: boolean;
}

export default function ChangeOrderPanel({ changeOrders, selectedId, onSelect, onSubmitCustom, isAnalyzing }: ChangeOrderPanelProps) {
  const [customCOs, setCustomCOs] = useState<CustomCO[]>([]);
  const [customName, setCustomName] = useState('');
  const [customDesc, setCustomDesc] = useState('');
  const [customSource, setCustomSource] = useState('Owner Directive');

  function handleAnalyzeCustom() {
    const desc = customDesc.trim();
    const name = customName.trim() || 'Custom Change Order';
    if (!desc) return;

    const id = `custom_${Date.now()}`;
    const newCO: CustomCO = { id, name, description: desc, source: customSource, isCustom: true };
    setCustomCOs((prev) => [...prev, newCO]);
    setCustomDesc('');
    setCustomName('');
    // Notify parent with id + full details so it can register and trigger analysis atomically
    onSubmitCustom?.(id, name, desc, customSource);
  }

  const allCOs: COItem[] = [...changeOrders, ...customCOs];

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

      <div className="flex-1 overflow-y-auto px-3 py-3 space-y-2 min-h-0">
        {/* Pre-built COs */}
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

        {/* Custom COs that have been submitted */}
        {customCOs.map((co) => {
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
                <div className="flex items-center gap-1">
                  {isSelected && isAnalyzing && (
                    <span className="w-3 h-3 border-2 border-[var(--blue-primary)] border-t-transparent rounded-full animate-spin flex-shrink-0" />
                  )}
                  <span className="text-[9px] font-medium px-1.5 py-0.5 rounded bg-[var(--accent-pink-light)] text-[var(--accent-pink)]">Custom</span>
                </div>
              </div>
              <p className="text-xs text-[var(--text-secondary)] mb-2 line-clamp-2">{co.description}</p>
              <div>
                <span
                  className="text-[10px] font-medium px-1.5 py-0.5 rounded"
                  style={{ color: sourceColor, backgroundColor: `${sourceColor}18` }}
                >
                  {co.source}
                </span>
              </div>
            </button>
          );
        })}

        {/* Divider */}
        <div className="flex items-center gap-2 pt-1">
          <div className="flex-1 h-px bg-[var(--border-default)]" />
          <span className="text-[10px] text-[var(--text-muted)] font-medium whitespace-nowrap">or describe your own</span>
          <div className="flex-1 h-px bg-[var(--border-default)]" />
        </div>

        {/* Custom CO input */}
        <div className="bg-[var(--bg-secondary)] rounded-[var(--radius-md)] border border-[var(--border-default)] p-3 space-y-2">
          <input
            type="text"
            value={customName}
            onChange={(e) => setCustomName(e.target.value)}
            placeholder="Change order name (optional)"
            className="w-full px-2.5 py-1.5 text-xs text-[var(--text-primary)] bg-white border border-[var(--border-default)] rounded-[var(--radius-sm)] outline-none focus:border-[var(--blue-primary)] placeholder:text-[var(--text-muted)]"
          />
          <textarea
            value={customDesc}
            onChange={(e) => setCustomDesc(e.target.value)}
            placeholder="e.g. Owner wants to add a swimming pool to the backyard"
            rows={3}
            className="w-full px-2.5 py-1.5 text-xs text-[var(--text-primary)] bg-white border border-[var(--border-default)] rounded-[var(--radius-sm)] resize-none outline-none focus:border-[var(--blue-primary)] placeholder:text-[var(--text-muted)]"
          />
          <select
            value={customSource}
            onChange={(e) => setCustomSource(e.target.value)}
            className="w-full px-2.5 py-1.5 text-xs text-[var(--text-primary)] bg-white border border-[var(--border-default)] rounded-[var(--radius-sm)] outline-none focus:border-[var(--blue-primary)]"
          >
            {SOURCE_OPTIONS.map((s) => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>
          <button
            onClick={handleAnalyzeCustom}
            disabled={!customDesc.trim()}
            className="w-full py-2 text-xs font-medium text-white rounded-[var(--radius-sm)] transition-all disabled:opacity-50"
            style={{ backgroundColor: 'var(--blue-primary)' }}
          >
            Analyze Impact →
          </button>
        </div>
      </div>
    </div>
  );
}
