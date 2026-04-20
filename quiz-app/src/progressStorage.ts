/** Per-question history persisted in localStorage */

export const STORAGE_KEY = "gh300-quiz-progress-v1";

export type QuestionStats = {
  attempts: number;
  correct: number;
  wrong: number;
  lastAttemptAt: string;
};

export type ProgressStore = {
  v: 1;
  byId: Record<string, QuestionStats>;
};

export function emptyStore(): ProgressStore {
  return { v: 1, byId: {} };
}

export function loadProgress(): ProgressStore {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return emptyStore();
    const parsed = JSON.parse(raw) as ProgressStore;
    if (parsed?.v !== 1 || typeof parsed.byId !== "object" || !parsed.byId)
      return emptyStore();
    return parsed;
  } catch {
    return emptyStore();
  }
}

export function saveProgress(store: ProgressStore): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(store));
  } catch {
    /* quota / private mode */
  }
}

/** Call once when the user checks an answer (correct or not). */
export function recordAttempt(
  store: ProgressStore,
  questionId: number,
  isCorrect: boolean
): ProgressStore {
  const key = String(questionId);
  const prev = store.byId[key] ?? {
    attempts: 0,
    correct: 0,
    wrong: 0,
    lastAttemptAt: "",
  };
  const next: QuestionStats = {
    attempts: prev.attempts + 1,
    correct: prev.correct + (isCorrect ? 1 : 0),
    wrong: prev.wrong + (isCorrect ? 0 : 1),
    lastAttemptAt: new Date().toISOString(),
  };
  const byId = { ...store.byId, [key]: next };
  const out = { ...store, byId };
  saveProgress(out);
  return out;
}

export function getStatsForId(
  store: ProgressStore,
  questionId: number
): QuestionStats | undefined {
  return store.byId[String(questionId)];
}

export type WeakRow = {
  id: number;
  attempts: number;
  correct: number;
  wrong: number;
  accuracy: number | null;
  lastAttemptAt: string;
};

/** Questions with at least one wrong attempt, sorted by worst accuracy then most wrongs */
export function getWeakQuestions(
  store: ProgressStore,
  allIds: number[]
): WeakRow[] {
  const rows: WeakRow[] = [];
  for (const id of allIds) {
    const s = store.byId[String(id)];
    if (!s || s.wrong === 0) continue;
    rows.push({
      id,
      attempts: s.attempts,
      correct: s.correct,
      wrong: s.wrong,
      accuracy: s.attempts > 0 ? s.correct / s.attempts : null,
      lastAttemptAt: s.lastAttemptAt,
    });
  }
  rows.sort((a, b) => {
    const ac = a.accuracy ?? 1;
    const bc = b.accuracy ?? 1;
    if (ac !== bc) return ac - bc;
    return b.wrong - a.wrong;
  });
  return rows;
}

export function summarizeProgress(store: ProgressStore): {
  questionsTouched: number;
  totalAttempts: number;
  totalCorrect: number;
  totalWrong: number;
  overallAccuracy: number | null;
  idsWithMistakes: number;
} {
  let questionsTouched = 0;
  let totalAttempts = 0;
  let totalCorrect = 0;
  let totalWrong = 0;
  let idsWithMistakes = 0;
  for (const s of Object.values(store.byId)) {
    if (s.attempts === 0) continue;
    questionsTouched++;
    totalAttempts += s.attempts;
    totalCorrect += s.correct;
    totalWrong += s.wrong;
    if (s.wrong > 0) idsWithMistakes++;
  }
  return {
    questionsTouched,
    totalAttempts,
    totalCorrect,
    totalWrong,
    overallAccuracy:
      totalAttempts > 0 ? totalCorrect / totalAttempts : null,
    idsWithMistakes,
  };
}

export function clearProgress(): void {
  localStorage.removeItem(STORAGE_KEY);
}
