import { useCaseStore } from "@/stores/caseStore";
import type { CaseDefinition, Difficulty } from "@/types/case";

const difficultyColor: Record<Difficulty, string> = {
  easy: "bg-easy",
  moderate: "bg-moderate",
  hard: "bg-hard",
};

export function CaseList({ cases }: { cases: CaseDefinition[] }) {
  const { startCase, currentCase, attempts, deleteCustomCase } = useCaseStore();

  const getBestScore = (caseId: string) => {
    const caseAttempts = attempts.filter((a) => a.caseId === caseId);
    if (caseAttempts.length === 0) return null;
    return Math.max(...caseAttempts.map((a) => a.score.totalScore));
  };

  const getAttemptCount = (caseId: string) => {
    return attempts.filter((a) => a.caseId === caseId).length;
  };

  return (
    <div className="space-y-2">
      {cases.map((c) => {
        const best = getBestScore(c.metadata.id);
        const count = getAttemptCount(c.metadata.id);
        const isCustom = "isCustom" in c.metadata && c.metadata.isCustom;
        return (
          <button
            key={c.metadata.id}
            onClick={() => startCase(c.metadata.id)}
            className={`w-full text-left p-3 rounded-lg border transition-colors group ${
              currentCase?.metadata.id === c.metadata.id
                ? "bg-bg-hover border-accent"
                : "bg-bg-panel border-border hover:border-text-muted"
            }`}
          >
            <div className="flex items-start justify-between gap-2">
              <div className="flex items-center gap-1.5 min-w-0">
                <h3 className="text-sm font-medium leading-tight truncate">{c.metadata.title}</h3>
                {isCustom && (
                  <span className="text-[9px] px-1 py-0.5 rounded bg-accent/20 text-accent font-semibold flex-shrink-0">
                    CUSTOM
                  </span>
                )}
              </div>
              <div className="flex items-center gap-1.5 flex-shrink-0">
                {isCustom && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      if (confirm(`Delete "${c.metadata.title}"?`)) {
                        deleteCustomCase(c.metadata.id);
                      }
                    }}
                    className="w-5 h-5 flex items-center justify-center rounded text-text-muted hover:text-danger hover:bg-danger/10 opacity-0 group-hover:opacity-100 transition-all"
                    title="Delete custom case"
                  >
                    ✕
                  </button>
                )}
                {best !== null && (
                  <span
                    className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                      best >= 80
                        ? "bg-success/20 text-success"
                        : best >= 50
                          ? "bg-warning/20 text-warning"
                          : "bg-danger/20 text-danger"
                    }`}
                  >
                    {best}%
                  </span>
                )}
                <span
                  className={`w-2 h-2 rounded-full ${difficultyColor[c.metadata.difficulty]}`}
                />
              </div>
            </div>
            <div className="flex items-center gap-2 mt-1.5">
              <span className="text-xs text-text-muted">{c.metadata.specialty}</span>
              <span className="text-xs text-text-muted">·</span>
              <span className="text-xs text-text-muted">{c.metadata.estimatedMinutes} min</span>
              {count > 0 && (
                <>
                  <span className="text-xs text-text-muted">·</span>
                  <span className="text-xs text-text-muted">
                    {count} attempt{count !== 1 ? "s" : ""}
                  </span>
                </>
              )}
            </div>
            <div className="flex gap-1 mt-2 flex-wrap">
              {c.metadata.tags.slice(0, 3).map((tag) => (
                <span
                  key={tag}
                  className="text-[10px] px-1.5 py-0.5 rounded bg-bg-primary text-text-muted"
                >
                  {tag}
                </span>
              ))}
            </div>
          </button>
        );
      })}
    </div>
  );
}
