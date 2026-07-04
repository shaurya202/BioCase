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
  } = useCaseStore();

  if (!currentCase) return null;

  const availableActions = currentCase.allowedActions.filter((a) => a.stage === currentStage);

  // Dynamic diagnosis options from case actions + correct diagnosis
  const diagnosisActions = currentCase.allowedActions.filter((a) => a.stage === "diagnosis");
  const diagnosisOptions = [
    currentCase.diagnosis,
    ...diagnosisActions.map((a) => a.label),
  ].filter((v, i, arr) => arr.indexOf(v) === i); // dedupe

  // Dynamic treatment options from case actions
  const treatmentActions = currentCase.allowedActions.filter((a) => a.stage === "treatment");
  const treatmentOptions = treatmentActions.length > 0
    ? treatmentActions.map((a) => a.label)
    : ["No treatment actions defined"];

  return (
    <div className="flex flex-col h-full">
      <div className="p-4 border-b border-border">
        <h3 className="text-sm font-semibold text-text-secondary capitalize">
          {currentStage} Phase
        </h3>
        <p className="text-xs text-text-muted mt-1">
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
          return (
            <button
              key={action.id}
              onClick={() => executeAction(action.id, action.label)}
              disabled={isUsed || isLoading}
              className={`w-full text-left p-3 rounded-lg border text-sm transition-colors ${
                isUsed
                  ? "bg-bg-panel/50 border-border text-text-muted cursor-not-allowed"
                  : "bg-bg-panel border-border hover:border-accent hover:bg-bg-hover text-text-primary"
              } ${isLoading && !isUsed ? "opacity-50 cursor-not-allowed" : ""}`}
            >
              <div className="font-medium">{action.label}</div>
              <div className="text-xs text-text-muted mt-0.5">{action.category}</div>
            </button>
          );
        })}
      </div>

      <div className="p-4 border-t border-border">
        {currentStage === "diagnosis" && (
          <div className="space-y-2 mb-3">
            <label className="text-xs text-text-muted">Your diagnosis:</label>
            <select
              className="w-full px-3 py-2 bg-bg-panel border border-border rounded-md text-sm"
              onChange={(e) => {
                if (e.target.value) {
                  useCaseStore.getState().updateDifferential([e.target.value]);
                }
              }}
            >
              <option value="">Select a diagnosis...</option>
              {diagnosisOptions.map((opt) => (
                <option key={opt} value={opt}>{opt}</option>
              ))}
            </select>
          </div>
        )}
        {currentStage === "treatment" && (
          <div className="space-y-2 mb-3">
            <label className="text-xs text-text-muted">Management plan:</label>
            <div className="space-y-1">
              {treatmentOptions.map((item) => (
                <label
                  key={item}
                  className="flex items-center gap-2 text-xs text-text-secondary"
                >
                  <input type="checkbox" className="rounded border-border" />
                  {item}
                </label>
              ))}
            </div>
          </div>
        )}
        {currentStage === "debrief" ? null : (
          <button
            onClick={() => {
              if (currentStage === "treatment") {
                completeCase();
              } else {
                advanceStage();
              }
            }}
            disabled={isLoading}
            className="w-full py-2 bg-accent hover:bg-accent-hover text-white rounded-md text-sm font-medium transition-colors disabled:opacity-50"
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
