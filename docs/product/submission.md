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

## Positioning

**Tagline:** Real-time task morphing for coding agents.

**One-liner:** leopardcode lets a new prompt reshape the pending task graph while
agents are already working — add, remove, rename/rescope, dedupe, rewire — without
restarting running work.

**User story:** a CLI todo plan is running; the user adds color output, adds an
undo dependency, renames persistence, repeats a test request (one `tests` node),
and drops color output. The running command card never changes.

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
   technologies. Drafted in [integration_writeup](integration_writeup.md).

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

- Start with the problem: **plans freeze when work starts** ([problem](problem.md)).
- Define **real-time task morphing** and what the user can do because of it
  ([user_workflows](user_workflows.md)).
- Show the five live morphs on the CLI todo plan: add, dependency, rename,
  dedupe, drop. The running card never changes.
- Explain the invariant: only pending work morphs; running work is immutable.
- Show execution: the morph joins the running pass; dependencies dispatch.
- Target users and value ([business_value](business_value.md)).
- Competition: request-scoped vs. real-time task morphing
  ([competition_analysis](competition_analysis.md)).
- Product surfaces: CLI Task pane, web Task graph, one questionnaire.
- Sponsors: Nemotron plans the morph, H-MEM informs the next morph, Zetaris
  records the task runs behind it.
- What request-scoped agents do not have: they re-plan per request, keep no
  cross-prompt graph, and cannot reshape a running plan.
- Close with the user promise: keep prompting; the plan morphs; the work keeps
  running.

## Video

- Start with the problem: plans freeze when work starts.
- Show a running CLI todo plan; send a second prompt and let the pending graph
  morph on screen.
- Add color output, add the `undo` dependency, rename persistence, repeat the
  test request (one `tests` node), drop color output.
- Point at the running command card and say it never restarted.
- Close with the user promise: keep prompting; the plan morphs; the work keeps
  running.
- AI voice for clarity; video link (fill in); **1–4 minutes**.

## Repo

- Show the AI config and agent usage (above).
- Clean code, good algorithms (the DAG scheduler in `backend/ai_tool/task/`),
  good structure.
- Markdown docs under [`docs/`](../README.md).

## Demo

- Everything working end-to-end.
- Open the two-pane TUI, run the CLI todo `/sample`, and send a second prompt
  while the commands run.
- Show the pending cards morphing: add, rename, dedupe, drop; the running card
  keeps its status and progress.
- Show a dependency added mid-run and the next ready category dispatching.

## Website

- Docs, link to the GitHub repo.
