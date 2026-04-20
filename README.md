# gh-300 — Copilot cert prep

Includes **`quiz-app/`**: a Vite + React practice quiz for the GH-300 question bank (`public/questions.json`, generated from `GH-300.pdf`).

## Deploy to Vercel

1. Push this repository to GitHub (or GitLab / Bitbucket).

2. In [Vercel](https://vercel.com), choose **Add New… → Project** and import the repo.

3. Leave **Root Directory** as the repository root (this repo includes `vercel.json` so Vercel builds `quiz-app/` automatically). If Vercel asks for a framework, **Vite** is correct.

4. Deploy. Your app will be live at `https://<project>.vercel.app`.

Regenerate the question file after PDF changes (from `quiz-app/`):

```bash
npm run generate-questions
```

Commit `quiz-app/public/questions.json` so production always has data without running the parser on Vercel.

## Local dev

```bash
cd quiz-app && npm install && npm run dev
```

## Note on progress

Quiz stats use **browser localStorage** (per device / per origin). Deploying gives you a **new URL**, so saved progress starts empty unless you use the same browser storage domain only on that site—plan for a fresh slate on production, or keep practicing locally if you care about streaks.
