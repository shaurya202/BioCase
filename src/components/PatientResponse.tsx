import { useCaseStore } from "@/stores/caseStore";

export function PatientResponse() {
  const { patientHistory, currentCase, isLoading, loadingMessage } = useCaseStore();

  if (!currentCase) return null;

  if (patientHistory.length === 0) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="text-center px-8">
          <div className="text-5xl mb-4 opacity-15">🩺</div>
          <h2 className="text-base font-semibold text-text-secondary leading-relaxed">
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
    <div className="flex-1 overflow-y-auto p-5 space-y-4">
      {patientHistory.map((msg, i) => (
        <div key={i} className="flex items-start gap-3">
          {msg.role === "user" ? (
            <>
              <div className="w-7 h-7 rounded-full bg-accent/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                <span className="text-[10px] text-accent font-bold">Q</span>
              </div>
              <div className="text-sm text-text-primary leading-relaxed">{msg.content}</div>
            </>
          ) : (
            <>
              <div className="w-7 h-7 rounded-full bg-bg-panel flex items-center justify-center flex-shrink-0 mt-0.5 border border-border">
                <span className="text-[10px] text-text-muted">A</span>
              </div>
              <div className="text-sm text-text-secondary bg-bg-panel rounded-xl px-4 py-2.5 border border-border leading-relaxed">
                {msg.content}
              </div>
            </>
          )}
        </div>
      ))}
      {isLoading && (
        <div className="flex items-start gap-3">
          <div className="w-7 h-7 rounded-full bg-bg-panel flex items-center justify-center flex-shrink-0 mt-0.5 border border-border">
            <span className="text-[10px] text-text-muted">A</span>
          </div>
          <div className="text-sm text-text-muted bg-bg-panel rounded-xl px-4 py-2.5 border border-border animate-pulse">
            {loadingMessage || "Thinking..."}
          </div>
        </div>
      )}
    </div>
  );
}
