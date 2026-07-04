import type {
  CaseDefinition,
  CaseSession,
  Stage,
  ActionLogEntry,
  Score,

} from "@/types/case";

const STAGE_ORDER: Stage[] = ["history", "exam", "labs", "diagnosis", "treatment", "debrief"];

export class CaseEngine {
  private caseDef: CaseDefinition;
  private session: CaseSession;

  constructor(caseDef: CaseDefinition, existingSession?: CaseSession) {
    this.caseDef = caseDef;
    this.session = existingSession ?? {
      caseId: caseDef.metadata.id,
      actionLog: [],
      discoveredClueIds: [],
      currentStage: "history",
      differential: [],
      notes: "",
      startedAt: Date.now(),
      completedAt: null,
    };
  }

  getSession(): CaseSession {
    return { ...this.session };
  }

  getCaseDef(): CaseDefinition {
    return { ...this.caseDef };
  }

  getCurrentStage(): Stage {
    return this.session.currentStage;
  }

  getDiscoveredClues() {
    return this.caseDef.clueTree.filter((c) =>
      this.session.discoveredClueIds.includes(c.id)
    );
  }

  getAvailableActions() {
    return this.caseDef.allowedActions.filter(
      (a) => a.stage === this.session.currentStage
    );
  }

  executeAction(actionId: string): ActionLogEntry | null {
    const action = this.caseDef.allowedActions.find((a) => a.id === actionId);
    if (!action) return null;

    const rule = this.caseDef.responseRules.find((r) => r.actionId === actionId);
    const responseText = rule?.responseText ?? action.responseText;
    const revealedClueIds = rule?.revealsClueIds ?? action.revealsClueIds;

    const entry: ActionLogEntry = {
      actionId,
      timestamp: Date.now(),
      stage: this.session.currentStage,
      responseText,
      discoveredClueIds: revealedClueIds,
    };

    this.session.actionLog.push(entry);
    for (const clueId of revealedClueIds) {
      if (!this.session.discoveredClueIds.includes(clueId)) {
        this.session.discoveredClueIds.push(clueId);
      }
    }

    return entry;
  }

  advanceStage(): Stage | null {
    const currentIndex = STAGE_ORDER.indexOf(this.session.currentStage);
    if (currentIndex >= STAGE_ORDER.length - 1) return null;
    this.session.currentStage = STAGE_ORDER[currentIndex + 1];
    return this.session.currentStage;
  }

  setStage(stage: Stage): void {
    this.session.currentStage = stage;
  }

  updateDifferential(diagnoses: string[]): void {
    this.session.differential = diagnoses;
  }

  updateNotes(notes: string): void {
    this.session.notes = notes;
  }

  calculateScore(): Score {
    const discovered = new Set(this.session.discoveredClueIds);
    const allClueIds = new Set(this.caseDef.clueTree.map((c) => c.id));
    const missedClueIds = [...allClueIds].filter((id) => !discovered.has(id));

    const totalActions = this.session.actionLog.length;
    const totalClues = this.caseDef.clueTree.length;
    const discoveredCount = discovered.size;

    const clueRatio = totalClues > 0 ? discoveredCount / totalClues : 0;
    const efficiency = totalActions > 0 ? Math.min(1, (totalClues * 2) / totalActions) : 0;

    const criteria = this.caseDef.scoringCriteria.map((c) => {
      let points = 0;
      if (c.name.toLowerCase().includes("reasoning")) {
        points = Math.round(c.maxPoints * clueRatio);
      } else if (c.name.toLowerCase().includes("efficiency")) {
        points = Math.round(c.maxPoints * efficiency);
      } else if (c.name.toLowerCase().includes("evidence")) {
        const labActions = this.session.actionLog.filter(
          (e) => e.stage === "labs" || e.stage === "exam"
        ).length;
        points = Math.round(c.maxPoints * Math.min(1, labActions / 5));
      } else {
        points = Math.round(c.maxPoints * clueRatio);
      }
      return { id: c.id, name: c.name, points, maxPoints: c.maxPoints };
    });

    const totalScore = criteria.reduce((sum, c) => sum + c.points, 0);
    const maxScore = criteria.reduce((sum, c) => sum + c.maxPoints, 0);

    return {
      criteria,
      totalScore: maxScore > 0 ? Math.round((totalScore / maxScore) * 100) : 0,
      efficiency: Math.round(efficiency * 100),
      missedClues: missedClueIds,
    };
  }

  complete(): void {
    this.session.completedAt = Date.now();
  }
}
