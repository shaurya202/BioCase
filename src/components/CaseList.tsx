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
    <div className="space-y-1.5">
      {cases.map((c) => {
        const best = getBestScore(c.metadata.id);
        const count = getAttemptCount(c.metadata.id);
        const isCustom = "isCustom" in c.metadata && c.metadata.isCustom;
        return (
          <button
            key={c.metadata.id}
            onClick={() => startCase(c.metadata.id)}
            className={`w-full text-left px-3.5 py-3 rounded-lg border transition-all group ${
              currentCase?.metadata.id === c.metadata.id
                ? "bg-bg-hover border-accent/50"
                : "bg-bg-panel border-border/60 hover:border-text-muted/50 card-hover"
            }`}
          >
            <div className="flex items-start justify-between gap-2">
              <div className="flex items-center gap-1.5 min-w-0">
                <h3 className="text-[13px] font-medium leading-tight truncate">{c.metadata.title}</h3>
                {isCustom && (
                  <span className="text-[9px] px-1.5 py-0.5 rounded bg-accent/15 text-accent font-semibold flex-shrink-0">
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
                        ? "bg-success/15 text-success"
                        : best >= 50
                          ? "bg-warning/15 text-warning"
                          : "bg-danger/15 text-danger"
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
            <div className="flex items-center gap-1.5 mt-1.5">
              <span className="text-[11px] text-text-muted">{c.metadata.specialty}</span>
              <span className="text-[11px] text-text-muted/50">·</span>
              <span className="text-[11px] text-text-muted">{c.metadata.estimatedMinutes} min</span>
              {count > 0 && (
                <>
                  <span className="text-[11px] text-text-muted/50">·</span>
                  <span className="text-[11px] text-text-muted">
                    {count} attempt{count !== 1 ? "s" : ""}
                  </span>
                </>
              )}
            </div>
            {c.metadata.tags.length > 0 && (
              <div className="flex gap-1 mt-2 flex-wrap">
                {c.metadata.tags.slice(0, 3).map((tag) => (
                  <span
                    key={tag}
                    className="text-[10px] px-1.5 py-0.5 rounded bg-bg-primary/80 text-text-muted border border-border/30"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            )}
          </button>
        );
      })}
    </div>
  );
}
