import { useCaseStore } from "@/stores/caseStore";

export function ReasoningPanel() {
  const { discoveredClueIds, differential, notes, updateNotes, currentCase } = useCaseStore();

  const discoveredClues = currentCase?.clueTree.filter((c) =>
    discoveredClueIds.includes(c.id)
  ) ?? [];

  return (
    <div className="flex flex-col h-full">
      <div className="p-4 border-b border-border">
        <h2 className="text-sm font-semibold text-text-secondary">Reasoning Panel</h2>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-5">
        {/* Differential */}
        <div>
          <h3 className="text-xs font-semibold text-text-muted uppercase tracking-wider mb-2">
            Differential Diagnosis
          </h3>
          {differential.length > 0 ? (
            <div className="space-y-1">
              {differential.map((d) => (
                <div
                  key={d}
                  className="px-2.5 py-1.5 bg-bg-panel rounded border border-border text-sm"
                >
                  {d}
                </div>
              ))}
            </div>
          ) : (
            <p className="text-xs text-text-muted italic">No differential entered yet</p>
          )}
        </div>

        {/* Discovered Clues */}
        <div>
          <h3 className="text-xs font-semibold text-text-muted uppercase tracking-wider mb-2">
            Discovered Clues ({discoveredClues.length}/{currentCase?.clueTree.length ?? 0})
          </h3>
          {discoveredClues.length > 0 ? (
            <div className="space-y-1">
              {discoveredClues.map((clue) => (
                <div
                  key={clue.id}
                  className="px-2.5 py-1.5 bg-bg-panel rounded border border-border text-xs"
                >
                  <span className="text-text-primary">{clue.text}</span>
                  <span className="text-text-muted ml-1">({clue.category})</span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-xs text-text-muted italic">No clues discovered yet</p>
          )}
        </div>

        {/* Notes */}
        <div>
          <h3 className="text-xs font-semibold text-text-muted uppercase tracking-wider mb-2">
            Case Notes
          </h3>
          <textarea
            value={notes}
            onChange={(e) => updateNotes(e.target.value)}
            placeholder="Write your reasoning notes here..."
            className="w-full h-24 px-3 py-2 bg-bg-panel border border-border rounded-md text-xs text-text-primary placeholder:text-text-muted resize-none focus:outline-none focus:border-border-focus"
          />
        </div>
      </div>
    </div>
  );
}
