import { useCallback, useEffect, useMemo, useState } from "react";
import "./quiz.css";
import type { Question, QuestionBank } from "./types";
import { BATCH_PRESETS } from "./types";
import {
  emptyStore,
  getStatsForId,
  getWeakQuestions,
  loadProgress,
  recordAttempt,
  summarizeProgress,
  clearProgress,
  type ProgressStore,
} from "./progressStorage";

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function sameSet(a: Set<string>, b: Set<string>): boolean {
  if (a.size !== b.size) return false;
  for (const x of a) if (!b.has(x)) return false;
  return true;
}

type RangeMode = "all" | "batch" | "custom";

export default function App() {
  const [bank, setBank] = useState<QuestionBank | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [started, setStarted] = useState(false);
  const [deck, setDeck] = useState<Question[]>([]);
  const [idx, setIdx] = useState(0);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [checked, setChecked] = useState(false);
  const [correctCount, setCorrectCount] = useState(0);
  const [rangeMode, setRangeMode] = useState<RangeMode>("all");
  const [batchIdx, setBatchIdx] = useState(0);
  const [customMin, setCustomMin] = useState(1);
  const [customMax, setCustomMax] = useState(148);
  const [shuffleOn, setShuffleOn] = useState(false);
  const [practiceWeakOnly, setPracticeWeakOnly] = useState(false);
  const [progress, setProgress] = useState<ProgressStore>(() => {
    if (typeof window === "undefined") return emptyStore();
    return loadProgress();
  });

  useEffect(() => {
    fetch("/questions.json")
      .then((r) => {
        if (!r.ok) throw new Error(`Failed to load questions (${r.status})`);
        return r.json();
      })
      .then((data: QuestionBank) => setBank(data))
      .catch((e: unknown) =>
        setLoadError(e instanceof Error ? e.message : String(e))
      );
  }, []);

  const q = deck[idx];

  const buildFilteredList = useCallback((): Question[] => {
    if (!bank) return [];
    let list = [...bank.questions];
    if (rangeMode === "batch") {
      const b = BATCH_PRESETS[batchIdx];
      list = list.filter((x) => x.id >= b.min && x.id <= b.max);
    } else if (rangeMode === "custom") {
      const lo = Math.min(customMin, customMax);
      const hi = Math.max(customMin, customMax);
      list = list.filter((x) => x.id >= lo && x.id <= hi);
    }
    if (practiceWeakOnly) {
      list = list.filter((x) => (getStatsForId(progress, x.id)?.wrong ?? 0) > 0);
    }
    return list;
  }, [
    bank,
    rangeMode,
    batchIdx,
    customMin,
    customMax,
    practiceWeakOnly,
    progress,
  ]);

  const summary = useMemo(
    () => (bank ? summarizeProgress(progress) : null),
    [bank, progress]
  );

  const weakRows = useMemo(() => {
    if (!bank) return [];
    return getWeakQuestions(
      progress,
      bank.questions.map((x) => x.id)
    );
  }, [bank, progress]);

  const startQuiz = () => {
    let list = buildFilteredList();
    if (list.length === 0) return;
    if (shuffleOn) list = shuffle(list);
    setDeck(list);
    setIdx(0);
    setSelected(new Set());
    setChecked(false);
    setCorrectCount(0);
    setStarted(true);
  };

  const exitQuiz = () => {
    setStarted(false);
  };

  const toggle = useCallback(
    (key: string) => {
      if (checked || !q) return;
      setSelected((prev) => {
        const next = new Set(prev);
        if (q.selectCount <= 1) {
          next.clear();
          next.add(key);
          return next;
        }
        if (next.has(key)) {
          next.delete(key);
          return next;
        }
        if (next.size >= q.selectCount) return prev;
        next.add(key);
        return next;
      });
    },
    [checked, q]
  );

  const doCheck = () => {
    if (!q) return;
    const ans = new Set(q.answers);
    const ok = sameSet(selected, ans);
    if (ok) setCorrectCount((c) => c + 1);
    setProgress((prev) => recordAttempt(prev, q.id, ok));
    setChecked(true);
  };

  const nextQ = () => {
    if (idx >= deck.length - 1) {
      setStarted(false);
      return;
    }
    setIdx((i) => i + 1);
    setSelected(new Set());
    setChecked(false);
  };

  useEffect(() => {
    if (!started || !q || checked) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.ctrlKey || e.metaKey || e.altKey) return;
      const m = e.key.toLowerCase().match(/^([a-e])$/);
      if (!m) return;
      const letter = m[1]!.toUpperCase();
      if (!q.choiceOrder.includes(letter)) return;
      e.preventDefault();
      toggle(letter);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [started, q, checked, idx, toggle]);

  const completed = q != null ? idx + (checked ? 1 : 0) : 0;
  const answered =
    q != null && sameSet(selected, new Set(q.answers));

  const sessionStats = q ? getStatsForId(progress, q.id) : undefined;

  if (loadError) {
    return (
      <div className="quiz-app">
        <p className="quiz-error">
          Could not load <code>public/questions.json</code>: {loadError}
        </p>
        <p className="sub">
          Run <code>npm run generate-questions</code> in <code>quiz-app</code>{" "}
          after placing <code>GH-300.pdf</code> in the repo root.
        </p>
      </div>
    );
  }

  if (!bank) {
    return (
      <div className="quiz-app">
        <p className="sub">Loading question bank…</p>
      </div>
    );
  }

  if (!started) {
    const filtered = buildFilteredList();
    const rangeSelectValue =
      rangeMode === "all"
        ? "all"
        : rangeMode === "custom"
          ? "custom"
          : `batch:${batchIdx}`;
    return (
      <div className="quiz-app">
        <h1>GH-300 practice quiz</h1>
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

        {summary && summary.totalAttempts > 0 && (
          <div className="quiz-card progress-summary">
            <h2 className="progress-heading">Your progress</h2>
            <ul className="progress-stats">
              <li>
                <strong>{summary.questionsTouched}</strong> question
                {summary.questionsTouched === 1 ? "" : "s"} practiced
              </li>
              <li>
                <strong>{summary.totalAttempts}</strong> checks ·{" "}
                <strong>{summary.totalCorrect}</strong> correct ·{" "}
                <strong>{summary.totalWrong}</strong> missed
              </li>
              {summary.overallAccuracy != null && (
                <li>
                  Overall accuracy:{" "}
                  <strong>{(summary.overallAccuracy * 100).toFixed(1)}%</strong>
                </li>
              )}
              {summary.idsWithMistakes > 0 && (
                <li className="progress-alert">
                  <strong>{summary.idsWithMistakes}</strong> question
                  {summary.idsWithMistakes === 1 ? "" : "s"} with at least one
                  miss — drill them below or use “Only missed questions”.
                </li>
              )}
            </ul>
          </div>
        )}

        {weakRows.length > 0 && (
          <div className="quiz-card progress-weak">
            <h2 className="progress-heading">Where you miss most</h2>
            <p className="quiz-hint">
              Sorted by lowest accuracy (then most misses). Question IDs from
              the bank.
            </p>
            <div className="progress-table-wrap">
              <table className="progress-table">
                <thead>
                  <tr>
                    <th>Q#</th>
                    <th>Attempts</th>
                    <th>Misses</th>
                    <th>Accuracy</th>
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
          </div>
        )}

        <div className="quiz-card quiz-setup">
          <h2 className="progress-heading">Start session</h2>
          <div className="quiz-row">
            <label className="inline">
              <input
                type="checkbox"
                checked={shuffleOn}
                onChange={(e) => setShuffleOn(e.target.checked)}
              />
              Shuffle order
            </label>
            <label className="inline">
              <input
                type="checkbox"
                checked={practiceWeakOnly}
                onChange={(e) => setPracticeWeakOnly(e.target.checked)}
                disabled={weakRows.length === 0}
              />
              Only questions I’ve missed before ({weakRows.length} in bank
              range)
            </label>
          </div>

          <label>Question set</label>
          <select
            value={rangeSelectValue}
            onChange={(e) => {
              const v = e.target.value;
              if (v === "all") setRangeMode("all");
              else if (v === "custom") setRangeMode("custom");
              else {
                setRangeMode("batch");
                setBatchIdx(Number(v.replace("batch:", "")));
              }
            }}
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
                <label>Min ID</label>
                <input
                  type="number"
                  min={1}
                  max={999}
                  value={customMin}
                  onChange={(e) =>
                    setCustomMin(Number(e.target.value) || 1)
                  }
                />
              </div>
              <div>
                <label>Max ID</label>
                <input
                  type="number"
                  min={1}
                  max={999}
                  value={customMax}
                  onChange={(e) =>
                    setCustomMax(Number(e.target.value) || 148)
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
              onClick={startQuiz}
            >
              Start quiz
            </button>
            {summary && summary.totalAttempts > 0 && (
              <button
                type="button"
                className="quiz-btn danger"
                onClick={() => {
                  if (
                    confirm(
                      "Clear all saved progress for this browser? This cannot be undone."
                    )
                  ) {
                    clearProgress();
                    setProgress(emptyStore());
                  }
                }}
              >
                Clear saved stats
              </button>
            )}
          </div>
        </div>
      </div>
    );
  }

  if (!q) return null;

  const showResult = checked;
  const isMulti = q.selectCount > 1;

  return (
    <div className="quiz-app">
      <h1>GH-300 practice</h1>
      <div className="quiz-progress">
        <span>
          Question {idx + 1} of {deck.length} · Q-ID {q.id}
        </span>
        <span>
          Session score{" "}
          {completed > 0 ? `${correctCount} / ${completed}` : "—"}
        </span>
      </div>
      {sessionStats && sessionStats.attempts > 0 && (
        <p className="quiz-history">
          Your history on Q{q.id}:{" "}
          <strong>{sessionStats.correct}</strong> / {sessionStats.attempts}{" "}
          correct · <strong>{sessionStats.wrong}</strong> missed (all visits)
        </p>
      )}
      <p className="quiz-stem">{q.stem}</p>
      <p className="quiz-hint">
        {isMulti
          ? `Select ${q.selectCount} answers.`
          : "Select one answer."}{" "}
        Keyboard: A–E.
      </p>

      <div className="quiz-options" role={isMulti ? "group" : "radiogroup"}>
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
              onClick={() => toggle(key)}
              aria-pressed={isSel}
            >
              <span className="key">{key}</span>
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
            onClick={doCheck}
          >
            Check answer
          </button>
        ) : (
          <button type="button" className="quiz-btn primary" onClick={nextQ}>
            {idx >= deck.length - 1 ? "Finish" : "Next question"}
          </button>
        )}
        <button type="button" className="quiz-btn" onClick={exitQuiz}>
          Exit to menu
        </button>
      </div>

      {showResult && (
        <div className="quiz-meta">
          {answered ? (
            <p>Correct.</p>
          ) : (
            <p>
              Incorrect. Correct: {[...q.answers].sort().join(", ")}.
            </p>
          )}
        </div>
      )}
    </div>
  );
}
