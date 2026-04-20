/**
 * Extract GH-300.pdf to public/questions.json
 * Run from quiz-app: node scripts/parse-gh300-pdf.mjs
 */
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { PDFParse } from "pdf-parse";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const pdfPath = path.resolve(__dirname, "../../GH-300.pdf");
const outPath = path.resolve(__dirname, "../public/questions.json");

const raw = await fs.promises.readFile(pdfPath);
const parser = new PDFParse({ data: raw });
const { text } = await parser.getText();
await parser.destroy?.();
let lines = text
  .split(/\r?\n/)
  .map((l) => l.trim())
  .filter((l) => !isNoiseLine(l));

const STEM_OVERRIDES = new Map([
  [
    11,
    "What kind of insights can the GitHub Copilot usage metrics API provide to help evaluate the effectiveness of GitHub Copilot? (Each correct answer presents part of the solution. Choose two.)",
  ],
]);

function isNoiseLine(line) {
  const t = line.trim();
  return (
    t === "" ||
    /^https?:\/\//i.test(t) ||
    /^--\s*\d+\s+of\s+\d+\s--$/i.test(t) ||
    /^blog\.yatricloud\.com$/i.test(t) ||
    /^shapingpixel\.com$/i.test(t) ||
    /^\d+\.$/.test(t)
  );
}

/**
 * Some PDF pages list A–D options *before* the "N) stem" line (e.g. Q39).
 * Reorder to stem → A → B → C → D when we detect that pattern.
 */
function reorderOrphanOptionsBeforeStem(lines) {
  const out = [];
  let i = 0;
  while (i < lines.length) {
    if (i + 4 < lines.length) {
      const recentLinesContainQuestion = lines
        .slice(Math.max(0, i - 3), i)
        .some((line) => isNewQuestionLine(line));
      const pack = lines.slice(i, i + 5);
      const keys = pack.slice(0, 4).map((l) => optionLetter(l));
      const q = matchQuestionLine(pack[4]);
      const answerImmediatelyAfterStem = normalizeAnswerLine(lines[i + 5] ?? "");
      if (
        (!recentLinesContainQuestion || answerImmediatelyAfterStem) &&
        keys[0] === "A" &&
        keys[1] === "B" &&
        keys[2] === "C" &&
        keys[3] === "D" &&
        q &&
        pack.slice(0, 4).every((l) => isOptionLine(l))
      ) {
        out.push(pack[4], pack[0], pack[1], pack[2], pack[3]);
        i += 5;
        continue;
      }
    }
    out.push(lines[i]);
    i++;
  }
  return out;
}

function optionLetter(line) {
  const t = line.trim();
  const m = t.match(/^([A-E])\./);
  return m ? m[1] : null;
}

/** Matches "A. …", "A.By …", "A./tests …" */
function isOptionLine(line) {
  return /^[A-E]\./.test(line.trim());
}

lines = reorderOrphanOptionsBeforeStem(lines);

function normalizeAnswerLine(line) {
  const t = line.trim();
  const patterns = [
    /^Correct\s+Answers?\s*:\s*(.+)$/i,
    /^Answer\s*\(s\)\s*:\s*(.+)$/i,
    /^Answer\s*:\s*(.+)$/i,
  ];
  for (const p of patterns) {
    const m = t.match(p);
    if (m) return m[1].trim();
  }
  return null;
}

function parseAnswerTokens(s) {
  const prep = s
    .trim()
    .replace(/\s+and\s+/gi, ",")
    .replace(/\s*&\s*/g, ",");
  return prep
    .replace(/\s+/g, "")
    .split(/[,;]+/)
    .filter(Boolean)
    .flatMap((t) => {
      if (/^[A-E]{2,}$/.test(t)) return [...t];
      return [t];
    })
    .map((x) => x.toUpperCase())
    .filter((x) => /^[A-E]$/.test(x));
}

/** First line of option: capture text after "A." (space optional) */
function parseOptionFirstLine(line) {
  const m = line.trim().match(/^([A-E])\.\s*(.*)$/s);
  if (!m) return null;
  let body = (m[2] ?? "").trim();
  // Typo "B. B. ghce" in PDF Q144
  body = body.replace(/^([A-E])\.\s+/, "").trim();
  return { key: m[1], body };
}

const questions = new Map();

/** PDF uses "12) question", "148). question", "145). question" */
function matchQuestionLine(line) {
  return line.match(/^(\d+)\)\s*\.?\s*(.*)$/);
}

function isNewQuestionLine(line) {
  return matchQuestionLine(line) != null;
}

let i = 0;
while (i < lines.length) {
  const line = lines[i];
  const qm = matchQuestionLine(line);
  if (!qm) {
    i++;
    continue;
  }
  const id = Number(qm[1], 10);
  const firstLine = (qm[2] ?? "").replace(/^\.\s+/, "").trim();
  i++;

  const stemLines = [firstLine];
  while (i < lines.length && !isOptionLine(lines[i])) {
    if (!isNoiseLine(lines[i])) stemLines.push(lines[i]);
    i++;
  }

  /** @type {Record<string, string>} */
  const choices = {};
  const order = [];
  while (i < lines.length && isOptionLine(lines[i])) {
    const parsed = parseOptionFirstLine(lines[i]);
    if (!parsed) break;
    const key = parsed.key;
    let body = parsed.body;
    i++;
    while (
      i < lines.length &&
      !isOptionLine(lines[i]) &&
      !normalizeAnswerLine(lines[i]) &&
      !isNewQuestionLine(lines[i])
    ) {
      if (isNoiseLine(lines[i])) {
        i++;
        continue;
      }
      body += " " + lines[i].trim();
      i++;
    }
    if (!Object.hasOwn(choices, key)) {
      choices[key] = body.trim();
      order.push(key);
    }
  }

  let answers = [];
  while (i < lines.length) {
    const ans = normalizeAnswerLine(lines[i]);
    if (ans) {
      answers = parseAnswerTokens(ans);
      i++;
      break;
    }
    if (isNewQuestionLine(lines[i])) break;
    i++;
  }

  const stem = (
    STEM_OVERRIDES.get(id) ?? stemLines.join(" ").replace(/\s+/g, " ").trim()
  );

  if (!order.length || !answers.length) {
    continue;
  }

  const selectCount = answers.length;

  const existing = questions.get(id);
  if (!existing || existing.answers.length === 0) {
    questions.set(id, {
      id,
      stem,
      choices,
      choiceOrder: order,
      answers,
      selectCount,
    });
  } else if (answers.length > 0) {
    questions.set(id, {
      ...existing,
      stem: stem.length >= (existing.stem?.length ?? 0) ? stem : existing.stem,
      choices:
        Object.keys(choices).length >= Object.keys(existing.choices).length
          ? choices
          : existing.choices,
      choiceOrder:
        order.length >= existing.choiceOrder.length ? order : existing.choiceOrder,
      answers,
      selectCount,
    });
  }
}

const list = [...questions.values()].sort((a, b) => a.id - b.id);

const issues = [];
for (const q of list) {
  const bad = q.answers.filter((a) => !q.choices[a]);
  if (bad.length)
    issues.push({ id: q.id, msg: `unknown choice keys ${bad.join(",")}` });
}

await fs.promises.mkdir(path.dirname(outPath), { recursive: true });
await fs.promises.writeFile(
  outPath,
  JSON.stringify(
    {
      source: "GH-300.pdf",
      generated: new Date().toISOString(),
      questionCount: list.length,
      parseWarnings: issues.slice(0, 50),
      questions: list,
    },
    null,
    2
  )
);

const ids = new Set(list.map((q) => q.id));
const missing = [];
for (let n = 1; n <= 148; n++) if (!ids.has(n)) missing.push(n);

console.log(
  JSON.stringify(
    {
      out: outPath,
      questionCount: list.length,
      expected: 148,
      missingIds: missing,
      warnings: issues.length,
    },
    null,
    2
  )
);
