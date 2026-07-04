# BioCase PRD

## 1. Product overview

**Name:** BioCase
**Type:** Desktop clinical reasoning simulator
**One-line pitch:** BioCase is a desktop app that helps students practice clinical reasoning through realistic, interactive patient cases with history-taking, labs, evidence review, decisions, and structured debriefs.
**Primary goal:** Make users think through cases like a clinician, not just ask an AI questions.

## 2. Problem statement

Medical and biology students often learn facts without enough practice applying them in realistic scenarios. Existing study tools usually give answers too early and do not force the user to commit to a differential diagnosis, choose next steps, or reflect on mistakes. BioCase solves this by simulating the reasoning process and scoring the user's decisions, which is much closer to how professional competence is built.

## 3. Target users

- Medical students who want practice with clinical reasoning.
- Pre-med and life sciences students who want a serious portfolio project with health/science depth.
- Residents or junior learners who want quick case drills.
- Educators who want reusable cases for teaching or demoing reasoning skills.

## 4. Product vision

BioCase should feel like a premium desktop training environment, not a chat app. The user should enter a case, investigate it step by step, choose what to ask or test next, and then receive a detailed debrief that explains their reasoning quality, missed clues, and better alternatives. The app should feel like a simulation lab where decisions matter, and where the result is a learning experience rather than a generated paragraph.

## 5. Core experience

The experience should revolve around one loop:

1. A case opens with a chief complaint or presenting problem.
2. The user decides what to ask, inspect, or order next.
3. New information is revealed based on the user's choices.
4. The user builds a working diagnosis and selects management steps.
5. The app scores the decision path and gives a structured debrief.

That loop is the heart of the product, and it is what makes BioCase feel like a real simulator instead of a wrapper.

## 6. UX goals

The UI should feel like a modern clinical workstation:

- Calm, dark, and high-contrast without looking flashy.
- Dense enough for serious use, but not cluttered.
- Structured into clear panels with strong hierarchy.
- Easy to navigate with keyboard and mouse.
- Focused on case progression, evidence, and feedback.

## 7. Desktop layout

### Main window structure

- **Left sidebar:** case list, progress, tags, saved cases, and scenario filters.
- **Center panel:** active case content and patient interaction area.
- **Right panel:** differential diagnosis, case notes, evidence, and scoring feedback.
- **Bottom strip or drawer:** action log, recent events, and quick-access history.

This layout makes the app feel like a working system, not a webpage.

## 8. First-screen UI

The home screen should open to a case inbox rather than a blank dashboard. Each case card should show:

- case title,
- specialty or topic,
- difficulty,
- estimated time,
- completion status,
- confidence/reasoning score if previously attempted.

At the top, there should be a search bar for finding cases and a clear "Start New Case" button. The overall impression should be compact, organized, and serious.

## 9. Case screen UI

### Top section

- patient name or identifier.
- age, sex, and context tags.
- current stage indicator: history, exam, labs, diagnosis, treatment, debrief.
- timer or attempt progress if enabled.

### Center workspace

The center should switch between interaction modes:

- **History mode:** user chooses questions to ask.
- **Exam mode:** user selects physical exam actions.
- **Lab mode:** user orders tests.
- **Imaging/data mode:** user inspects results.
- **Decision mode:** user chooses diagnosis or management.

### Right-side reasoning panel

This panel should show:

- working differential diagnosis.
- key clues discovered so far.
- confidence in each hypothesis.
- user notes.
- selected next best step.

### Feedback panel

After each major decision, the app should show subtle feedback:

- "reasonable choice,"
- "missed clue,"
- "high-value next question,"
- "premature diagnosis,"
- "good escalation."

Feedback should be precise and educational, not loud or game-like.

## 10. Case mechanics

Each case should support progressive disclosure:

- The user cannot see everything at once.
- Each action unlocks specific information.
- Some clues are only available through the right question or test.
- The case should adapt based on the user's path.

This creates genuine interactivity and makes the simulator feel alive.

## 11. Initial feature set

### Case discovery

- Browse cases by topic, specialty, difficulty, and estimated time.
- Search cases by keyword.
- Bookmark or favorite cases.

### Interactive questioning

- Ask patient history questions from a structured menu.
- Request physical exam findings.
- Order labs, imaging, or other evidence.
- Reveal results incrementally.

### Reasoning tools

- Differential diagnosis panel.
- Case notes panel.
- Clue highlighting.
- Timeline of what the user has already done.
- "Most likely diagnosis" draft area.

### Decision points

- Choose next step.
- Choose diagnosis.
- Choose treatment or management direction.
- Confirm or revise a hypothesis.

### Scoring and debrief

- Reasoning quality score.
- Missed clue summary.
- Efficiency score.
- Evidence use score.
- Final explanation of the correct path.

### Case management

- Save progress.
- Replay case.
- Review past attempts.
- Compare multiple attempts on the same case.

### Accessibility and usability

- Keyboard shortcuts.
- Quick search.
- Adjustable text size.
- Consistent dark/light theme if time permits.

## 12. NVIDIA NIM's role

NVIDIA NIM should not be the product surface. It should support the simulation engine behind the scenes by:

- generating patient responses consistently,
- adapting the case based on user choices,
- producing structured debriefs,
- scoring reasoning against a rubric,
- explaining why certain steps were stronger than others.

The user should feel like they are solving a case inside an app, not chatting with an assistant.

## 13. Data and content model

Each case should have:

- case metadata,
- presenting complaint,
- hidden diagnosis,
- clue tree,
- allowed actions,
- response rules,
- scoring rubric,
- debrief template,
- learning objectives.

This makes the simulator easier to scale and allows you to add new cases without redesigning the app.

## 14. MVP feature priorities

### Must-have at launch

- Case browser.
- One interactive case flow.
- History, exam, labs, and diagnosis phases.
- Differential diagnosis panel.
- Scoring after completion.
- Debrief summary.
- Saved attempts.
- Basic desktop polish.

### Nice-to-have after launch

- Multiple specialties.
- Voice input.
- Multiplayer or instructor mode.
- Case editor.
- Analytics dashboard for learning progress.
- Branching difficulty levels.

## 15. Non-functional requirements

- **Fast:** the app should react instantly to user decisions.
- **Reliable:** case logic should stay consistent and not contradict itself.
- **Trustworthy:** scoring should be explainable.
- **Polished:** should feel like premium educational software.
- **Private:** no unnecessary data collection.
- **Desktop-native:** works well as a local installable app.

## 16. Technical direction

A strong build path would be:

- **Electron + React** or **Tauri + React** for desktop UI.
- **Local storage** for cases and attempt history.
- **Backend logic** for case state and scoring.
- **NVIDIA NIM API** for response generation and debrief text.
- **Structured JSON** for case state updates.

If you want a stronger technical impression, build a proper case engine so that every user action updates a shared state object rather than a loose chat transcript.

## 17. Design language

The design should feel:

- clinical,
- refined,
- calm,
- evidence-driven,
- readable,
- premium.

Avoid:

- chat bubbles,
- playful AI gradients,
- glowing futuristic decorations,
- "assistant" branding,
- anything that feels like a prompt demo.

## 18. Success metrics

- Users complete a case from start to finish.
- Users receive meaningful feedback on reasoning.
- The simulator clearly feels interactive, not like a wrapper.
- The demo shows progression, evidence, and scoring.
- Judges can understand the value in under one minute.

## 19. Portfolio value

This project is stronger than a generic life sciences search app because it shows:

- product thinking,
- state management,
- simulation logic,
- user interaction design,
- domain knowledge,
- and serious use of NVIDIA NIM as an engine rather than the product.
