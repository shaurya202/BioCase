import { create } from "zustand";
import type { CaseDefinition, CaseSession, Stage, ActionLogEntry, CaseAttempt } from "@/types/case";
import { CaseEngine } from "@/features/engine/CaseEngine";
import {
  generatePatientResponse,
  generateDebrief,
  type PatientContext,
  type DebriefResult,
} from "@/lib/nim";
import { loadAttempts, saveAttempt, loadCustomCases, saveCustomCases } from "@/lib/persistence";

interface CaseState {
  cases: CaseDefinition[];
  customCases: CaseDefinition[];
  currentCase: CaseDefinition | null;
  engine: CaseEngine | null;
  session: CaseSession | null;
  currentStage: Stage;
  actionLog: ActionLogEntry[];
  discoveredClueIds: string[];
  differential: string[];
  notes: string;
  score: {
    totalScore: number;
    efficiency: number;
    missedClues: string[];
    criteria: { id: string; name: string; points: number; maxPoints: number }[];
  } | null;
  debrief: DebriefResult | null;
  patientHistory: { role: "user" | "assistant"; content: string }[];
  isLoading: boolean;
  loadingMessage: string;
  attempts: CaseAttempt[];

  loadCases: (cases: CaseDefinition[]) => void;
  addCustomCase: (caseDef: CaseDefinition) => void;
  deleteCustomCase: (caseId: string) => void;
  getAllCases: () => CaseDefinition[];
  startCase: (caseId: string) => void;
  executeAction: (actionId: string, userLabel: string) => Promise<void>;
  advanceStage: () => void;
  setStage: (stage: Stage) => void;
  updateDifferential: (diagnoses: string[]) => void;
  updateNotes: (notes: string) => void;
  completeCase: () => Promise<void>;
}

function buildPatientContext(caseDef: CaseDefinition): PatientContext {
  return {
    diagnosis: caseDef.diagnosis,
    presentingComplaint: caseDef.presentingComplaint,
    clueTree: caseDef.clueTree,
  };
}

export const useCaseStore = create<CaseState>((set, get) => ({
  cases: [],
  customCases: loadCustomCases(),
  currentCase: null,
  engine: null,
  session: null,
  currentStage: "history",
  actionLog: [],
  discoveredClueIds: [],
  differential: [],
  notes: "",
  score: null,
  debrief: null,
  patientHistory: [],
  isLoading: false,
  loadingMessage: "",
  attempts: loadAttempts(),

  loadCases: (cases) => set({ cases }),

  addCustomCase: (caseDef) => {
    const updated = [...get().customCases, caseDef];
    saveCustomCases(updated);
    set({ customCases: updated });
  },

  deleteCustomCase: (caseId) => {
    const updated = get().customCases.filter((c) => c.metadata.id !== caseId);
    saveCustomCases(updated);
    set({ customCases: updated });
  },

  getAllCases: () => [...get().cases, ...get().customCases],

  startCase: (caseId) => {
    const allCases = [...get().cases, ...get().customCases];
    const caseDef = allCases.find((c) => c.metadata.id === caseId);
    if (!caseDef) return;
    const engine = new CaseEngine(caseDef);
    const session = engine.getSession();
    set({
      currentCase: caseDef,
      engine,
      session,
      currentStage: "history",
      actionLog: [],
      discoveredClueIds: [],
      differential: [],
      notes: "",
      score: null,
      debrief: null,
      patientHistory: [],
      isLoading: false,
      loadingMessage: "",
    });
  },

  executeAction: async (actionId, userLabel) => {
    const { engine, currentCase, patientHistory } = get();
    if (!engine || !currentCase) return;

    const userMsg = { role: "user" as const, content: userLabel };
    set((s) => ({
      patientHistory: [...s.patientHistory, userMsg],
      isLoading: true,
      loadingMessage: "Thinking...",
    }));

    const action = currentCase.allowedActions.find((a) => a.id === actionId);
    if (!action) {
      set({ isLoading: false });
      return;
    }

    const stage = get().currentStage;
    const useNim = stage === "history" || stage === "exam";

    let responseText: string;

    if (useNim) {
      try {
        const ctx = buildPatientContext(currentCase);
        const nimResponse = await generatePatientResponse(ctx, userLabel, patientHistory);
        responseText = nimResponse;
      } catch (err) {
        console.warn("NIM call failed, using fallback:", err);
        responseText = action.responseText;
      }
    } else {
      responseText = action.responseText;
    }

    const entry = engine.executeAction(actionId);
    if (entry) {
      entry.responseText = responseText;
    }
    const session = engine.getSession();

    const assistantMsg = { role: "assistant" as const, content: responseText };

    set({
      actionLog: [...session.actionLog],
      discoveredClueIds: [...session.discoveredClueIds],
      session,
      patientHistory: [...get().patientHistory, assistantMsg],
      isLoading: false,
      loadingMessage: "",
    });
  },

  advanceStage: () => {
    const { engine } = get();
    if (!engine) return;
    const newStage = engine.advanceStage();
    if (newStage) {
      set({ currentStage: newStage, session: engine.getSession() });
    }
  },

  setStage: (stage) => {
    const { engine } = get();
    if (!engine) return;
    engine.setStage(stage);
    set({ currentStage: stage, session: engine.getSession() });
  },

  updateDifferential: (diagnoses) => {
    const { engine } = get();
    if (!engine) return;
    engine.updateDifferential(diagnoses);
    set({ differential: diagnoses, session: engine.getSession() });
  },

  updateNotes: (notes) => {
    const { engine } = get();
    if (!engine) return;
    engine.updateNotes(notes);
    set({ notes, session: engine.getSession() });
  },

  completeCase: async () => {
    const { engine, currentCase, actionLog } = get();
    if (!engine || !currentCase) return;

    set({ isLoading: true, loadingMessage: "Generating debrief..." });

    engine.complete();
    const score = engine.calculateScore();
    const session = engine.getSession();

    const actionDescriptions = actionLog.map((entry) => {
      const action = currentCase.allowedActions.find((a) => a.id === entry.actionId);
      return `[${entry.stage}] ${action?.label ?? entry.actionId}`;
    });

    const correctPath = currentCase.debriefTemplate;

    let debrief: DebriefResult;
    try {
      const ctx = buildPatientContext(currentCase);
      debrief = await generateDebrief(ctx, actionDescriptions, correctPath);
    } catch (err) {
      console.warn("NIM debrief failed, using fallback:", err);
      debrief = {
        summary: currentCase.debriefTemplate,
        correctPath,
        missedClues: score.missedClues,
        betterAlternatives: [],
      };
    }

    // Save attempt to localStorage
    const attempt: CaseAttempt = {
      id: `${currentCase.metadata.id}-${Date.now()}`,
      caseId: currentCase.metadata.id,
      completedAt: Date.now(),
      score,
      actionLog: [...actionLog],
      discoveredClueIds: [...session.discoveredClueIds],
    };
    saveAttempt(attempt);

    set({
      score,
      session,
      debrief,
      currentStage: "debrief",
      isLoading: false,
      loadingMessage: "",
      attempts: loadAttempts(),
    });
  },
}));
