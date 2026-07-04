# BioCase — Build Plan

## Phase 0: Project scaffold

1. Initialize a **Tauri + React + TypeScript** project (Tauri for smaller binary, native feel).
2. Configure tooling: Vite, ESLint, Prettier, Tailwind CSS.
3. Set up a basic `src/` layout:
   ```
   src/
   ├── components/        # UI components
   ├── features/          # Feature modules (case, engine, scoring)
   ├── lib/               # Utilities, API client, storage
   ├── stores/            # Zustand state stores
   ├── types/             # Shared TypeScript types
   ├── App.tsx
   └── main.tsx
   ```
4. Add a `public/cases/` directory for bundled case JSON files.
5. Commit a working "hello world" Tauri window.

## Phase 1: Data model & case format

Define the JSON schema that every case must satisfy:

```jsonc
{
  "id": "case-001",
  "title": "Chest Pain in a 52M",
  "specialty": "Internal Medicine",
  "difficulty": "intermediate",
  "estimatedMinutes": 15,
  "presentingComplaint": "...",
  "diagnosis": "...",
  "clueTree": { ... },        // branches of information
  "allowedActions": [...],     // what the user can do at each stage
  "responseRules": [...],      // maps action → revealed info
  "scoringRubric": { ... },
  "debriefTemplate": "...",
  "learningObjectives": [...]
}
```

Build 2-3 seed cases (one easy, one moderate, one hard) to validate the model before building UI.

## Phase 2: Case engine (core state machine)

Create a `CaseEngine` module that:

- Loads a case JSON and instantiates a `CaseSession` object.
- Tracks the current stage: `history → exam → labs → diagnosis → treatment → debrief`.
- Maintains an `actionLog[]` of everything the user has done.
- Maintains a `discoveredClues[]` set.
- Maintains a `differential[]` (user's working diagnosis list).
- Exposes methods:
  - `getAvailableActions() → Action[]`
  - `executeAction(actionId) → ActionResult`
  - `getCurrentStage() → Stage`
  - `getDiscoveredClues() → Clue[]`
  - `getScore() → Score`
  - `getDebrief() → Debrief`

This engine is **pure TypeScript, no UI dependency**, so it is testable in isolation.

## Phase 3: NVIDIA NIM integration

### What NIM does

| Task | Prompt pattern | Output |
|---|---|---|
| Patient responses | System prompt + case context + user question → structured JSON response | `{ "text": "...", "clueId": "...", "emotion": "..." }` |
| Debrief generation | System prompt + full action log + correct path → structured debrief JSON | `{ "summary": "...", "missedClues": [...], "scoreBreakdown": {...} }` |
| Scoring rubric evaluation | System prompt + action log + rubric → scored rubric JSON | `{ "criteria": [...], "totalScore": 85 }` |

### NIM client (`src/lib/nim.ts`)

- Use the **NVIDIA NIM OpenAI-compatible endpoint** (`https://integrate.api.nvidia.com/v1`).
- Model: a capable chat model available on NIM (e.g., `meta/llama-3.1-70b-instruct`).
- Keep a single `chatCompletion()` helper that handles auth, retries, and streaming.
- All NIM calls are **fire-and-forget behind the engine** — the user never sees raw AI text.

### Prompt templates

Store prompts in `src/lib/prompts/` as template strings with `{placeholders}`:

- `patient-response.ts` — generates realistic patient dialogue.
- `scoring.ts` — evaluates the user's path against the rubric.
- `debrief.ts` — produces the structured debrief.

## Phase 4: UI — shell & layout

Build the three-panel desktop shell:

1. **Left sidebar** (280px, fixed):
   - Case list with search/filter.
   - Each case card: title, specialty, difficulty pill, time estimate, completion badge.
   - "Start New Case" button pinned to top.

2. **Center panel** (flex-grow):
   - Stage indicator tabs (History → Exam → Labs → Diagnosis → Treatment → Debrief).
   - Mode-specific interaction area (question selector, exam action list, test orderer, etc.).

3. **Right panel** (320px, fixed):
   - Differential diagnosis list (add/remove/reorder).
   - Discovered clues feed.
   - User notes textarea.
   - Score summary (hidden until debrief).

4. **Bottom drawer** (collapsible, 120px):
   - Action log with timestamps.

Use Tailwind with a custom `clinical` color palette: deep navy backgrounds, muted teal accents, white text, low-saturation borders.

## Phase 5: UI — interactive case flow

### History mode
- Render a scrollable list of question categories (e.g., "Onset & Timing", "Associated Symptoms", "Past Medical History").
- Clicking a question sends it to the engine → engine returns patient response → displayed in a chat-like but structured format (not bubbles — plain text cards).

### Exam mode
- Grid of exam action buttons (e.g., "Auscultate heart", "Palpate abdomen").
- Each action reveals a finding card.

### Labs mode
- Searchable test catalog.
- Ordering a test shows a result card (lab value + interpretation hint).

### Diagnosis mode
- User selects from a differential list or types a free-text diagnosis.
- Confirmation step before moving to treatment.

### Treatment mode
- Checklist of management steps (medications, referrals, follow-up).

### Debrief mode
- Full summary, score breakdown, missed clues, better-path explanation.
- "Replay Case" and "Next Case" buttons.

## Phase 6: Scoring & feedback

After the user completes a case, the engine:

1. Compares the action log against the `scoringRubric`.
2. Calls NIM to generate a natural-language debrief (if rubric alone is insufficient).
3. Computes:
   - **Reasoning quality** (0-100): did they ask the right questions in a reasonable order?
   - **Efficiency** (0-100): how many actions before correct diagnosis?
   - **Evidence use** (0-100): did they order the right tests?
   - **Missed clues** count.
4. Displays results in the right panel with a clean bar-chart or radial score.

## Phase 7: Persistence & case management

- Use **localStorage** (or SQLite via Tauri plugin) to store:
  - Attempt history per case (action log, score, timestamp).
  - Bookmarked cases.
  - User preferences (theme, text size).
- On case list, show completion badges and best scores.

## Phase 8: Polish & extras

- Keyboard shortcuts: `⌘+N` new case, `⌘+/` search, `⌘+D` toggle differential panel.
- Adjustable font size slider.
- Dark theme (default) with optional light theme toggle.
- Smooth transitions between stages.
- Error handling: NIM timeout → graceful fallback message, not crash.

## Phase 9: Seed content & demo

- Write 5-10 cases across specialties (cardiology, neurology, infectious disease, emergency medicine, pediatrics).
- Each case validated against the schema.
- Record a 60-second screen capture showing: case selection → history → exam → labs → diagnosis → debrief with scores.

---

## Tech stack summary

| Layer | Choice | Reason |
|---|---|---|
| Desktop shell | Tauri 2 | Small binary, Rust backend, native feel |
| UI | React 18 + TypeScript + Tailwind | Fast iteration, component ecosystem |
| State | Zustand | Lightweight, no boilerplate |
| Case engine | Pure TypeScript class | Testable, decoupled from UI |
| AI backend | NVIDIA NIM (OpenAI-compatible) | Hosted inference, no GPU setup needed |
| Storage | localStorage / SQLite plugin | Local persistence |
| Build | Vite + Cargo | Fast dev loop |

## Milestone targets

| Milestone | What's done | Target |
|---|---|---|
| M0 | Scaffold, Tauri window opens, Tailwind works | Day 1 |
| M1 | Case JSON schema + 2 seed cases + engine unit tests | Day 2-3 |
| M2 | Three-panel shell with static case list | Day 3-4 |
| M3 | Interactive case flow: history → exam → labs → diagnosis → debrief | Day 5-7 |
| M4 | NIM integration: patient responses + debrief generation | Day 7-9 |
| M5 | Scoring engine + score display | Day 9-10 |
| M6 | Persistence: saved attempts, bookmarks | Day 10-11 |
| M7 | Polish: shortcuts, transitions, 5+ cases | Day 12-14 |
