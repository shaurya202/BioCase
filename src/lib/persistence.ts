import type { CaseAttempt, CaseDefinition } from "@/types/case";

const STORAGE_KEY = "biocase_attempts";
const CUSTOM_CASES_KEY = "biocase_custom_cases";

export function loadAttempts(): CaseAttempt[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    return JSON.parse(raw) as CaseAttempt[];
  } catch {
    return [];
  }
}

export function saveAttempt(attempt: CaseAttempt): void {
  const attempts = loadAttempts();
  attempts.push(attempt);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(attempts));
}

export function getAttemptsForCase(caseId: string): CaseAttempt[] {
  return loadAttempts().filter((a) => a.caseId === caseId);
}

export function getBestScore(caseId: string): number | null {
  const attempts = getAttemptsForCase(caseId);
  if (attempts.length === 0) return null;
  return Math.max(...attempts.map((a) => a.score.totalScore));
}

export function getAttemptCount(caseId: string): number {
  return getAttemptsForCase(caseId).length;
}

export function clearAttempts(): void {
  localStorage.removeItem(STORAGE_KEY);
}

// ── Custom cases ──

export function loadCustomCases(): CaseDefinition[] {
  try {
    const raw = localStorage.getItem(CUSTOM_CASES_KEY);
    if (!raw) return [];
    return JSON.parse(raw) as CaseDefinition[];
  } catch {
    return [];
  }
}

export function saveCustomCases(cases: CaseDefinition[]): void {
  localStorage.setItem(CUSTOM_CASES_KEY, JSON.stringify(cases));
}

export function addCustomCase(caseDef: CaseDefinition): void {
  const cases = loadCustomCases();
  cases.push(caseDef);
  saveCustomCases(cases);
}

export function deleteCustomCase(caseId: string): void {
  const cases = loadCustomCases().filter((c) => c.metadata.id !== caseId);
  saveCustomCases(cases);
}
