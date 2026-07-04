import { useCaseStore } from "@/stores/caseStore";

export function DebriefPanel() {
  const { score, debrief, currentCase, actionLog, startCase } = useCaseStore();

  if (!score || !currentCase) return null;

  return (
    <div className="flex flex-col h-full">
      <div className="p-4 border-b border-border">
        <h2 className="text-sm font-semibold text-text-secondary">Case Debrief</h2>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-5">
        {/* NIM-Generated Summary */}
        {debrief && (
          <div className="bg-bg-panel rounded-lg border border-border p-4">
            <h3 className="text-xs font-semibold text-text-muted uppercase tracking-wider mb-2">
              Performance Summary
            </h3>
            <p className="text-sm text-text-secondary leading-relaxed">{debrief.summary}</p>
          </div>
        )}

        {/* Score Summary */}
        <div className="bg-bg-panel rounded-lg border border-border p-4">
          <div className="text-center mb-4">
            <div className="text-4xl font-bold text-accent">{score.totalScore}%</div>
            <div className="text-xs text-text-muted mt-1">Overall Score</div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            {score.criteria.map((c) => (
              <div key={c.id} className="text-center">
                <div className="text-lg font-semibold">
                  {c.points}/{c.maxPoints}
                </div>
                <div className="text-[10px] text-text-muted">{c.name}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Efficiency */}
        <div>
          <h3 className="text-xs font-semibold text-text-muted uppercase tracking-wider mb-2">
            Efficiency
          </h3>
          <div className="w-full bg-bg-panel rounded-full h-2">
            <div
              className="bg-accent h-2 rounded-full transition-all"
              style={{ width: `${score.efficiency}%` }}
            />
          </div>
          <div className="text-xs text-text-muted mt-1">{score.efficiency}% efficiency</div>
        </div>

        {/* Correct Path (from NIM) */}
        {debrief && (
          <div>
            <h3 className="text-xs font-semibold text-text-muted uppercase tracking-wider mb-2">
              Ideal Diagnostic Path
            </h3>
            <div className="px-3 py-2 bg-bg-panel rounded border border-border text-xs text-text-secondary leading-relaxed">
              {debrief.correctPath}
            </div>
          </div>
        )}

        {/* Missed Clues */}
        {score.missedClues.length > 0 && (
          <div>
            <h3 className="text-xs font-semibold text-text-muted uppercase tracking-wider mb-2">
              Missed Clues ({score.missedClues.length})
            </h3>
            <div className="space-y-1">
              {score.missedClues.map((clueId) => {
                const clue = currentCase.clueTree.find((c) => c.id === clueId);
                return clue ? (
                  <div
                    key={clueId}
                    className="px-2.5 py-1.5 bg-danger/10 border border-danger/20 rounded text-xs text-danger"
                  >
                    {clue.text}
                  </div>
                ) : null;
              })}
            </div>
          </div>
        )}

        {/* Better Alternatives (from NIM) */}
        {debrief && debrief.betterAlternatives.length > 0 && (
          <div>
            <h3 className="text-xs font-semibold text-text-muted uppercase tracking-wider mb-2">
              Suggestions for Improvement
            </h3>
            <ul className="space-y-1">
              {debrief.betterAlternatives.map((alt, i) => (
                <li
                  key={i}
                  className="text-xs text-text-secondary flex items-start gap-2 bg-bg-panel rounded px-2.5 py-1.5 border border-border"
                >
                  <span className="text-accent mt-0.5">→</span>
                  {alt}
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Action Log */}
        <div>
          <h3 className="text-xs font-semibold text-text-muted uppercase tracking-wider mb-2">
            Your Actions ({actionLog.length})
          </h3>
          <div className="space-y-1">
            {actionLog.map((entry, i) => {
              const action = currentCase.allowedActions.find((a) => a.id === entry.actionId);
              return (
                <div
                  key={i}
                  className="px-2.5 py-1.5 bg-bg-panel rounded border border-border text-xs"
                >
                  <span className="text-text-muted">[{entry.stage}]</span>{" "}
                  <span className="text-text-primary">{action?.label ?? entry.actionId}</span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Learning Objectives */}
        <div>
          <h3 className="text-xs font-semibold text-text-muted uppercase tracking-wider mb-2">
            Learning Objectives
          </h3>
          <ul className="space-y-1">
            {currentCase.learningObjectives.map((obj, i) => (
              <li key={i} className="text-xs text-text-secondary flex items-start gap-2">
                <span className="text-accent mt-0.5">•</span>
                {obj}
              </li>
            ))}
          </ul>
        </div>

        {/* Actions */}
        <div className="flex gap-2 pb-4">
          <button
            onClick={() => startCase(currentCase.metadata.id)}
            className="flex-1 py-2 bg-accent hover:bg-accent-hover text-white rounded-md text-sm font-medium transition-colors"
          >
            Replay Case
          </button>
        </div>
      </div>
    </div>
  );
}
