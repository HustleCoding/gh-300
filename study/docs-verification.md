# Official docs cross-check (GH-300 topics)

Use this alongside [GH-300.pdf](../GH-300.pdf). Third-party answers can drift; these are **current GitHub Docs** anchors for themes that show up frequently in the bank.

## Core hub

- [GitHub Copilot documentation](https://docs.github.com/en/copilot)

## Topics → official pages

### Plans (Business vs Enterprise, rollout)

- [Plans for GitHub Copilot](https://docs.github.com/en/copilot/get-started/plans)
- [Choosing your enterprise's plan for GitHub Copilot](https://docs.github.com/en/copilot/get-started/choose-enterprise-plan) — compares Copilot Business vs Enterprise at a high level (pricing and premium requests called out on this page).
- [GitHub Copilot features](https://docs.github.com/en/copilot/get-started/features) — lists **Copilot Spaces** (organize code, docs, specs for context); admin sections for policies, usage, audit logs, **exclude files**.

### Suggestion quality, prompts, reviewing AI output

- [Best practices for using GitHub Copilot](https://docs.github.com/en/copilot/get-started/best-practices) — thoughtful prompts (be specific, examples), check Copilot’s work, strengths/limits.
- [Prompt engineering for GitHub Copilot Chat](https://docs.github.com/en/copilot/concepts/prompting/prompt-engineering)

### Audit logs (org/enterprise, what is / isn’t recorded)

- [Reviewing audit logs for GitHub Copilot](https://docs.github.com/en/copilot/managing-copilot/managing-github-copilot-in-your-organization/reviewing-activity-related-to-github-copilot-in-your-organization/reviewing-audit-logs-for-copilot-business) — audit log includes **changes to Copilot plan** (settings, policies, licenses), **agent activity on GitHub**; **does not** include local client session data such as IDE prompts (custom logging would be separate).
- [Reviewing the audit log for your organization](https://docs.github.com/en/organizations/keeping-your-organization-secure/managing-security-settings-for-your-organization/reviewing-the-audit-log-for-your-organization) — `copilot` category exists; org log retention **180 days** (also stated on Copilot audit page).
- Event catalogs: [Audit log events for your organization — Copilot](https://docs.github.com/en/organizations/keeping-your-organization-secure/managing-security-settings-for-your-organization/audit-log-events-for-your-organization#copilot)

### Content exclusion

- [Content exclusion for GitHub Copilot](https://docs.github.com/en/copilot/concepts/context/content-exclusion) — excluded files: **no inline suggestions in those files**; excluded content **does not inform** suggestions in other files or **Copilot Chat**; excluded files **not reviewed** in Copilot code review; **who** can configure (repo admins, org owners, enterprise owners).

### Public code / duplication (filtering, references)

- [GitHub Copilot code referencing](https://docs.github.com/en/copilot/concepts/completions/code-referencing)
- Policy pointers from best practices: [suggestions matching public code](https://docs.github.com/en/copilot/managing-copilot/managing-copilot-as-an-individual-subscriber/managing-copilot-policies-as-an-individual-subscriber#enabling-or-disabling-suggestions-matching-public-code) (individual) and org policies (linked from same best-practices page).

### Copilot Chat: slash commands and variables

- [GitHub Copilot Chat cheat sheet](https://docs.github.com/en/copilot/reference/cheat-sheet) — environment-specific tables; in **VS Code** section, **`/tests`** is listed as **“Generate unit tests for the selected code.”** (Confirms the PDF’s Q148 answer key **C** if the exam uses the same wording.)

### Code suggestions behavior

- [GitHub Copilot code suggestions in your IDE](https://docs.github.com/en/copilot/concepts/completions/code-suggestions)

### Network / enterprise configuration

- [Network settings for GitHub Copilot](https://docs.github.com/en/copilot/concepts/network-settings)

## PDF fact-check sample

| PDF item | Claim | Official check |
| --- | --- | --- |
| Q148 | Use **`/tests`** for unit tests in Copilot Chat | Cheat sheet (VS Code / JetBrains / Xcode sections): **`/tests`** generates tests for selected code. |

When a PDF answer conflicts with a page above, **trust the live doc** and note it in [misses-log.md](./misses-log.md).
