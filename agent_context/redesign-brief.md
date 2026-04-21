# GH-300 practice quiz — redesign brief

**Product**: Vite + React app in `quiz-app/`; question data `quiz-app/public/questions.json`. **Constitution**: preserve question parsing and JSON schema unless redesign explicitly requires change and architect + reviewer agree.

---

## 1. Problems today

- **Single long home screen**: Setup, progress stats, “where you miss most” table, and session controls share one vertical stack with similar section styling. Under exam-prep stress it is hard to see “what to do next” versus “historical context” without scanning the whole page.
- **Visual hierarchy**: Section titles use small uppercase tertiary labels; the primary action (“Start quiz”) sits below fold after stats and possibly a long table. Headings differ between menu (`GH-300 practice quiz`) and active session (`GH-300 practice`) without a clear system.
- **Menu vs session**: Active quiz is visually similar to the menu (same max-width column, same h1 pattern). The thin progress bar (2px) and muted progress line compete with the stem for attention; session score is easy to overlook.
- **End of flow**: Finishing the last question calls `Finish` and immediately returns to the full setup screen—there is no distinct **end-of-session** state (summary, encouragement, or quick “again with same filters”). Same as tapping “Exit to menu,” so completion feels abrupt.
- **Density on small screens**: The weak-questions table is useful but heavy before “Start session”; horizontal scroll is handled, but the overall scroll depth before starting remains high.
- **Feedback after check**: Correct/incorrect copy lives in `.quiz-meta` below actions; for screen readers and visual scanning, tying result feedback more clearly to the options (already color-coded) could be strengthened with semantics and optional live feedback.

### Minimalism tradeoffs (what to merge or calm visually)

- **Merge chrome on active quiz**: Treat progress + session score as one **toolbar row** (or sticky subheader) instead of three separate visual bands (bar, progress line, optional history box). *Tradeoff*: history-on-this-question may move into that row, a subtle disclosure, or stay below the stem—coder chooses least noisy option that keeps the data visible.
- **Setup page “path to Start”**: Visually **group** shuffle / weak-only / question set / counts / buttons into a single **session card** with one clear primary button; keep stats and weak table as secondary blocks with more whitespace above the card. *Tradeoff*: slightly more vertical gap before stats for users who only want numbers—acceptable if Start remains discoverable in under 10 seconds.
- **Reduce duplicate titling**: Unify menu vs session title treatment (one product name pattern) to cut cognitive “mode switch” noise. *Tradeoff*: shorter titles may feel less marketing-friendly; prefer clarity.
- **Weaker borders, stronger grouping**: Prefer `--surface` panels and spacing over many **full-width horizontal rules** between sections. *Tradeoff*: less explicit separation; compensate with spacing and one border per group.
- **Optional collapse for weak table**: On narrow viewports, allow **collapsed-by-default** “Where you miss most” with count in summary (power users expand). *Tradeoff*: one extra tap—only if table pushes Start below the fold often.

---

## 2. Goals (measurable / verifiable)

- **Setup scannability**: A first-time or returning user can identify the primary action (start a session) and current filters within **~10 seconds** on laptop and phone without reading every paragraph.
- **Quiz focus**: In active quiz mode, **stem + options** are the clear focal layer; chrome (progress, score, exit) is present but visually subordinate—user can answer without hunting for progress.
- **Orientation**: Users always know **which question index they are on** and **approximate session completion** at a glance (stronger than a 2px bar alone—e.g. text + bar or more visible track).
- **Completion clarity**: Completing the deck produces a **recognizable end state** (even if lightweight): session score recap + explicit next steps (restart with same filters, back to menu, tweak filters)—not an instant dump into the full home scroll.
- **Power users unchanged**: Filters (all / batch / custom), shuffle, weak-only drill, keyboard **A–E**, and localStorage progress behavior remain available and no harder to reach than today.
- **Accessibility**: Focus order remains logical; option groups have appropriate **name/role**; check results are perceivable without color alone (existing correct/wrong styling + text).

---

## 3. Information architecture (states)

| State | Purpose | Notes |
|--------|---------|--------|
| **Loading** | Bank fetch in flight | Current: centered “Loading question bank” + spinner. |
| **Error** | `questions.json` missing or bad | Current: error copy + dev hint. Keep actionable. |
| **Home / setup** | Configure session + review progress | May be **sub-structured** visually into: (a) intro/trust, (b) progress summary, (c) weak spots, (d) session controls + primary CTA—IA can stay one route; presentation should clarify chunks. |
| **Active quiz** | One question at a time | Progress, stem, options, Check / Next, Exit. |
| **Answer revealed** | After Check | Options disabled; feedback + Next or Finish. |
| **End of session** (recommended) | Deck completed | **New or clarified**: short summary (score, length), actions: practice again (same settings), change filters, exit. Differs from “Exit to menu” mid-session if we want two paths—brief allows either a dedicated view or a modal/sheet. |

---

## 4. Visual direction

- **Typography**: Keep `--font-sans` / `--font-mono` from `index.css`. Define a clear **scale**: e.g. app title, section label, body, stem (slightly larger/stronger than body), meta/caption. Avoid duplicating conflicting `h1` rules between `index.css` and `.quiz-app h1` without intent—**one scale** for quiz surfaces.
- **Spacing**: Maintain a **consistent rhythm** (e.g. multiples of `0.25rem` or `0.5rem`) between sections; increase separation between “stats blocks” and “start session” so the CTA block reads as one unit.
- **Color roles**: Preserve existing CSS variables (`--accent`, `--success`, `--error`, `--surface`, etc.). Use **accent** for primary actions and key progress; **tertiary text** for supplementary counts—ensure **contrast** in light and dark (`prefers-color-scheme: dark`) for progress and labels (WCAG-minded).
- **Dark mode**: Continue token-based overrides in `:root` dark block; any new surfaces (cards, sticky bars) must use variables, not hard-coded light grays.
- **Calm / exam-prep**: Softer boundaries (cards or grouped panels with `--surface`), slightly more breathing room in the option list, reduce visual noise in the setup header so the page feels **less cluttered** without removing content.

---

## 5. Component map (suggested; minimal churn preferred)

Optional extractions—**only if** they clarify structure:

| Suggested component | Responsibility |
|---------------------|----------------|
| `QuizLayout` | Shared max-width, padding, optional skip link / landmark wrapper (`main`). |
| `QuizMenu` / `SetupView` | Intro, stats, weak table, filters, Start / Clear. |
| `QuizSession` | Progress region, stem, hint, options, actions, result feedback. |
| `StatSummary` | The four stat tiles + optional alert. |
| `WeakQuestionTable` | Table + “showing N of M” hint. |

**Preference**: Prefer **CSS + small markup refactors** inside `App.tsx` first; split files only when boundaries stabilize.

---

## 6. Accessibility

- **Landmarks**: Wrap primary content in `<main>`; one `h1` per view or ensure heading order is not broken if using subviews.
- **Option group**: `radiogroup` / `group` already used; add **`aria-labelledby`** pointing to stem or a dedicated “Question” heading where appropriate; for multi-select, ensure **group role** + label matches “Select N answers.”
- **Keyboard**: Preserve **A–E** (only when choices exist); ensure **Tab** order: options → Check → Next/Finish → Exit; no keyboard trap in modals if any are introduced.
- **Focus**: Visible focus on custom checkboxes (partially present); all buttons and options need **`:focus-visible`** styles consistent with `--accent-subtle`.
- **Live regions**: After **Check**, consider **`aria-live="polite"`** on the result summary so assistive tech announces correct/incorrect without relying only on color. Optional: `aria-busy` during bank load.
- **Tables**: Weak table: `<th scope="col">` where applicable; caption optional describing sort order.

---

## 7. Out of scope

- Backend, accounts, or sync (progress stays **localStorage** per README).
- New question sources, PDF parser changes, or **JSON schema** changes unless explicitly approved.
- New frameworks (no Tailwind/component library unless project later adopts—**constitution**: Vite + React + CSS).
- Changing scoring logic, weak-question algorithm, or batch preset definitions (unless product asks).
- Internationalization / multiple languages (unless requested).
- Offline/PWA (unless requested).

---

## Handoff

**Coder**: Implement in `quiz-app` per this brief and `swarmforge/constitution.prompt`. Extend `quiz.css` / `index.css` primarily; keep behavioral parity for filters, keyboard, and storage.

**Notify coder** (when swarm is running): `swarmtools/notify-agent.sh coder "Redesign brief is in agent_context/redesign-brief.md — implement in quiz-app per constitution."` — requires `.swarmforge/sessions.tsv` and tmux sessions; otherwise log to `logs/agent_messages.log` manually.
