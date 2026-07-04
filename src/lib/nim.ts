const NIM_BASE = "https://integrate.api.nvidia.com/v1";
const MODEL = "nvidia/llama-3.3-nemotron-super-49b-v1.5";

interface ChatMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

interface ChatCompletionResponse {
  choices: { message: { content: string } }[];
}

export async function chatCompletion(
  messages: ChatMessage[],
  options: { model?: string; temperature?: number; maxTokens?: number } = {}
): Promise<string> {
  const apiKey = import.meta.env.VITE_NIM_API_KEY;
  if (!apiKey) throw new Error("VITE_NIM_API_KEY not set in .env");

  const res = await fetch(`${NIM_BASE}/chat/completions`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: options.model ?? MODEL,
      messages,
      temperature: options.temperature ?? 0.7,
      max_tokens: options.maxTokens ?? 1024,
    }),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`NIM API error ${res.status}: ${text}`);
  }

  const data: ChatCompletionResponse = await res.json();
  return data.choices[0].message.content;
}

export interface PatientContext {
  diagnosis: string;
  presentingComplaint: string;
  clueTree: { id: string; text: string; category: string }[];
}

export async function generatePatientResponse(
  patientCtx: PatientContext,
  question: string,
  conversationHistory: { role: "user" | "assistant"; content: string }[]
): Promise<string> {
  const clueSummary = patientCtx.clueTree.map((c) => `- [${c.category}] ${c.text}`).join("\n");

  const systemPrompt = `You are simulating a patient in a clinical reasoning case.

CASE DATA:
Presenting complaint: ${patientCtx.presentingComplaint}
Diagnosis: ${patientCtx.diagnosis}

Known findings (you may reveal these naturally if asked appropriately):
${clueSummary}

RULES:
- Stay in character as the patient at all times.
- Only reveal information that is consistent with the case data above.
- Respond naturally, like a real patient — use casual language, not medical jargon.
- Do NOT reveal the diagnosis directly. If asked "do you have X?", respond naturally (e.g., "I don't know" or "They haven't told me that").
- Keep responses concise: 1-3 sentences.
- If asked about something not in the case data, say "I don't know" or "That hasn't come up."
- Express appropriate emotions (anxiety, discomfort) consistent with the presenting complaint.`;

  const messages: ChatMessage[] = [
    { role: "system", content: systemPrompt },
    ...conversationHistory.map((h) => ({ role: h.role, content: h.content })),
    { role: "user", content: question },
  ];

  return chatCompletion(messages, { temperature: 0.8, maxTokens: 256 });
}

export interface DebriefResult {
  summary: string;
  correctPath: string;
  missedClues: string[];
  betterAlternatives: string[];
}

export async function generateDebrief(
  patientCtx: PatientContext,
  actionDescriptions: string[],
  correctPath: string
): Promise<DebriefResult> {
  const systemPrompt = `You are a medical education debrief system for a clinical reasoning simulator.

Generate a structured debrief based on the student's performance. Be specific, constructive, and educational.

Respond with ONLY valid JSON (no markdown, no code fences):
{
  "summary": "2-3 sentence overview of how the student performed",
  "correctPath": "description of the ideal diagnostic approach for this case",
  "missedClues": ["specific clues or findings the student failed to uncover"],
  "betterAlternatives": ["actionable suggestions for improving their clinical reasoning"]
}`;

  const userPrompt = `Case: ${patientCtx.presentingComplaint}
Correct diagnosis: ${patientCtx.diagnosis}

Student's actions during the case:
${actionDescriptions.map((a, i) => `${i + 1}. ${a}`).join("\n")}

Ideal diagnostic path:
${correctPath}`;

  const response = await chatCompletion(
    [
      { role: "system", content: systemPrompt },
      { role: "user", content: userPrompt },
    ],
    { temperature: 0.3, maxTokens: 1024 }
  );

  try {
    const cleaned = response.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();
    return JSON.parse(cleaned) as DebriefResult;
  } catch {
    return {
      summary: response,
      correctPath,
      missedClues: [],
      betterAlternatives: [],
    };
  }
}
