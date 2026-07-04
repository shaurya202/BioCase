import { useCaseStore } from "@/stores/caseStore";

export function PatientResponse() {
  const { patientHistory, currentCase, isLoading, loadingMessage } = useCaseStore();

  if (!currentCase) return null;

  if (patientHistory.length === 0) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="text-center">
          <div className="text-5xl mb-3 opacity-20">🩺</div>
          <h2 className="text-lg font-semibold text-text-secondary">
            {currentCase.presentingComplaint}
          </h2>
          <p className="text-sm text-text-muted mt-2 max-w-md">
            Begin by asking the patient questions to gather information about their condition.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto p-4 space-y-3">
      {patientHistory.map((msg, i) => (
        <div key={i} className="flex items-start gap-2">
          {msg.role === "user" ? (
            <>
              <div className="w-6 h-6 rounded-full bg-accent/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                <span className="text-[10px] text-accent font-bold">Q</span>
              </div>
              <div className="text-sm text-text-primary">{msg.content}</div>
            </>
          ) : (
            <>
              <div className="w-6 h-6 rounded-full bg-bg-panel flex items-center justify-center flex-shrink-0 mt-0.5 border border-border">
                <span className="text-[10px] text-text-muted">A</span>
              </div>
              <div className="text-sm text-text-secondary bg-bg-panel rounded-lg px-3 py-2 border border-border">
                {msg.content}
              </div>
            </>
          )}
        </div>
      ))}
      {isLoading && (
        <div className="flex items-start gap-2">
          <div className="w-6 h-6 rounded-full bg-bg-panel flex items-center justify-center flex-shrink-0 mt-0.5 border border-border">
            <span className="text-[10px] text-text-muted">A</span>
          </div>
          <div className="text-sm text-text-muted bg-bg-panel rounded-lg px-3 py-2 border border-border animate-pulse">
            {loadingMessage || "Thinking..."}
          </div>
        </div>
      )}
    </div>
  );
}
