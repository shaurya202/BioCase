import type { Stage } from "@/types/case";

const stages: { key: Stage; label: string }[] = [
  { key: "history", label: "History" },
  { key: "exam", label: "Exam" },
  { key: "labs", label: "Labs" },
  { key: "diagnosis", label: "Diagnosis" },
  { key: "treatment", label: "Treatment" },
  { key: "debrief", label: "Debrief" },
];

const stageIndex: Record<Stage, number> = {
  history: 0,
  exam: 1,
  labs: 2,
  diagnosis: 3,
  treatment: 4,
  debrief: 5,
};

export function StageIndicator({ currentStage }: { currentStage: Stage }) {
  const current = stageIndex[currentStage];

  return (
    <div className="flex items-center gap-1">
      {stages.map((s, i) => {
        const isActive = i === current;
        const isPast = i < current;
        return (
          <div key={s.key} className="flex items-center gap-1">
            <div
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[11px] font-medium transition-colors ${
                isActive
                  ? "bg-accent text-white"
                  : isPast
                    ? "bg-accent/15 text-accent"
                    : "bg-bg-panel text-text-muted"
              }`}
            >
              <span
                className={`w-1.5 h-1.5 rounded-full ${
                  isActive ? "bg-white" : isPast ? "bg-accent" : "bg-text-muted/50"
                }`}
              />
              {s.label}
            </div>
            {i < stages.length - 1 && (
              <div
                className={`w-3 h-px ${isPast ? "bg-accent/50" : "bg-border/50"}`}
              />
            )}
          </div>
        );
      })}
    </div>
  );
}
