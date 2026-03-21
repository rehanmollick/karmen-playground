'use client';

import { useEffect, useState, useCallback } from 'react';
import Navbar from '../components/layout/Navbar';
import TabNav, { type TabId } from '../components/layout/TabNav';
import Footer from '../components/layout/Footer';
import ProjectSelector from '../components/schedule-builder/ProjectSelector';
import ActivityTable from '../components/schedule-builder/ActivityTable';
import GanttChart from '../components/gantt/GanttChart';
import ChatPanel from '../components/chat/ChatPanel';
import ChangeOrderPanel from '../components/change-order/ChangeOrderPanel';
import ImpactNarrative from '../components/change-order/ImpactNarrative';
import UncertaintySliders from '../components/risk/UncertaintySliders';
import CompletionDistribution from '../components/risk/CompletionDistribution';
import TornadoChart from '../components/risk/TornadoChart';
import RiskSummary from '../components/risk/RiskSummary';
import LoadingAnimation from '../components/shared/LoadingAnimation';
import { useSchedule } from '../hooks/useSchedule';
import { useSimulation } from '../hooks/useSimulation';
import { api } from '../lib/api';
import type { ChangeOrder, AnalysisResult } from '../types/changeOrder';
import type { UncertaintyRange } from '../types/risk';

export default function Home() {
  const {
    projects,
    activeProject,
    loading,
    generating,
    error: scheduleError,
    loadProjects,
    selectProject,
    generateSchedule,
    refreshProject,
  } = useSchedule();

  const {
    defaults: riskDefaults,
    result: simulationResult,
    loading: simulationLoading,
    loadDefaults: loadRiskDefaults,
    runSimulation,
  } = useSimulation();

  const [activeTab, setActiveTab] = useState<TabId>('schedule');
  const [highlightedActivityId, setHighlightedActivityId] = useState<string | undefined>();

  // Change order state
  const [changeOrders, setChangeOrders] = useState<ChangeOrder[]>([]);
  const [selectedCOId, setSelectedCOId] = useState<string | null>(null);
  const [coAnalysis, setCOAnalysis] = useState<AnalysisResult | null>(null);
  const [coAnalyzing, setCOAnalyzing] = useState(false);

  // Load projects on mount
  useEffect(() => {
    loadProjects();
  }, [loadProjects]);

  // When active project changes, load change orders and risk defaults
  useEffect(() => {
    if (!activeProject) return;

    api.getChangeOrders(activeProject.id)
      .then((data) => setChangeOrders(data as ChangeOrder[]))
      .catch(() => setChangeOrders([]));

    loadRiskDefaults(activeProject.id);
    setCOAnalysis(null);
    setSelectedCOId(null);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeProject?.id, loadRiskDefaults]);

  // Analyze change order when selected
  const handleSelectCO = useCallback(async (coId: string) => {
    if (!activeProject) return;
    setSelectedCOId(coId);
    setCOAnalyzing(true);
    setCOAnalysis(null);
    try {
      const result = await api.analyzeChangeOrder(activeProject.id, coId) as AnalysisResult;
      setCOAnalysis(result);
    } catch {
      setCOAnalysis(null);
    } finally {
      setCOAnalyzing(false);
    }
  }, [activeProject]);

  function handleExport() {
    if (!activeProject) return;
    const url = api.exportXmlUrl(activeProject.id);
    window.open(url, '_blank');
  }

  function handleRunSimulation(ranges: UncertaintyRange[]) {
    if (!activeProject) return;
    runSimulation(activeProject.id, ranges);
  }

  // Determine fragnet overlay data
  const newActivityIds = coAnalysis
    ? new Set(coAnalysis.modified_project.activities
        .filter((a) => !activeProject?.activities.find((orig) => orig.id === a.id))
        .map((a) => a.id))
    : undefined;

  const modifiedActivityIds = coAnalysis
    ? new Set(coAnalysis.impact.new_critical_path.filter(
        (id) => activeProject?.activities.find((a) => a.id === id)
      ))
    : undefined;

  const displayProject = activeTab === 'change-orders' && coAnalysis
    ? coAnalysis.modified_project
    : activeProject;

  const selectedCO = changeOrders.find((co) => co.id === selectedCOId);

  return (
    <div className="flex flex-col min-h-screen bg-[var(--bg-primary)]">
      <Navbar onExport={handleExport} showExport={!!activeProject} />

      {!activeProject ? (
        /* Hero / Project Selector */
        <main className="flex-1">
          {loading ? (
            <div className="flex items-center justify-center h-64">
              <LoadingAnimation message="Loading projects…" rows={3} />
            </div>
          ) : scheduleError ? (
            <div className="flex flex-col items-center justify-center h-64 gap-3">
              <p className="text-sm text-[var(--critical-red)]">{scheduleError}</p>
              <button
                onClick={loadProjects}
                className="text-sm text-[var(--blue-primary)] hover:underline"
              >
                Try Again
              </button>
            </div>
          ) : (
            <ProjectSelector
              projects={projects}
              onSelect={selectProject}
              onGenerate={generateSchedule}
              isGenerating={generating}
            />
          )}
        </main>
      ) : (
        /* Main App Shell */
        <div className="flex flex-col flex-1 min-h-0">
          {/* Tab Nav */}
          <TabNav activeTab={activeTab} onChange={setActiveTab} />

          {/* Tab content */}
          <div className="flex-1 min-h-0 overflow-hidden">
            {/* ── Schedule Builder Tab ── */}
            {activeTab === 'schedule' && (
              <div className="flex h-full" style={{ height: 'calc(100vh - 112px)' }}>
                {/* Left: Activity Table */}
                <div className="w-[45%] border-r border-[var(--border-default)] flex flex-col min-h-0">
                  <div className="flex items-center justify-between px-4 py-2.5 border-b border-[var(--border-subtle)] bg-[var(--bg-secondary)]">
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => {
                          if (window.confirm('Clear the current project and return to the selector?')) {
                            window.location.reload();
                          }
                        }}
                        className="text-xs text-[var(--text-muted)] hover:text-[var(--text-secondary)] transition-colors"
                      >
                        ← Projects
                      </button>
                      <span className="text-[var(--border-default)]">/</span>
                      <span className="text-xs font-semibold text-[var(--text-primary)] truncate max-w-[180px]">
                        {activeProject.name}
                      </span>
                    </div>
                    <span className="text-xs font-mono text-[var(--text-muted)]">
                      {activeProject.project_duration_days}d
                    </span>
                  </div>
                  <div className="flex-1 overflow-hidden">
                    <ActivityTable
                      project={activeProject}
                      highlightedId={highlightedActivityId}
                      onActivityClick={setHighlightedActivityId}
                    />
                  </div>
                </div>

                {/* Right: Gantt + Chat */}
                <div className="flex-1 flex flex-col min-h-0 min-w-0">
                  {/* Gantt */}
                  <div className="flex-1 min-h-0 overflow-hidden">
                    <GanttChart
                      project={activeProject}
                      highlightedId={highlightedActivityId}
                    />
                  </div>

                  {/* Chat Panel */}
                  <div
                    className="border-t border-[var(--border-default)]"
                    style={{ height: 260, flexShrink: 0 }}
                  >
                    <div className="grid grid-cols-2 gap-4 h-full p-3">
                      <div className="bg-[var(--bg-secondary)] rounded-[var(--radius-md)] p-3 overflow-auto text-xs text-[var(--text-muted)]">
                        <div className="font-medium text-[var(--text-secondary)] mb-2">Project Overview</div>
                        <p className="leading-relaxed">{activeProject.description}</p>
                        <div className="mt-3 font-mono text-[11px] space-y-1">
                          <div>Start: {activeProject.start_date}</div>
                          <div>Activities: {activeProject.activities.length}</div>
                          <div>Critical path: {activeProject.critical_path.length} activities</div>
                          <div>Type: {activeProject.project_type}</div>
                        </div>
                      </div>
                      <ChatPanel
                        projectId={activeProject.id}
                        onScheduleUpdate={refreshProject}
                        onActivityClick={setHighlightedActivityId}
                      />
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* ── Change Orders Tab ── */}
            {activeTab === 'change-orders' && (
              <div className="flex h-full" style={{ height: 'calc(100vh - 112px)' }}>
                {/* Left: CO list */}
                <div className="w-72 border-r border-[var(--border-default)] overflow-y-auto">
                  <ChangeOrderPanel
                    changeOrders={changeOrders}
                    selectedId={selectedCOId}
                    onSelect={handleSelectCO}
                    isAnalyzing={coAnalyzing}
                  />
                </div>

                {/* Right: analysis */}
                <div className="flex-1 flex flex-col min-h-0 min-w-0 overflow-hidden">
                  {!selectedCOId ? (
                    <div className="flex items-center justify-center h-full text-sm text-[var(--text-muted)]">
                      Select a change order to analyze its schedule impact.
                    </div>
                  ) : coAnalyzing ? (
                    <div className="flex items-center justify-center h-full">
                      <div className="text-center">
                        <div className="w-8 h-8 border-2 border-[var(--blue-primary)] border-t-transparent rounded-full animate-spin mx-auto mb-3" />
                        <p className="text-sm text-[var(--text-secondary)]">Analyzing change order impact…</p>
                      </div>
                    </div>
                  ) : coAnalysis && selectedCO ? (
                    <div className="flex flex-col h-full p-4 gap-4">
                      {/* Gantt with fragnet overlay */}
                      <div className="flex-1 min-h-0 border border-[var(--border-default)] rounded-[var(--radius-md)] overflow-hidden">
                        <GanttChart
                          project={displayProject!}
                          newActivityIds={newActivityIds}
                          modifiedActivityIds={modifiedActivityIds}
                        />
                      </div>
                      {/* Impact narrative */}
                      <div style={{ height: 320, flexShrink: 0 }}>
                        <ImpactNarrative
                          impact={coAnalysis.impact}
                          changeOrderName={selectedCO.name}
                        />
                      </div>
                    </div>
                  ) : null}
                </div>
              </div>
            )}

            {/* ── Risk Analysis Tab ── */}
            {activeTab === 'risk' && (
              <div className="flex h-full" style={{ height: 'calc(100vh - 112px)' }}>
                {/* Left: sliders */}
                <div className="w-80 border-r border-[var(--border-default)] overflow-hidden flex flex-col">
                  {riskDefaults.length > 0 ? (
                    <UncertaintySliders
                      ranges={riskDefaults}
                      activities={activeProject.activities}
                      onRunSimulation={handleRunSimulation}
                      isRunning={simulationLoading}
                    />
                  ) : (
                    <div className="p-4">
                      <LoadingAnimation message="Loading risk defaults…" rows={6} />
                    </div>
                  )}
                </div>

                {/* Right: charts */}
                <div className="flex-1 overflow-y-auto p-6 space-y-6">
                  {simulationResult ? (
                    <>
                      <RiskSummary
                        result={simulationResult}
                        deterministicDate={simulationResult.deterministic_date}
                      />
                      <div className="bg-white border border-[var(--border-default)] rounded-[var(--radius-md)] p-4">
                        <CompletionDistribution result={simulationResult} />
                      </div>
                      <div className="bg-white border border-[var(--border-default)] rounded-[var(--radius-md)] p-4">
                        <TornadoChart sensitivity={simulationResult.sensitivity} />
                      </div>
                    </>
                  ) : (
                    <div className="flex flex-col items-center justify-center h-full text-center gap-4">
                      <div className="w-16 h-16 rounded-full bg-[var(--blue-light)] flex items-center justify-center">
                        <svg width="28" height="28" viewBox="0 0 28 28" fill="none">
                          <path d="M4 20L8 14L12 17L16 10L20 13L24 6" stroke="var(--blue-primary)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                          <line x1="4" y1="22" x2="24" y2="22" stroke="var(--blue-muted)" strokeWidth="1.5" />
                        </svg>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-[var(--text-primary)] mb-1">Ready to simulate</p>
                        <p className="text-xs text-[var(--text-muted)]">Set your uncertainty ranges and run 10,000 simulations.</p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      <Footer />
    </div>
  );
}
