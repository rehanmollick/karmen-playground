'use client';

import { useState } from 'react';
import type { ImpactAnalysis } from '../../types/changeOrder';
import type { Project } from '../../types/schedule';
import { formatDate } from '../../lib/formatters';

interface ImpactNarrativeProps {
  impact: ImpactAnalysis;
  changeOrderName: string;
  projectId?: string;
  modifiedProject?: Project;
  onApplyChanges?: (modifiedProject: Project) => void;
  isApplied?: boolean;
}

export default function ImpactNarrative({ impact, changeOrderName, projectId, modifiedProject, onApplyChanges, isApplied = false }: ImpactNarrativeProps) {
  const [copied, setCopied] = useState(false);
  const [view, setView] = useState<'narrative' | 'fragnet' | 'impact'>('impact');

  function handleApply() {
    if (!modifiedProject || !onApplyChanges || isApplied) return;
    onApplyChanges(modifiedProject);
  }

  const delaySign = impact.delay_days >= 0 ? '+' : '';

  function handleDownloadFragnet() {
    if (!projectId) return;
    const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
    window.open(`${API_URL}/api/export/${projectId}?format=xml`, '_blank');
  }

  async function handleCopy() {
    const text = `${changeOrderName}\n\n${impact.narrative}\n\nCitations:\n${impact.citations.join('\n')}`;
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div className="flex flex-col h-full bg-white border border-[var(--border-default)] rounded-[var(--radius-md)] overflow-hidden">
      {/* Sub-tabs */}
      <div className="flex items-center border-b border-[var(--border-default)] bg-[var(--bg-secondary)]">
        <div className="flex flex-1">
          {(['impact', 'narrative', 'fragnet'] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setView(tab)}
              className={`px-4 py-2.5 text-xs font-medium capitalize border-b-2 transition-all ${
                view === tab
                  ? 'border-[var(--blue-primary)] text-[var(--blue-primary)]'
                  : 'border-transparent text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
              }`}
            >
              {tab === 'impact' ? 'Time Impact' : tab === 'narrative' ? 'Narrative' : 'Fragnet Changes'}
            </button>
          ))}
        </div>
        {projectId && (
          <button
            onClick={handleDownloadFragnet}
            className="mr-3 px-3 py-1.5 text-xs font-medium text-white rounded-[var(--radius-sm)] transition-colors flex items-center gap-1.5"
            style={{ backgroundColor: 'var(--export-red)' }}
            onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = 'var(--export-red-hover)')}
            onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'var(--export-red)')}
          >
            ↓ Download Fragnet Schedule
          </button>
        )}
      </div>

      <div className="flex-1 overflow-y-auto p-4">
        {view === 'impact' && (
          <div className="space-y-4">
            {/* Date comparison */}
            <div className="grid grid-cols-3 gap-3">
              <div className="bg-[var(--bg-secondary)] rounded-[var(--radius-md)] p-3">
                <div className="text-[10px] font-medium text-[var(--text-muted)] mb-1">Original Finish</div>
                <div className="font-mono text-sm font-semibold text-[var(--text-primary)]">
                  {formatDate(impact.original_end_date)}
                </div>
              </div>
              <div className={`rounded-[var(--radius-md)] p-3 ${impact.delay_days > 0 ? 'bg-red-50' : 'bg-green-50'}`}>
                <div className="text-[10px] font-medium text-[var(--text-muted)] mb-1">Delay</div>
                <div className={`font-mono text-xl font-bold ${impact.delay_days > 0 ? 'text-[var(--critical-red)]' : 'text-[var(--success-green)]'}`}>
                  {delaySign}{impact.delay_days}d
                </div>
              </div>
              <div className={`rounded-[var(--radius-md)] p-3 ${impact.delay_days > 0 ? 'bg-orange-50' : 'bg-[var(--bg-secondary)]'}`}>
                <div className="text-[10px] font-medium text-[var(--text-muted)] mb-1">New Finish</div>
                <div className={`font-mono text-sm font-semibold ${impact.delay_days > 0 ? 'text-orange-700' : 'text-[var(--text-primary)]'}`}>
                  {formatDate(impact.impacted_end_date)}
                </div>
              </div>
            </div>

            {/* Activity counts */}
            <div className="flex gap-3">
              {impact.new_activities_count > 0 && (
                <div className="flex items-center gap-2 px-3 py-2 rounded-[var(--radius-sm)] bg-purple-50">
                  <div className="w-2 h-2 rounded-full" style={{ backgroundColor: 'var(--fragnet-new)' }} />
                  <span className="text-xs text-purple-800">{impact.new_activities_count} new activities</span>
                </div>
              )}
              {impact.modified_activities_count > 0 && (
                <div className="flex items-center gap-2 px-3 py-2 rounded-[var(--radius-sm)] bg-amber-50">
                  <div className="w-2 h-2 rounded-full" style={{ backgroundColor: 'var(--fragnet-modified)' }} />
                  <span className="text-xs text-amber-800">{impact.modified_activities_count} modified</span>
                </div>
              )}
            </div>

            {/* Critical path change */}
            {impact.new_critical_path.join(',') !== impact.original_critical_path.join(',') && (
              <div className="p-3 bg-[var(--bg-secondary)] rounded-[var(--radius-sm)]">
                <div className="text-xs font-medium text-[var(--text-secondary)] mb-1">Critical path updated</div>
                <div className="font-mono text-xs text-[var(--text-muted)] flex flex-wrap gap-1">
                  {impact.new_critical_path.slice(0, 8).map((id) => (
                    <span key={id} className="px-1.5 py-0.5 bg-red-100 text-red-700 rounded text-[10px]">{id}</span>
                  ))}
                  {impact.new_critical_path.length > 8 && (
                    <span className="text-[10px] text-[var(--text-muted)]">+{impact.new_critical_path.length - 8} more</span>
                  )}
                </div>
              </div>
            )}

            {/* Apply to schedule */}
            {onApplyChanges && modifiedProject && (
              <div className="pt-1">
                {isApplied ? (
                  <div className="flex items-center gap-2 px-3 py-2 rounded-[var(--radius-sm)] bg-green-50 border border-green-200 text-xs text-green-700">
                    <span>✓</span>
                    <span>Applied to schedule. View the updated Gantt in Schedule Builder.</span>
                  </div>
                ) : (
                  <button
                    onClick={handleApply}
                    className="w-full py-2.5 text-sm font-medium text-white rounded-[var(--radius-md)] transition-all"
                    style={{ backgroundColor: 'var(--blue-primary)' }}
                    onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = 'var(--blue-hover)')}
                    onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'var(--blue-primary)')}
                  >
                    Apply Changes to Schedule
                  </button>
                )}
              </div>
            )}
          </div>
        )}

        {view === 'narrative' && (
          <div className="space-y-4">
            <div className="flex justify-end">
              <button
                onClick={handleCopy}
                className="text-xs text-[var(--text-muted)] hover:text-[var(--text-secondary)] transition-colors flex items-center gap-1"
              >
                {copied ? '✓ Copied' : 'Copy text'}
              </button>
            </div>
            <p className="text-sm text-[var(--text-primary)] leading-relaxed whitespace-pre-wrap">
              {impact.narrative}
            </p>
            {impact.citations.length > 0 && (
              <div>
                <div className="text-xs font-medium text-[var(--text-muted)] mb-2">References</div>
                <ul className="space-y-1">
                  {impact.citations.map((cite, i) => (
                    <li key={i} className="text-xs text-[var(--text-secondary)] pl-3 border-l-2 border-[var(--border-default)]">
                      {cite}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}

        {view === 'fragnet' && (
          <div className="space-y-3">
            <p className="text-xs text-[var(--text-muted)]">
              Fragnet visualization shows the impacted portion of the schedule. Purple = new activities, amber = modified activities.
            </p>
            <div className="p-4 bg-[var(--bg-secondary)] rounded-[var(--radius-md)] text-center text-xs text-[var(--text-muted)]">
              Fragnet overlay is visible in the Gantt chart above.
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
