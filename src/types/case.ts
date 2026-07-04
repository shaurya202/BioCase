export type Stage = "history" | "exam" | "labs" | "diagnosis" | "treatment" | "debrief";

export type Difficulty = "easy" | "moderate" | "hard";

export interface CaseMetadata {
  id: string;
  title: string;
  specialty: string;
  difficulty: Difficulty;
  estimatedMinutes: number;
  tags: string[];
  isCustom?: boolean;
}

export interface Clue {
  id: string;
  text: string;
  category: string;
  value: number;
}

export interface Action {
  id: string;
  label: string;
  category: string;
  stage: Stage;
  revealsClueIds: string[];
  responseText: string;
}

export interface ResponseRule {
  actionId: string;
  responseText: string;
  revealsClueIds: string[];
}

export interface ScoringCriterion {
  id: string;
  name: string;
  description: string;
  maxPoints: number;
}

export interface CaseDefinition {
  metadata: CaseMetadata;
  presentingComplaint: string;
  diagnosis: string;
  clueTree: Clue[];
  allowedActions: Action[];
  responseRules: ResponseRule[];
  scoringCriteria: ScoringCriterion[];
  debriefTemplate: string;
  learningObjectives: string[];
}

export interface ActionLogEntry {
  actionId: string;
  timestamp: number;
  stage: Stage;
  responseText: string;
  discoveredClueIds: string[];
}

export interface Score {
  criteria: { id: string; name: string; points: number; maxPoints: number }[];
  totalScore: number;
  efficiency: number;
  missedClues: string[];
}

export interface Debrief {
  summary: string;
  correctPath: string;
  missedClues: string[];
  betterAlternatives: string[];
  score: Score;
}

export interface CaseSession {
  caseId: string;
  actionLog: ActionLogEntry[];
  discoveredClueIds: string[];
  currentStage: Stage;
  differential: string[];
  notes: string;
  startedAt: number;
  completedAt: number | null;
}

export interface CaseAttempt {
  id: string;
  caseId: string;
  completedAt: number;
  score: Score;
  actionLog: ActionLogEntry[];
  discoveredClueIds: string[];
}
