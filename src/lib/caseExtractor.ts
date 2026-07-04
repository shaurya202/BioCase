import type { CaseDefinition } from "@/types/case";
import { chatCompletion } from "./nim";

const EXTRACTION_SYSTEM_PROMPT = `You are a medical education case extractor. Given a clinical case text, extract a structured case definition as a single JSON object.

The JSON must have exactly these fields:

{
  "metadata": {
    "id": "custom-{timestamp}",
    "title": "short case title (e.g. 'Chest Pain in 52M')",
    "specialty": "medical specialty",
    "difficulty": "easy" | "moderate" | "hard",
    "estimatedMinutes": number (5-30),
    "tags": ["relevant", "tags"]
  },
  "presentingComplaint": "the opening patient presentation (2-3 sentences)",
  "diagnosis": "the correct diagnosis",
  "clueTree": [
    {
      "id": "c1",
      "text": "human-readable finding description",
      "category": "history" | "exam" | "labs",
      "value": number (1-10, importance)
    }
  ],
  "allowedActions": [
    {
      "id": "a1",
      "label": "short action label for a button",
      "category": "grouping label",
      "stage": "history" | "exam" | "labs" | "diagnosis" | "treatment",
      "revealsClueIds": ["c1"],
      "responseText": "realistic patient/clinical response to this action"
    }
  ],
  "responseRules": [],
  "scoringCriteria": [
    {
      "id": "s1",
      "name": "Reasoning Quality",
      "description": "Did the student ask the right questions in a logical order?",
      "maxPoints": 40
    },
    {
      "id": "s2",
      "name": "Evidence Use",
      "description": "Did the student order appropriate tests?",
      "maxPoints": 30
    },
    {
      "id": "s3",
      "name": "Efficiency",
      "description": "Did the student reach a diagnosis without unnecessary steps?",
      "maxPoints": 20
    },
    {
      "id": "s4",
      "name": "Clinical Knowledge",
      "description": "Was the correct diagnosis identified?",
      "maxPoints": 10
    }
  ],
  "debriefTemplate": "2-3 sentence explanation of the correct diagnostic path and key learning points",
  "learningObjectives": ["objective 1", "objective 2", "objective 3"]
}

RULES:
- Include 8-15 clues that cover history, exam, and labs
- Include 6-10 actions spread across history, exam, and labs stages
- Always include exactly 1 diagnosis action and 1 treatment action
- Each action should reveal 1-3 specific clues via revealsClueIds
- responseText should be realistic: patient dialogue for history, clinical findings for exam/labs
- Do NOT include the diagnosis in any responseText
- Difficulty should match the complexity of the case
- Return ONLY the JSON object — no markdown fences, no explanation, no extra text`;

export async function extractCaseFromText(rawText: string): Promise<CaseDefinition> {
  const maxLength = 8000;
  const truncated = rawText.length > maxLength ? rawText.slice(0, maxLength) + "\n\n[Text truncated...]" : rawText;

  const response = await chatCompletion(
    [
      { role: "system", content: EXTRACTION_SYSTEM_PROMPT },
      { role: "user", content: `Extract a case definition from this clinical text:\n\n${truncated}` },
    ],
    { temperature: 0.3, maxTokens: 4096 }
  );

  // Clean the response — strip markdown fences if present
  const cleaned = response
    .replace(/```json\n?/g, "")
    .replace(/```\n?/g, "")
    .trim();

  let parsed: Record<string, unknown>;
  try {
    parsed = JSON.parse(cleaned);
  } catch {
    throw new Error("Failed to parse AI response as JSON. The model may have returned invalid output. Try again with a clearer file.");
  }

  // Validate and normalize
  return normalizeCaseDefinition(parsed);
}

function normalizeCaseDefinition(raw: Record<string, unknown>): CaseDefinition {
  const meta = (raw.metadata ?? {}) as Record<string, unknown>;
  const timestamp = Date.now();

  const metadata = {
    id: (meta.id as string) || `custom-${timestamp}`,
    title: (meta.title as string) || "Untitled Case",
    specialty: (meta.specialty as string) || "General",
    difficulty: (["easy", "moderate", "hard"].includes(meta.difficulty as string)
      ? (meta.difficulty as "easy" | "moderate" | "hard")
      : "moderate") as "easy" | "moderate" | "hard",
    estimatedMinutes: typeof meta.estimatedMinutes === "number" ? meta.estimatedMinutes : 15,
    tags: Array.isArray(meta.tags) ? meta.tags.map(String) : [],
    isCustom: true,
  };

  const clueTree = Array.isArray(raw.clueTree)
    ? (raw.clueTree as Record<string, unknown>[]).map((c, i) => ({
        id: (c.id as string) || `c${i + 1}`,
        text: (c.text as string) || `Clue ${i + 1}`,
        category: (["history", "exam", "labs"].includes(c.category as string)
          ? c.category
          : "history") as string,
        value: typeof c.value === "number" ? c.value : 5,
      }))
    : [];

  const allowedActions = Array.isArray(raw.allowedActions)
    ? (raw.allowedActions as Record<string, unknown>[]).map((a, i) => ({
        id: (a.id as string) || `a${i + 1}`,
        label: (a.label as string) || `Action ${i + 1}`,
        category: (a.category as string) || "General",
        stage: (["history", "exam", "labs", "diagnosis", "treatment"].includes(a.stage as string)
          ? a.stage
          : "history") as "history" | "exam" | "labs" | "diagnosis" | "treatment",
        revealsClueIds: Array.isArray(a.revealsClueIds) ? a.revealsClueIds.map(String) : [],
        responseText: (a.responseText as string) || "No response available.",
      }))
    : [];

  const scoringCriteria = Array.isArray(raw.scoringCriteria)
    ? (raw.scoringCriteria as Record<string, unknown>[]).map((s, i) => ({
        id: (s.id as string) || `s${i + 1}`,
        name: (s.name as string) || `Criterion ${i + 1}`,
        description: (s.description as string) || "",
        maxPoints: typeof s.maxPoints === "number" ? s.maxPoints : 25,
      }))
    : [
        { id: "s1", name: "Reasoning Quality", description: "Logical approach to diagnosis", maxPoints: 40 },
        { id: "s2", name: "Evidence Use", description: "Appropriate test ordering", maxPoints: 30 },
        { id: "s3", name: "Efficiency", description: "Minimal unnecessary steps", maxPoints: 20 },
        { id: "s4", name: "Clinical Knowledge", description: "Correct diagnosis", maxPoints: 10 },
      ];

  const learningObjectives = Array.isArray(raw.learningObjectives)
    ? raw.learningObjectives.map(String)
    : [];

  return {
    metadata,
    presentingComplaint: (raw.presentingComplaint as string) || "Patient presents with symptoms.",
    diagnosis: (raw.diagnosis as string) || "Diagnosis pending",
    clueTree,
    allowedActions,
    responseRules: [],
    scoringCriteria,
    debriefTemplate: (raw.debriefTemplate as string) || "Review the case and diagnostic approach.",
    learningObjectives,
  };
}
