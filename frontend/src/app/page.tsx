'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Navbar from '../components/layout/Navbar';
import TabNav, { type TabId } from '../components/layout/TabNav';
import Footer from '../components/layout/Footer';
import ProjectSelector from '../components/schedule-builder/ProjectSelector';
import ActivityTable from '../components/schedule-builder/ActivityTable';
import GanttChart from '../components/gantt/GanttChart';
import ChatPanel from '../components/chat/ChatPanel';
import ChangeOrderPanel, { type CustomCO } from '../components/change-order/ChangeOrderPanel';
import ImpactNarrative from '../components/change-order/ImpactNarrative';
import BeforeAfterToggle from '../components/change-order/BeforeAfterToggle';
import UncertaintySliders from '../components/risk/UncertaintySliders';
import CompletionDistribution from '../components/risk/CompletionDistribution';
import TornadoChart from '../components/risk/TornadoChart';
import RiskSummary from '../components/risk/RiskSummary';
import RiskNarrative from '../components/risk/RiskNarrative';
import LoadingAnimation from '../components/shared/LoadingAnimation';
import { useSchedule } from '../hooks/useSchedule';
import { useSimulation } from '../hooks/useSimulation';
import { api } from '../lib/api';
import type { ChangeOrder, AnalysisResult } from '../types/changeOrder';
import type { Project } from '../types/schedule';
import type { UncertaintyRange } from '../types/risk';

const tabOrder: TabId[] = ['schedule', 'change-orders', 'risk'];

const tabVariants = {
  enter: (dir: number) => ({ x: dir * 40, opacity: 0 }),
  center: { x: 0, opacity: 1 },
  exit: (dir: number) => ({ x: dir * -40, opacity: 0 }),
};

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
    clearProject,
    overrideActiveProject,
  } = useSchedule();

  const {
    defaults: riskDefaults,
    result: simulationResult,
    loading: simulationLoading,
    loadDefaults: loadRiskDefaults,
    runSimulation,
  } = useSimulation();

  const [activeTab, setActiveTab] = useState<TabId>('schedule');
  const [prevTab, setPrevTab] = useState<TabId>('schedule');
  const [highlightedActivityId, setHighlightedActivityId] = useState<string | undefined>();

  // Change order state
  const [changeOrders, setChangeOrders] = useState<ChangeOrder[]>([]);
  const [selectedCOId, setSelectedCOId] = useState<string | null>(null);
  const [coAnalysis, setCOAnalysis] = useState<AnalysisResult | null>(null);
  const [coAnalyzing, setCOAnalyzing] = useState(false);
  const [showImpacted, setShowImpacted] = useState(false);
  // Cache analysis results so re-selecting a CO doesn't re-run the API call
  const [coAnalysisCache, setCOAnalysisCache] = useState<Record<string, AnalysisResult>>({});
  // Track which CO IDs have been applied to the schedule
  const [appliedCOIds, setAppliedCOIds] = useState<Set<string>>(new Set());

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
    setShowImpacted(false);
    setCOAnalysisCache({});
    setAppliedCOIds(new Set());
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeProject?.id, loadRiskDefaults]);

  // Map from custom CO id -> CustomCO data (persists across tab switches)
  const [customCOMap, setCustomCOMap] = useState<Record<string, Omit<CustomCO, 'id'>>>({});

  const handleSelectCO = useCallback(async (coId: string) => {
    if (!activeProject) return;
    setSelectedCOId(coId);
    setShowImpacted(false);

    // Use cached result if available — no re-analysis needed
    if (coAnalysisCache[coId]) {
      setCOAnalysis(coAnalysisCache[coId]);
      return;
    }

    setCOAnalyzing(true);
    setCOAnalysis(null);
    try {
      const customData = customCOMap[coId];
      const result = customData
        ? await api.analyzeCustomChangeOrder(activeProject.id, customData.name, customData.description, customData.source) as AnalysisResult
        : await api.analyzeChangeOrder(activeProject.id, coId) as AnalysisResult;
      setCOAnalysis(result);
      setCOAnalysisCache((prev) => ({ ...prev, [coId]: result }));
    } catch {
      setCOAnalysis(null);
    } finally {
      setCOAnalyzing(false);
    }
  }, [activeProject, customCOMap, coAnalysisCache]);

  const handleSubmitCustomCO = useCallback(async (id: string, name: string, description: string, source: string) => {
    if (!activeProject) return;
    // Register the custom CO first, then immediately analyze
    setCustomCOMap((prev) => ({ ...prev, [id]: { name, description, source } }));
    setSelectedCOId(id);
    setCOAnalyzing(true);
    setCOAnalysis(null);
    setShowImpacted(false);
    try {
      const result = await api.analyzeCustomChangeOrder(activeProject.id, name, description, source) as AnalysisResult;
      if (result?.impact && result?.modified_project) {
        setCOAnalysis(result);
        setCOAnalysisCache((prev) => ({ ...prev, [id]: result }));
      } else {
        setCOAnalysis(null);
      }
    } catch {
      setCOAnalysis(null);
    } finally {
      setCOAnalyzing(false);
    }
  }, [activeProject]);

  function handleTabChange(tab: TabId) {
    setPrevTab(activeTab);
    setActiveTab(tab);
  }

  function handleGoHome() {
    clearProject();
    setCOAnalysis(null);
    setSelectedCOId(null);
    setShowImpacted(false);
    setChangeOrders([]);
    setCOAnalysisCache({});
    setAppliedCOIds(new Set());
    setActiveTab('schedule');
  }

  async function handleApplyCO(modifiedProject: Project) {
    if (!activeProject || !selectedCOId) return;
    try {
      await api.updateProject(activeProject.id, modifiedProject);
    } catch {
      // If backend update fails, still update frontend state
    }
    overrideActiveProject({ ...modifiedProject, id: activeProject.id });
    setAppliedCOIds((prev) => new Set(prev).add(selectedCOId));
    // Navigate to Schedule Builder so the user can see the updated schedule
    handleTabChange('schedule');
  }

  function handleExport() {
    if (!activeProject) return;
    window.open(api.exportXmlUrl(activeProject.id), '_blank');
  }

  const riskScrollRef = useRef<HTMLDivElement>(null);

  // Scroll to top so stat boxes are fully visible when results load
  useEffect(() => {
    if (simulationResult && riskScrollRef.current) {
      riskScrollRef.current.scrollTop = 0;
    }
  }, [simulationResult]);

  function handleRunSimulation(ranges: UncertaintyRange[]) {
    if (!activeProject) return;
    runSimulation(activeProject.id, ranges);
  }

  const tabDir = tabOrder.indexOf(activeTab) - tabOrder.indexOf(prevTab);

  // Fragnet overlay data
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

  const displayProject = showImpacted && coAnalysis
    ? coAnalysis.modified_project
    : activeProject;

  const customCOList = Object.entries(customCOMap).map(([id, data]) => ({ id, ...data }));

  const selectedCO = changeOrders.find((co) => co.id === selectedCOId)
    ?? (selectedCOId && customCOMap[selectedCOId]
      ? { id: selectedCOId, ...customCOMap[selectedCOId] }
      : null);

  return (
    <div className="flex flex-col min-h-screen bg-[var(--bg-primary)]">
      {/* <1024px responsive banner */}
      <div className="block xl:hidden bg-[var(--bg-tertiary)] border-b border-[var(--border-default)] px-4 py-2 text-center text-xs text-[var(--text-secondary)]">
        Best viewed on a desktop (1280px+). Some features may not display correctly on smaller screens.
      </div>

      <Navbar onExport={handleExport} showExport={!!activeProject} onGoHome={activeProject ? handleGoHome : undefined} />

      {/* Generating overlay */}
      <AnimatePresence>
        {generating && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-white/90 backdrop-blur-sm"
          >
            <div className="w-12 h-12 border-3 border-[var(--blue-primary)] border-t-transparent rounded-full animate-spin mb-4" style={{ borderWidth: 3 }} />
            <p className="text-base font-medium text-[var(--text-primary)] mb-1">Building your schedule…</p>
            <p className="text-sm text-[var(--text-muted)]">Generating CPM schedule with AI. This takes 10–30 seconds.</p>
          </motion.div>
        )}
      </AnimatePresence>

      {!activeProject ? (
        <main className="flex-1">
          {loading ? (
            <div className="flex items-center justify-center h-64">
              <LoadingAnimation message="Loading projects…" rows={3} />
            </div>
          ) : scheduleError ? (
            <div className="flex flex-col items-center justify-center h-64 gap-3">
              <p className="text-sm text-[var(--critical-red)]">{scheduleError}</p>
              <button onClick={loadProjects} className="text-sm text-[var(--blue-primary)] hover:underline">
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
        <div className="flex flex-col flex-1 min-h-0">
          <TabNav activeTab={activeTab} onChange={handleTabChange} />

          <div className="flex-1 min-h-0 overflow-hidden relative">
            <AnimatePresence mode="wait" custom={tabDir}>
              {activeTab === 'schedule' && (
                <motion.div
                  key="schedule"
                  custom={tabDir}
                  variants={tabVariants}
                  initial="enter"
                  animate="center"
                  exit="exit"
                  transition={{ duration: 0.2, ease: 'easeInOut' }}
                  className="absolute inset-0 flex"
                  style={{ height: 'calc(100vh - 112px)' }}
                >
                  {/* Left: Activity Table */}
                  <div className="w-[45%] border-r border-[var(--border-default)] flex flex-col min-h-0">
                    <div className="flex items-center justify-between px-4 py-2.5 border-b border-[var(--border-subtle)] bg-[var(--bg-secondary)]">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={clearProject}
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
                    <div className="flex-1 min-h-0 overflow-hidden">
                      <GanttChart project={activeProject} highlightedId={highlightedActivityId} />
                    </div>
                    <div className="border-t border-[var(--border-default)]" style={{ height: 260, flexShrink: 0 }}>
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
                </motion.div>
              )}

              {activeTab === 'change-orders' && (
                <motion.div
                  key="change-orders"
                  custom={tabDir}
                  variants={tabVariants}
                  initial="enter"
                  animate="center"
                  exit="exit"
                  transition={{ duration: 0.2, ease: 'easeInOut' }}
                  className="absolute inset-0 flex"
                  style={{ height: 'calc(100vh - 112px)' }}
                >
                  {/* Left: CO list */}
                  <div className="w-72 border-r border-[var(--border-default)] overflow-y-auto flex-shrink-0">
                    <ChangeOrderPanel
                      changeOrders={changeOrders}
                      customCOs={customCOList}
                      selectedId={selectedCOId}
                      appliedIds={appliedCOIds}
                      onSelect={handleSelectCO}
                      onSubmitCustom={handleSubmitCustomCO}
                      isAnalyzing={coAnalyzing}
                    />
                  </div>

                  {/* Right */}
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
                      <div className="flex flex-col h-full p-4 gap-3">
                        {/* Gantt header with before/after toggle */}
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-semibold text-[var(--text-primary)]">{selectedCO.name}</span>
                          <BeforeAfterToggle
                            delayDays={coAnalysis.impact.delay_days}
                            onToggle={setShowImpacted}
                          />
                        </div>
                        {/* Gantt */}
                        <div className="flex-1 min-h-0 border border-[var(--border-default)] rounded-[var(--radius-md)] overflow-hidden">
                          <GanttChart
                            project={displayProject!}
                            newActivityIds={showImpacted ? newActivityIds : undefined}
                            modifiedActivityIds={showImpacted ? modifiedActivityIds : undefined}
                          />
                        </div>
                        {/* Impact narrative */}
                        <div style={{ height: 300, flexShrink: 0 }}>
                          <ImpactNarrative
                            impact={coAnalysis.impact}
                            changeOrderName={selectedCO.name}
                            projectId={activeProject.id}
                            modifiedProject={coAnalysis.modified_project}
                            onApplyChanges={handleApplyCO}
                            isApplied={selectedCOId ? appliedCOIds.has(selectedCOId) : false}
                          />
                        </div>
                      </div>
                    ) : null}
                  </div>
                </motion.div>
              )}

              {activeTab === 'risk' && (
                <motion.div
                  key="risk"
                  custom={tabDir}
                  variants={tabVariants}
                  initial="enter"
                  animate="center"
                  exit="exit"
                  transition={{ duration: 0.2, ease: 'easeInOut' }}
                  className="absolute inset-0 flex"
                  style={{ height: 'calc(100vh - 112px)' }}
                >
                  {/* Left: sliders */}
                  <div className="w-80 border-r border-[var(--border-default)] overflow-hidden flex flex-col flex-shrink-0">
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

                  {/* Right: all content in one scroll container */}
                  <div ref={riskScrollRef} className="flex-1 overflow-y-auto">
                    <div className="p-6 space-y-6">
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
                          <RiskNarrative
                            result={simulationResult}
                            deterministicDate={simulationResult.deterministic_date}
                          />
                        </>
                      ) : (
                        <div className="flex flex-col items-center justify-center py-32 text-center gap-4">
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
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      )}

      <Footer />
    </div>
  );
}
