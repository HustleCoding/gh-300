type QuizSessionCompleteProps = {
  correctCount: number;
  totalQuestions: number;
  onPracticeAgain: () => void;
  onBackToSetup: () => void;
};

export function QuizSessionComplete({
  correctCount,
  totalQuestions,
  onPracticeAgain,
  onBackToSetup,
}: QuizSessionCompleteProps) {
  const pct =
    totalQuestions > 0
      ? Math.round((correctCount / totalQuestions) * 100)
      : 0;

  return (
    <div className="quiz-shell">
      <a href="#session-complete-main" className="quiz-skip">
        Skip to summary
      </a>
      <header className="quiz-header">
        <p className="quiz-eyebrow">
          GH-300 · GitHub Copilot certification
        </p>
        <h1 id="session-complete-title" className="quiz-page-title">
          Session complete
        </h1>
        <p className="sub">
          <strong>Deck finished.</strong> Practice again with the same filters,
          or return to setup to change the question set.
        </p>
      </header>

      <main
        id="session-complete-main"
        className="quiz-main"
        aria-labelledby="session-complete-title"
      >
        <section
          className="quiz-card quiz-card--summary"
          aria-labelledby="summary-stats-heading"
        >
          <h2 id="summary-stats-heading" className="quiz-section-title">
            This session
          </h2>
          <p className="quiz-summary-score" aria-live="polite">
            <span className="quiz-summary-score__value">
              {correctCount} / {totalQuestions}
            </span>
            <span className="quiz-summary-score__label">correct</span>
            <span className="quiz-summary-score__meta">({pct}%)</span>
          </p>
        </section>

        <div className="quiz-actions quiz-actions--complete">
          <button
            type="button"
            className="quiz-btn primary"
            onClick={onPracticeAgain}
          >
            Practice again (same filters)
          </button>
          <button
            type="button"
            className="quiz-btn"
            onClick={onBackToSetup}
          >
            Back to setup
          </button>
        </div>
      </main>
    </div>
  );
}
