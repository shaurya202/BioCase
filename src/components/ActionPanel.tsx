import { useCaseStore } from "@/stores/caseStore";

export function ActionPanel() {
  const {
    currentCase,
    currentStage,
    executeAction,
    advanceStage,
    completeCase,
    actionLog,
    isLoading,
    updateDifferential,
    differential,
  } = useCaseStore();

  if (!currentCase) return null;

  const availableActions = currentCase.allowedActions.filter((a) => a.stage === currentStage);

  const handleActionClick = (actionId: string, actionLabel: string, stage: string) => {
    executeAction(actionId, actionLabel);
    // If it's a diagnosis action, also update the differential
    if (stage === "diagnosis") {
      const current = useCaseStore.getState().differential;
      if (!current.includes(actionLabel)) {
        updateDifferential([...current, actionLabel]);
      }
    }
  };

  return (
    <div className="flex flex-col h-full">
      <div className="px-5 py-4 border-b border-border">
        <h3 className="text-sm font-semibold text-text-secondary capitalize">
          {currentStage} Phase
        </h3>
        <p className="text-[11px] text-text-muted mt-0.5">
          {currentStage === "history" && "Ask the patient questions to gather information."}
          {currentStage === "exam" && "Select examination actions to perform."}
          {currentStage === "labs" && "Order tests and review results."}
          {currentStage === "diagnosis" && "Select your working diagnosis."}
          {currentStage === "treatment" && "Choose your management plan."}
          {currentStage === "debrief" && "Review your performance."}
        </p>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-2">
        {availableActions.map((action) => {
          const isUsed = actionLog.some((e) => e.actionId === action.id);
          const isDiagnosisSelected = currentStage === "diagnosis" && differential.includes(action.label);
          return (
            <button
              key={action.id}
              onClick={() => handleActionClick(action.id, action.label, action.stage)}
              disabled={isUsed || isLoading}
              className={`w-full text-left px-4 py-3 rounded-lg border text-sm transition-all ${
                isUsed
                  ? isDiagnosisSelected
                    ? "bg-accent/10 border-accent/30 text-accent cursor-not-allowed"
                    : "bg-bg-panel/50 border-border/50 text-text-muted cursor-not-allowed"
                  : "bg-bg-panel border-border hover:border-accent/50 hover:bg-bg-hover text-text-primary card-hover"
              } ${isLoading && !isUsed ? "opacity-50 cursor-not-allowed" : ""}`}
            >
              <div className="font-medium">
                {isDiagnosisSelected && "✓ "}{action.label}
              </div>
              <div className="text-[11px] text-text-muted mt-0.5">{action.category}</div>
            </button>
          );
        })}
      </div>

      <div className="px-5 py-4 border-t border-border">
        {currentStage === "diagnosis" && differential.length > 0 && (
          <div className="mb-3">
            <label className="text-[11px] text-text-muted">Selected:</label>
            <div className="text-xs text-accent mt-0.5">{differential[differential.length - 1]}</div>
          </div>
        )}
        {currentStage !== "debrief" && (
          <button
            onClick={() => {
              if (currentStage === "treatment") {
                completeCase();
              } else {
                advanceStage();
              }
            }}
            disabled={isLoading}
            className="w-full px-4 py-2.5 bg-accent hover:bg-accent-hover text-white rounded-lg text-sm font-medium transition-colors disabled:opacity-50"
          >
            {isLoading
              ? "Loading..."
              : currentStage === "treatment"
                ? "Complete Case"
                : "Next Stage"}
          </button>
        )}
      </div>
    </div>
  );
}
