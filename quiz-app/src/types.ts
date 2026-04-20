export interface Question {
  id: number;
  stem: string;
  choices: Record<string, string>;
  choiceOrder: string[];
  answers: string[];
  selectCount: number;
}

export interface QuestionBank {
  source: string;
  generated: string;
  questionCount: number;
  parseWarnings: { id: number; msg: string }[];
  questions: Question[];
}

export const BATCH_PRESETS: { label: string; min: number; max: number }[] = [
  { label: "Batch 1 — Q1–25", min: 1, max: 25 },
  { label: "Batch 2 — Q26–50", min: 26, max: 50 },
  { label: "Batch 3 — Q51–75", min: 51, max: 75 },
  { label: "Batch 4 — Q76–100", min: 76, max: 100 },
  { label: "Batch 5 — Q101–125", min: 101, max: 125 },
  { label: "Batch 6 — Q126–148", min: 126, max: 148 },
];
