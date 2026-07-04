import { useState } from "react";
import type { CaseDefinition, Clue, Action, ScoringCriterion, Stage } from "@/types/case";

interface CaseEditorProps {
  initialCase: CaseDefinition;
  onSave: (caseDef: CaseDefinition) => void;
  onCancel: () => void;
}

const STAGES: Stage[] = ["history", "exam", "labs", "diagnosis", "treatment"];
const CLUE_CATEGORIES = ["history", "exam", "labs"];
const DIFFICULTIES = ["easy", "moderate", "hard"] as const;

export function CaseEditor({ initialCase, onSave, onCancel }: CaseEditorProps) {
  const [caseData, setCaseData] = useState<CaseDefinition>(initialCase);
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({
    metadata: true,
    complaint: true,
    clues: true,
    actions: true,
    scoring: false,
    debrief: false,
  });

  const toggle = (section: string) =>
    setExpandedSections((s) => ({ ...s, [section]: !s[section] }));

  const updateMeta = (field: string, value: string | number | string[]) => {
    setCaseData((d) => ({
      ...d,
      metadata: { ...d.metadata, [field]: value },
    }));
  };

  // ── Clues ──
  const addClue = () => {
    const id = `c${caseData.clueTree.length + 1}`;
    setCaseData((d) => ({
      ...d,
      clueTree: [...d.clueTree, { id, text: "", category: "history", value: 5 }],
    }));
  };
  const updateClue = (index: number, field: keyof Clue, value: string | number) => {
    setCaseData((d) => ({
      ...d,
      clueTree: d.clueTree.map((c, i) => (i === index ? { ...c, [field]: value } : c)),
    }));
  };
  const removeClue = (index: number) => {
    setCaseData((d) => ({ ...d, clueTree: d.clueTree.filter((_, i) => i !== index) }));
  };

  // ── Actions ──
  const addAction = () => {
    const id = `a${caseData.allowedActions.length + 1}`;
    setCaseData((d) => ({
      ...d,
      allowedActions: [
        ...d.allowedActions,
        { id, label: "", category: "", stage: "history" as Stage, revealsClueIds: [], responseText: "" },
      ],
    }));
  };
  const updateAction = (index: number, field: keyof Action, value: unknown) => {
    setCaseData((d) => ({
      ...d,
      allowedActions: d.allowedActions.map((a, i) =>
        i === index ? { ...a, [field]: value } : a
      ),
    }));
  };
  const removeAction = (index: number) => {
    setCaseData((d) => ({
      ...d,
      allowedActions: d.allowedActions.filter((_, i) => i !== index),
    }));
  };

  // ── Scoring ──
  const addCriterion = () => {
    const id = `s${caseData.scoringCriteria.length + 1}`;
    setCaseData((d) => ({
      ...d,
      scoringCriteria: [...d.scoringCriteria, { id, name: "", description: "", maxPoints: 25 }],
    }));
  };
  const updateCriterion = (index: number, field: keyof ScoringCriterion, value: string | number) => {
    setCaseData((d) => ({
      ...d,
      scoringCriteria: d.scoringCriteria.map((c, i) =>
        i === index ? { ...c, [field]: value } : c
      ),
    }));
  };
  const removeCriterion = (index: number) => {
    setCaseData((d) => ({
      ...d,
      scoringCriteria: d.scoringCriteria.filter((_, i) => i !== index),
    }));
  };

  // ── Learning objectives ──
  const addObjective = () => {
    setCaseData((d) => ({ ...d, learningObjectives: [...d.learningObjectives, ""] }));
  };
  const updateObjective = (index: number, value: string) => {
    setCaseData((d) => ({
      ...d,
      learningObjectives: d.learningObjectives.map((o, i) => (i === index ? value : o)),
    }));
  };
  const removeObjective = (index: number) => {
    setCaseData((d) => ({
      ...d,
      learningObjectives: d.learningObjectives.filter((_, i) => i !== index),
    }));
  };

  const handleSave = () => {
    onSave(caseData);
  };

  const Section = ({
    id,
    title,
    children,
  }: {
    id: string;
    title: string;
    children: React.ReactNode;
  }) => (
    <div className="border border-border rounded-lg overflow-hidden">
      <button
        onClick={() => toggle(id)}
        className="w-full flex items-center justify-between px-4 py-2.5 bg-bg-panel hover:bg-bg-hover text-sm font-semibold text-text-secondary transition-colors"
      >
        {title}
        <span className="text-text-muted text-xs">{expandedSections[id] ? "−" : "+"}</span>
      </button>
      {expandedSections[id] && <div className="p-4 space-y-3">{children}</div>}
    </div>
  );

  return (
    <div className="flex flex-col h-full">
      <div className="p-4 border-b border-border flex items-center justify-between">
        <h2 className="text-sm font-semibold text-text-secondary">Edit Extracted Case</h2>
        <div className="flex gap-2">
          <button
            onClick={onCancel}
            className="px-3 py-1.5 text-xs text-text-muted border border-border rounded hover:bg-bg-hover transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            className="px-3 py-1.5 text-xs bg-accent hover:bg-accent-hover text-white rounded transition-colors"
          >
            Save Case
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {/* Metadata */}
        <Section id="metadata" title="Metadata">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-text-muted mb-1 block">Title</label>
              <input
                value={caseData.metadata.title}
                onChange={(e) => updateMeta("title", e.target.value)}
                className="w-full px-3 py-1.5 bg-bg-primary border border-border rounded text-sm"
              />
            </div>
            <div>
              <label className="text-xs text-text-muted mb-1 block">Specialty</label>
              <input
                value={caseData.metadata.specialty}
                onChange={(e) => updateMeta("specialty", e.target.value)}
                className="w-full px-3 py-1.5 bg-bg-primary border border-border rounded text-sm"
              />
            </div>
            <div>
              <label className="text-xs text-text-muted mb-1 block">Difficulty</label>
              <select
                value={caseData.metadata.difficulty}
                onChange={(e) => updateMeta("difficulty", e.target.value)}
                className="w-full px-3 py-1.5 bg-bg-primary border border-border rounded text-sm"
              >
                {DIFFICULTIES.map((d) => (
                  <option key={d} value={d}>{d}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-xs text-text-muted mb-1 block">Est. Minutes</label>
              <input
                type="number"
                value={caseData.metadata.estimatedMinutes}
                onChange={(e) => updateMeta("estimatedMinutes", parseInt(e.target.value) || 15)}
                className="w-full px-3 py-1.5 bg-bg-primary border border-border rounded text-sm"
              />
            </div>
          </div>
          <div>
            <label className="text-xs text-text-muted mb-1 block">Tags (comma-separated)</label>
            <input
              value={caseData.metadata.tags.join(", ")}
              onChange={(e) => updateMeta("tags", e.target.value.split(",").map((t) => t.trim()).filter(Boolean))}
              className="w-full px-3 py-1.5 bg-bg-primary border border-border rounded text-sm"
            />
          </div>
        </Section>

        {/* Presenting Complaint */}
        <Section id="complaint" title="Presenting Complaint & Diagnosis">
          <div>
            <label className="text-xs text-text-muted mb-1 block">Presenting Complaint</label>
            <textarea
              value={caseData.presentingComplaint}
              onChange={(e) => setCaseData((d) => ({ ...d, presentingComplaint: e.target.value }))}
              rows={3}
              className="w-full px-3 py-1.5 bg-bg-primary border border-border rounded text-sm resize-none"
            />
          </div>
          <div>
            <label className="text-xs text-text-muted mb-1 block">Correct Diagnosis</label>
            <input
              value={caseData.diagnosis}
              onChange={(e) => setCaseData((d) => ({ ...d, diagnosis: e.target.value }))}
              className="w-full px-3 py-1.5 bg-bg-primary border border-border rounded text-sm"
            />
          </div>
        </Section>

        {/* Clues */}
        <Section id="clues" title={`Clue Tree (${caseData.clueTree.length})`}>
          {caseData.clueTree.map((clue, i) => (
            <div key={i} className="flex gap-2 items-start">
              <span className="text-xs text-text-muted mt-1.5 w-5">{clue.id}</span>
              <input
                value={clue.text}
                onChange={(e) => updateClue(i, "text", e.target.value)}
                placeholder="Finding description"
                className="flex-1 px-2 py-1.5 bg-bg-primary border border-border rounded text-xs"
              />
              <select
                value={clue.category}
                onChange={(e) => updateClue(i, "category", e.target.value)}
                className="w-20 px-1 py-1.5 bg-bg-primary border border-border rounded text-xs"
              >
                {CLUE_CATEGORIES.map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
              <input
                type="number"
                value={clue.value}
                onChange={(e) => updateClue(i, "value", parseInt(e.target.value) || 5)}
                className="w-14 px-1 py-1.5 bg-bg-primary border border-border rounded text-xs text-center"
                title="Value (1-10)"
              />
              <button onClick={() => removeClue(i)} className="text-danger text-xs mt-1">✕</button>
            </div>
          ))}
          <button onClick={addClue} className="text-xs text-accent hover:text-accent-hover">+ Add Clue</button>
        </Section>

        {/* Actions */}
        <Section id="actions" title={`Actions (${caseData.allowedActions.length})`}>
          {caseData.allowedActions.map((action, i) => (
            <div key={i} className="p-3 bg-bg-primary border border-border rounded space-y-2">
              <div className="flex gap-2">
                <input
                  value={action.label}
                  onChange={(e) => updateAction(i, "label", e.target.value)}
                  placeholder="Action label"
                  className="flex-1 px-2 py-1 bg-bg-secondary border border-border rounded text-xs"
                />
                <input
                  value={action.category}
                  onChange={(e) => updateAction(i, "category", e.target.value)}
                  placeholder="Category"
                  className="w-28 px-2 py-1 bg-bg-secondary border border-border rounded text-xs"
                />
                <select
                  value={action.stage}
                  onChange={(e) => updateAction(i, "stage", e.target.value)}
                  className="w-24 px-1 py-1 bg-bg-secondary border border-border rounded text-xs"
                >
                  {STAGES.map((s) => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </select>
                <button onClick={() => removeAction(i)} className="text-danger text-xs">✕</button>
              </div>
              <input
                value={action.revealsClueIds.join(", ")}
                onChange={(e) => updateAction(i, "revealsClueIds", e.target.value.split(",").map((s) => s.trim()).filter(Boolean))}
                placeholder="Reveals clue IDs (comma-separated)"
                className="w-full px-2 py-1 bg-bg-secondary border border-border rounded text-xs"
              />
              <textarea
                value={action.responseText}
                onChange={(e) => updateAction(i, "responseText", e.target.value)}
                placeholder="Patient/clinical response"
                rows={2}
                className="w-full px-2 py-1 bg-bg-secondary border border-border rounded text-xs resize-none"
              />
            </div>
          ))}
          <button onClick={addAction} className="text-xs text-accent hover:text-accent-hover">+ Add Action</button>
        </Section>

        {/* Scoring */}
        <Section id="scoring" title="Scoring Criteria">
          {caseData.scoringCriteria.map((crit, i) => (
            <div key={i} className="flex gap-2 items-start">
              <input
                value={crit.name}
                onChange={(e) => updateCriterion(i, "name", e.target.value)}
                placeholder="Name"
                className="flex-1 px-2 py-1.5 bg-bg-primary border border-border rounded text-xs"
              />
              <input
                value={crit.description}
                onChange={(e) => updateCriterion(i, "description", e.target.value)}
                placeholder="Description"
                className="flex-1 px-2 py-1.5 bg-bg-primary border border-border rounded text-xs"
              />
              <input
                type="number"
                value={crit.maxPoints}
                onChange={(e) => updateCriterion(i, "maxPoints", parseInt(e.target.value) || 25)}
                className="w-16 px-1 py-1.5 bg-bg-primary border border-border rounded text-xs text-center"
              />
              <button onClick={() => removeCriterion(i)} className="text-danger text-xs mt-1">✕</button>
            </div>
          ))}
          <button onClick={addCriterion} className="text-xs text-accent hover:text-accent-hover">+ Add Criterion</button>
        </Section>

        {/* Debrief */}
        <Section id="debrief" title="Debrief & Learning Objectives">
          <div>
            <label className="text-xs text-text-muted mb-1 block">Debrief Template</label>
            <textarea
              value={caseData.debriefTemplate}
              onChange={(e) => setCaseData((d) => ({ ...d, debriefTemplate: e.target.value }))}
              rows={3}
              className="w-full px-3 py-1.5 bg-bg-primary border border-border rounded text-sm resize-none"
            />
          </div>
          <div>
            <label className="text-xs text-text-muted mb-1 block">Learning Objectives</label>
            {caseData.learningObjectives.map((obj, i) => (
              <div key={i} className="flex gap-2 mb-1">
                <input
                  value={obj}
                  onChange={(e) => updateObjective(i, e.target.value)}
                  className="flex-1 px-2 py-1 bg-bg-primary border border-border rounded text-xs"
                />
                <button onClick={() => removeObjective(i)} className="text-danger text-xs">✕</button>
              </div>
            ))}
            <button onClick={addObjective} className="text-xs text-accent hover:text-accent-hover">+ Add Objective</button>
          </div>
        </Section>
      </div>
    </div>
  );
}
