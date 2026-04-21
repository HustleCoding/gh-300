import type { Question } from "./types";
import type { QuestionStats } from "./progressStorage";

type QuizSessionProps = {
  deck: Question[];
  idx: number;
  q: Question;
  selected: Set<string>;
  correctCount: number;
  progressPct: number;
  completed: number;
  answered: boolean;
  sessionStats: QuestionStats | undefined;
  isMulti: boolean;
  showResult: boolean;
  onToggle: (key: string) => void;
  onCheck: () => void;
  onNext: () => void;
  onExit: () => void;
};

export function QuizSession({
  deck,
  idx,
  q,
  selected,
  correctCount,
  progressPct,
  completed,
  answered,
  sessionStats,
  isMulti,
  showResult,
  onToggle,
  onCheck,
  onNext,
  onExit,
}: QuizSessionProps) {
  const groupRole = isMulti ? "group" : "radiogroup";

  const progressNow = Math.min(100, Math.max(0, Math.round(progressPct)));

  return (
    <div className="quiz-shell quiz-shell--session">
      <header className="quiz-session-top">
        <a href="#session-quiz-main" className="quiz-skip">
          Skip to question
        </a>
        <p className="quiz-eyebrow quiz-eyebrow--session quiz-eyebrow--align">
          GH-300 · GitHub Copilot certification
        </p>
        <div
          className="quiz-progress-bar"
          role="progressbar"
          aria-valuenow={progressNow}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-label={`${completed} of ${deck.length} questions completed in this session`}
        >
          <div
            className="quiz-progress-fill"
            style={{ width: `${progressPct}%` }}
          />
        </div>
        <div className="quiz-session-toolbar" role="group" aria-label="Session progress">
          <h1 id="session-title" className="quiz-session-toolbar__title">
            Question {idx + 1} of {deck.length}
            <span className="quiz-session-toolbar__meta"> · Q-ID {q.id}</span>
          </h1>
          <p className="quiz-session-toolbar__score">
            Score{" "}
            <span className="quiz-session-toolbar__score-value">
              {completed > 0 ? `${correctCount} / ${completed}` : "—"}
            </span>
          </p>
        </div>
      </header>

      <main
        id="session-quiz-main"
        className="quiz-main quiz-main--session"
        aria-labelledby="session-title"
      >
        {sessionStats && sessionStats.attempts > 0 && (
          <div className="quiz-history quiz-history--inline">
            Your history on Q{q.id}:{" "}
            <strong>{sessionStats.correct}</strong> / {sessionStats.attempts}{" "}
            correct · <strong>{sessionStats.wrong}</strong> missed
          </div>
        )}

        <p className="quiz-stem" id={`stem-${q.id}`}>
          {q.stem}
        </p>
        <p className="quiz-hint" id={`hint-${q.id}`}>
          {isMulti
            ? `Select ${q.selectCount} answers.`
            : "Select one answer."}{" "}
          Keyboard: A–E.
        </p>

        <div
          className="quiz-options"
          role={groupRole}
          aria-labelledby={`stem-${q.id} hint-${q.id}`}
        >
          {q.choiceOrder.map((key) => {
            const text = q.choices[key] ?? "";
            const isSel = selected.has(key);
            const isCorrect = q.answers.includes(key);
            let cls = "quiz-option";
            if (isSel) cls += " selected";
            if (showResult) {
              if (isCorrect) cls += " correct";
              else if (isSel) cls += " wrong";
            }
            return (
              <button
                key={key}
                type="button"
                className={cls}
                disabled={showResult}
                onClick={() => onToggle(key)}
                aria-pressed={isSel}
              >
                <span className="key" aria-hidden="true">
                  {key}
                </span>
                <span>{text}</span>
              </button>
            );
          })}
        </div>

        <div className="quiz-actions">
          {!showResult ? (
            <button
              type="button"
              className="quiz-btn primary"
              disabled={selected.size !== q.selectCount}
              onClick={onCheck}
            >
              Check answer
            </button>
          ) : (
            <button type="button" className="quiz-btn primary" onClick={onNext}>
              {idx >= deck.length - 1 ? "Finish" : "Next question"}
            </button>
          )}
          <button type="button" className="quiz-btn" onClick={onExit}>
            Exit to menu
          </button>
        </div>

        {showResult && (
          <div
            className="quiz-meta"
            role="status"
            aria-live="polite"
            aria-atomic="true"
          >
            {answered ? (
              <p>Correct.</p>
            ) : (
              <p>
                Incorrect. Correct: {[...q.answers].sort().join(", ")}.
              </p>
            )}
          </div>
        )}
      </main>
    </div>
  );
}
