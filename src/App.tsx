import { useEffect, useState } from "react";
import { useCaseStore } from "@/stores/caseStore";
import { seedCases } from "@/features/case/seedCases";
import { CaseList } from "@/components/CaseList";
import { StageIndicator } from "@/components/StageIndicator";
import { ActionPanel } from "@/components/ActionPanel";
import { PatientResponse } from "@/components/PatientResponse";
import { ReasoningPanel } from "@/components/ReasoningPanel";
import { DebriefPanel } from "@/components/DebriefPanel";
import { CaseUploadModal } from "@/components/CaseUploadModal";

export default function App() {
  const { currentCase, currentStage, loadCases, customCases } = useCaseStore();
  const [search, setSearch] = useState("");
  const [uploadOpen, setUploadOpen] = useState(false);

  useEffect(() => {
    loadCases(seedCases);
  }, [loadCases]);

  const cases = useCaseStore((s) => s.cases);
  const allCases = [...cases, ...customCases];
  const filtered = search
    ? allCases.filter(
        (c) =>
          c.metadata.title.toLowerCase().includes(search.toLowerCase()) ||
          c.metadata.specialty.toLowerCase().includes(search.toLowerCase()) ||
          c.metadata.tags.some((t) => t.toLowerCase().includes(search.toLowerCase()))
      )
    : allCases;

  return (
    <div className="flex h-screen bg-bg-primary text-text-primary">
      {/* Left Sidebar */}
      <aside className="w-[280px] flex-shrink-0 bg-bg-secondary border-r border-border flex flex-col">
        <div className="p-4 border-b border-border">
          <h1 className="text-lg font-bold tracking-tight">BioCase</h1>
          <p className="text-xs text-text-muted mt-1">Clinical Reasoning Simulator</p>
        </div>
        <div className="p-3 space-y-2">
          <input
            type="text"
            placeholder="Search cases..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full px-3 py-2 bg-bg-panel border border-border rounded-md text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:border-border-focus"
          />
          <button
            onClick={() => setUploadOpen(true)}
            className="w-full px-3 py-2 bg-accent hover:bg-accent-hover text-white rounded-md text-sm font-medium transition-colors"
          >
            + Upload Case
          </button>
        </div>
        <div className="flex-1 overflow-y-auto p-3 space-y-2">
          <CaseList cases={filtered} />
        </div>
      </aside>

      {/* Center Panel */}
      <main className="flex-1 flex flex-col bg-bg-primary min-w-0">
        {/* Top Bar */}
        {currentCase && (
          <div className="flex items-center justify-between px-4 py-3 border-b border-border bg-bg-secondary">
            <div>
              <h2 className="text-sm font-semibold">{currentCase.metadata.title}</h2>
              <p className="text-xs text-text-muted">
                {currentCase.metadata.specialty} · {currentCase.metadata.difficulty}
              </p>
            </div>
            <StageIndicator currentStage={currentStage} />
          </div>
        )}

        {/* Main Content */}
        {currentCase ? (
          <div className="flex-1 flex min-h-0">
            {/* Patient Interaction */}
            <div className="flex-1 flex flex-col min-w-0 border-r border-border">
              <PatientResponse />
            </div>
            {/* Action Panel */}
            <div className="w-[320px] flex-shrink-0">
              <ActionPanel />
            </div>
          </div>
        ) : (
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center">
              <div className="text-6xl mb-4 opacity-20">🩺</div>
              <h2 className="text-xl font-semibold text-text-secondary">Select a case to begin</h2>
              <p className="text-sm text-text-muted mt-2">
                Choose from the sidebar or upload your own case
              </p>
            </div>
          </div>
        )}
      </main>

      {/* Right Panel */}
      <aside className="w-[320px] flex-shrink-0 bg-bg-secondary border-l border-border">
        {currentStage === "debrief" ? <DebriefPanel /> : <ReasoningPanel />}
      </aside>

      {/* Upload Modal */}
      <CaseUploadModal open={uploadOpen} onClose={() => setUploadOpen(false)} />
    </div>
  );
}
