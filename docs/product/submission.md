# Submission

> Submission checklist for the **Open Agent Hackathon 2026**
> (https://hackathon.genai.works/event/open-agent-hackathon-2026).

## Hard deadlines (UTC)

- **Registration closes:** Oct 22, 2026, 23:59 UTC.
- **Build window:** Oct 22, 2026, 00:00 UTC → Oct 27, 2026, 23:45 UTC.
- **Submissions close:** Oct 27, 2026, 23:45 UTC. Hard deadline — time zones do
  not extend it.
- **Results announced:** Nov 6, 2026, 16:00 UTC.

## Hard constraints

- **Demo video is 1–4 minutes.**
- **Do not expose secrets** (API keys, tokens, credentials) anywhere in the repo,
  notes, screenshots, or video. Keep keys in environment variables, never
  committed.
- **Every submission must integrate Zetaris and Meterless**, and the team must
  use **Cursor** for development.
- Integrate **NVIDIA technology** wherever it contributes to the project.
- Work committed before the window opens is not eligible, except clearly
  declared pre-existing components.
- Pre-existing product code must be declared in the submission form. Generated
  code is allowed and expected — you own the result and are accountable for it.

## The four deliverables

1. **Demo video (1–4 minutes)** — the main workflow, how the agent solves the
   selected challenge, its key features, and how Zetaris and Meterless are
   integrated.
2. **Slide deck** — the problem and target users, the solution, the agent
   workflow or architecture, the technical stack, how Zetaris and Meterless were
   used, what was unique about the use of the sponsor technologies, product
   visuals, and future enhancements.
3. **GitHub repository** — all source code and a README covering setup, usage
   and dependencies. If agents run in Google Colab, include the Colab links.
4. **Integration write-up** — a clear explanation of how Zetaris and Meterless
   were integrated, how Cursor was used during development, where NVIDIA
   technology contributes, and what was unique about the use of the sponsor
   technologies.

## How it is judged

- Scoring out of 100: Impact 30, Technical 20, Innovation 15, Demo 15,
  Product & UX 10, Sponsor tech 10 (see
  [tracks_and_prizes](../hackathon/tracks_and_prizes.md)).
- Each submission is reviewed by at least three judges.
- Ties resolve on the Impact score, then on submission timestamp.
- Pick exactly one primary track; it decides the judging panel and the prize
  pool. Track can change any time before the deadline. See
  [official_rules](../hackathon/official_rules.md).

## What this project does for the submission

### AI config in the repo

| Artifact | Purpose |
|---|---|
| `AGENTS.md` | Working agreement: plan first, ask before assuming, follow the rules. |
| `.opencode/opencode.json` | opencode MCP servers: Obsidian, Penpot, and LibreOffice. |
| `.opencode/rules/*` | The structure, variable, Obsidian, LibreOffice, and project-layout rules the agent follows. |

### One worktree and one pull request per concern

Every change lives in its own **git worktree** under `LEOPARDCODE/`, named
`leopardcode-<PURPOSE>` (for instance `leopardcode-DOCUMENTS`), beside
`leopardcode-MAIN` — one concern per worktree, small scoped commits, one pull
request per concern, so `main` never holds unreviewed work. *(TODO: record the
final concern/PR count here once changes land.)*

### MCP tooling for everything that is not code

Three MCP servers cover planning, documentation, design, and the presentation:

- **Obsidian — planning and documentation.** Keep the project vault in sync as
  the code changes.
- **Penpot — design.** Concept and architecture visuals, web-workspace layout.
- **LibreOffice — the submission deck.** Draft and refresh the slides and PDF
  from the product notes.

Files created through these tools belong in the `OPEN-AGENT-HACKATHON-2026`
directory.

TODO: replace the sections below with leopardcode's real build story once the
first commits land.

### What the agent built

- **Backend** — TODO.
- **CLI** — TODO.
- **Web** — TODO.
- **Review and hardening** — TODO. Explore alternatives (see
  [competition_analysis](competition_analysis.md)) and enforce the checks in
  [build_and_run](../engineering/build_and_run.md).

## Deck outline

- Start with the problem ([problem](problem.md)).
- Slide deck link (fill in).
- Competition analysis ([competition_analysis](competition_analysis.md)).
- Target users ([business_value](business_value.md)).
- Conceptual diagrams (see [architecture](../engineering/architecture.md)).
- How the product is used: the `/model → prompt → Tasks pane → questionnaire`
  loop, and the follow-up message that reports finished execution.
- A strong, real problem example: three prompts that change intent
  ("fix login" → "rethink auth" → "revert that") and how the persistent graph
  handles each.
- What request-scoped agents do not have: they re-plan per request and keep no
  cross-prompt task graph.
- How Zetaris and Meterless are integrated, how Cursor was used, where NVIDIA
  technology contributes.

## Video

- Start with the problem.
- AI voice for clarity; video link (fill in).
- Same beats as the slides, demo-driven.
- **1–4 minutes.**

## Repo

- Show the AI config and agent usage (above).
- Clean code, good algorithms (the DAG scheduler in `backend/ai_tool/task/`),
  good structure.
- Markdown docs under [`docs/`](../README.md).

## Demo

- Everything working end-to-end.
- Show the two-pane TUI and parallel categories in the Tasks pane; send a second
  prompt while work runs to show morphing into the running pass.

## Website

- Docs, link to the GitHub repo.
