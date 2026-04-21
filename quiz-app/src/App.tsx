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
import { QuizMenu, type RangeMode } from "./QuizMenu";
import { QuizSession } from "./QuizSession";
import { QuizSessionComplete } from "./QuizSessionComplete";

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
  const [sessionSummary, setSessionSummary] = useState<{
    correctCount: number;
    total: number;
  } | null>(null);
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
    setSessionSummary(null);
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
    setSessionSummary(null);
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
      setSessionSummary({ correctCount, total: deck.length });
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

  const filtered = bank ? buildFilteredList() : [];
  const rangeSelectValue =
    rangeMode === "all"
      ? "all"
      : rangeMode === "custom"
        ? "custom"
        : `batch:${batchIdx}`;

  const onRangeSelectChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const v = e.target.value;
    if (v === "all") setRangeMode("all");
    else if (v === "custom") setRangeMode("custom");
    else {
      setRangeMode("batch");
      setBatchIdx(Number(v.replace("batch:", "")));
    }
  };

  if (loadError) {
    return (
      <div className="quiz-app">
        <main className="quiz-main quiz-main--bare">
          <p className="quiz-error">
            Could not load <code>public/questions.json</code>: {loadError}
          </p>
          <p className="sub">
            Run <code>npm run generate-questions</code> in <code>quiz-app</code>{" "}
            after placing <code>GH-300.pdf</code> in the repo root.
          </p>
        </main>
      </div>
    );
  }

  if (!bank) {
    return (
      <div className="quiz-app">
        <main className="quiz-main quiz-main--bare" aria-busy="true">
          <p className="quiz-loading">Loading question bank</p>
        </main>
      </div>
    );
  }

  if (sessionSummary) {
    return (
      <div className="quiz-app">
        <QuizSessionComplete
          correctCount={sessionSummary.correctCount}
          totalQuestions={sessionSummary.total}
          onPracticeAgain={startQuiz}
          onBackToSetup={() => setSessionSummary(null)}
        />
      </div>
    );
  }

  if (!started) {
    return (
      <div className="quiz-app">
        <QuizMenu
          bank={bank}
          summary={summary}
          weakRows={weakRows}
          rangeMode={rangeMode}
          customMin={customMin}
          customMax={customMax}
          shuffleOn={shuffleOn}
          practiceWeakOnly={practiceWeakOnly}
          filtered={filtered}
          rangeSelectValue={rangeSelectValue}
          onRangeSelectChange={onRangeSelectChange}
          onCustomMinChange={setCustomMin}
          onCustomMaxChange={setCustomMax}
          onShuffleChange={setShuffleOn}
          onWeakOnlyChange={setPracticeWeakOnly}
          onStartQuiz={startQuiz}
          onClearProgress={() => {
            if (
              confirm(
                "Clear all saved progress for this browser? This cannot be undone."
              )
            ) {
              clearProgress();
              setProgress(emptyStore());
            }
          }}
        />
      </div>
    );
  }

  if (!q) return null;

  const showResult = checked;
  const isMulti = q.selectCount > 1;
  const progressPct = deck.length > 0 ? ((idx + (checked ? 1 : 0)) / deck.length) * 100 : 0;

  return (
    <div className="quiz-app">
      <QuizSession
        deck={deck}
        idx={idx}
        q={q}
        selected={selected}
        correctCount={correctCount}
        progressPct={progressPct}
        completed={completed}
        answered={answered}
        sessionStats={sessionStats}
        isMulti={isMulti}
        showResult={showResult}
        onToggle={toggle}
        onCheck={doCheck}
        onNext={nextQ}
        onExit={exitQuiz}
      />
    </div>
  );
}
