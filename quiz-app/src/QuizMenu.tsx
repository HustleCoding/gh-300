import { useEffect, useState } from "react";
import { BATCH_PRESETS } from "./types";
import type { Question, QuestionBank } from "./types";
import { summarizeProgress, type WeakRow } from "./progressStorage";

type Summary = ReturnType<typeof summarizeProgress>;

export type RangeMode = "all" | "batch" | "custom";

function useNarrowWeakTableCollapse() {
  const query = "(max-width: 640px)";

  const [narrow, setNarrow] = useState(() =>
    typeof window !== "undefined"
      ? window.matchMedia(query).matches
      : false
  );
  const [weakOpen, setWeakOpen] = useState(() =>
    typeof window !== "undefined"
      ? !window.matchMedia(query).matches
      : true
  );

  useEffect(() => {
    const mq = window.matchMedia(query);
    const sync = () => {
      const n = mq.matches;
      setNarrow(n);
      if (n) setWeakOpen(false);
      else setWeakOpen(true);
    };
    sync();
    mq.addEventListener("change", sync);
    return () => mq.removeEventListener("change", sync);
  }, []);

  return { narrow, weakOpen, setWeakOpen };
}

type QuizMenuProps = {
  bank: QuestionBank;
  summary: Summary | null;
  weakRows: WeakRow[];
  rangeMode: RangeMode;
  customMin: number;
  customMax: number;
  shuffleOn: boolean;
  practiceWeakOnly: boolean;
  filtered: Question[];
  rangeSelectValue: string;
  onRangeSelectChange: (e: React.ChangeEvent<HTMLSelectElement>) => void;
  onCustomMinChange: (n: number) => void;
  onCustomMaxChange: (n: number) => void;
  onShuffleChange: (v: boolean) => void;
  onWeakOnlyChange: (v: boolean) => void;
  onStartQuiz: () => void;
  onClearProgress: () => void;
};

export function QuizMenu({
  bank,
  summary,
  weakRows,
  rangeMode,
  customMin,
  customMax,
  shuffleOn,
  practiceWeakOnly,
  filtered,
  rangeSelectValue,
  onRangeSelectChange,
  onCustomMinChange,
  onCustomMaxChange,
  onShuffleChange,
  onWeakOnlyChange,
  onStartQuiz,
  onClearProgress,
}: QuizMenuProps) {
  const narrowWeakTable = useNarrowWeakTableCollapse();

  return (
    <div className="quiz-shell">
      <a href="#quiz-main" className="quiz-skip">
        Skip to main content
      </a>
      <header className="quiz-header">
        <p className="quiz-eyebrow">
          GH-300 · GitHub Copilot certification
        </p>
        <h1 id="quiz-title" className="quiz-page-title">
          Practice quiz
        </h1>
        <p className="sub">
          {bank.questionCount} questions loaded from the GH-300 PDF source.
          Third-party answers — verify against{" "}
          <a
            href="https://docs.github.com/en/copilot"
            target="_blank"
            rel="noreferrer"
          >
            GitHub Docs
          </a>
          . Progress is saved in this browser (localStorage).
        </p>
      </header>

      <main
        id="quiz-main"
        className="quiz-main quiz-main--setup"
        aria-labelledby="quiz-title"
      >
        {summary && summary.totalAttempts > 0 && (
          <section className="quiz-card quiz-card--secondary" aria-labelledby="stats-heading">
            <h2 id="stats-heading" className="quiz-section-title">
              Your progress
            </h2>
            <div className="stat-row">
              <div className="stat-item">
                <span className="stat-value">{summary.questionsTouched}</span>
                <span className="stat-label">Practiced</span>
              </div>
              <div className="stat-item success">
                <span className="stat-value">{summary.totalCorrect}</span>
                <span className="stat-label">Correct</span>
              </div>
              <div className="stat-item error">
                <span className="stat-value">{summary.totalWrong}</span>
                <span className="stat-label">Missed</span>
              </div>
              <div className="stat-item accent">
                <span className="stat-value">
                  {summary.overallAccuracy != null
                    ? `${(summary.overallAccuracy * 100).toFixed(0)}%`
                    : "—"}
                </span>
                <span className="stat-label">Accuracy</span>
              </div>
            </div>
            {summary.idsWithMistakes > 0 && (
              <div className="alert-box">
                <strong>{summary.idsWithMistakes}</strong> question
                {summary.idsWithMistakes === 1 ? "" : "s"} with at least one
                miss — drill them below or use “Only missed questions”.
              </div>
            )}
          </section>
        )}

        {weakRows.length > 0 && (
          <section
            className="quiz-card quiz-card--secondary"
            aria-labelledby="weak-heading"
          >
            <div className="quiz-weak-head">
              <h2 id="weak-heading" className="quiz-section-title quiz-section-title--inline">
                Where you miss most
              </h2>
              {narrowWeakTable.narrow && (
                <button
                  type="button"
                  className="quiz-btn quiz-btn--compact"
                  aria-expanded={narrowWeakTable.weakOpen}
                  aria-controls="weak-table-panel"
                  onClick={() =>
                    narrowWeakTable.setWeakOpen(!narrowWeakTable.weakOpen)
                  }
                >
                  {narrowWeakTable.weakOpen
                    ? "Hide table"
                    : `Show table (${weakRows.length})`}
                </button>
              )}
            </div>
            <div
              id="weak-table-panel"
              role="region"
              aria-label="Questions you miss most often"
            >
              {narrowWeakTable.narrow && !narrowWeakTable.weakOpen ? (
                <p className="quiz-hint quiz-hint--tight">
                  {weakRows.length} question
                  {weakRows.length === 1 ? "" : "s"} with misses — expand to
                  review details.
                </p>
              ) : (
                <>
                  <p className="quiz-hint quiz-hint--tight">
                    Sorted by lowest accuracy (then most misses). Question IDs
                    from the bank.
                  </p>
                  <div className="progress-table-wrap">
                    <table className="progress-table">
                      <caption className="quiz-visually-hidden">
                        Questions you miss most often, sorted by lowest
                        accuracy then most misses
                      </caption>
                      <thead>
                        <tr>
                          <th scope="col">Q#</th>
                          <th scope="col">Attempts</th>
                          <th scope="col">Misses</th>
                          <th scope="col">Accuracy</th>
                        </tr>
                      </thead>
                      <tbody>
                        {weakRows.slice(0, 25).map((row) => (
                          <tr key={row.id}>
                            <td>{row.id}</td>
                            <td>{row.attempts}</td>
                            <td>{row.wrong}</td>
                            <td>
                              {row.accuracy != null
                                ? `${(row.accuracy * 100).toFixed(0)}%`
                                : "—"}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  {weakRows.length > 25 && (
                    <p className="quiz-hint">
                      Showing 25 of {weakRows.length} questions with misses.
                    </p>
                  )}
                </>
              )}
            </div>
          </section>
        )}

        <section
          className="quiz-card quiz-setup quiz-card--cta"
          aria-labelledby="session-heading"
        >
          <h2 id="session-heading" className="quiz-section-title">
            Start session
          </h2>
          <div className="quiz-row">
            <label className="inline">
              <input
                type="checkbox"
                checked={shuffleOn}
                onChange={(e) => onShuffleChange(e.target.checked)}
              />
              Shuffle order
            </label>
            <label className="inline">
              <input
                type="checkbox"
                checked={practiceWeakOnly}
                onChange={(e) => onWeakOnlyChange(e.target.checked)}
                disabled={weakRows.length === 0}
              />
              Only questions I’ve missed before ({weakRows.length} in bank
              range)
            </label>
          </div>

          <label htmlFor="question-set">Question set</label>
          <select
            id="question-set"
            value={rangeSelectValue}
            onChange={onRangeSelectChange}
          >
            <option value="all">All parsed questions</option>
            {BATCH_PRESETS.map((b, i) => (
              <option key={b.label} value={`batch:${i}`}>
                {b.label}
              </option>
            ))}
            <option value="custom">Custom question ID range</option>
          </select>

          {rangeMode === "custom" && (
            <div className="quiz-row">
              <div>
                <label htmlFor="custom-min">Min ID</label>
                <input
                  id="custom-min"
                  type="number"
                  min={1}
                  max={999}
                  value={customMin}
                  onChange={(e) =>
                    onCustomMinChange(Number(e.target.value) || 1)
                  }
                />
              </div>
              <div>
                <label htmlFor="custom-max">Max ID</label>
                <input
                  id="custom-max"
                  type="number"
                  min={1}
                  max={999}
                  value={customMax}
                  onChange={(e) =>
                    onCustomMaxChange(Number(e.target.value) || 148)
                  }
                />
              </div>
            </div>
          )}

          <p className="quiz-hint">
            This session will include <strong>{filtered.length}</strong> question
            {filtered.length === 1 ? "" : "s"}.
            {practiceWeakOnly && filtered.length === 0 && (
              <span className="quiz-error-inline">
                {" "}
                No missed questions in this range — turn off the filter or
                practice more.
              </span>
            )}
          </p>

          <div className="quiz-actions">
            <button
              type="button"
              className="quiz-btn primary"
              disabled={filtered.length === 0}
              onClick={onStartQuiz}
            >
              Start quiz
            </button>
            {summary && summary.totalAttempts > 0 && (
              <button
                type="button"
                className="quiz-btn danger"
                onClick={onClearProgress}
              >
                Clear saved stats
              </button>
            )}
          </div>
        </section>
      </main>
    </div>
  );
}
