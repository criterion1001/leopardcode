# Business Value

The argument below is built from what leopardcode actually does.

## The pain (and why it costs money)

Agentic coding tools (Claude Code, Cursor, Copilot, Codex) all share
three costs that the developer pays in tokens and attention:

1. **Re-planning from scratch.** Each prompt is decomposed as if nothing came
   before. Overlapping and duplicate work gets redone; intent from earlier
   prompts is discarded.
2. **No live morph.** Once agents spawn, the plan is fixed. Changing course,
   adding discovered work, or dropping a pending task means restarting the prompt
   and losing in-flight work.
3. **Coordination overhead.** Parallel work is improvised by the model; dependent
   work can block or diverge, and multiple agents surface questions
   independently. The developer becomes the merge layer.

## What leopardcode does about it

| Value lever | Mechanism in leopardcode | Buyer's metric |
|---|---|---|
| **Morph without restarting** | Real-time task morphing: a new prompt reshapes pending work while running categories keep going (`processNewTask`, `mergeCategoryLists`, `validateGraph`) | time-to-course-change, in-flight work preserved |
| **Stop redoing work** | Persistent task graph per session; exact task dedupe; pending work can be dropped before it starts | tokens, wall-clock |
| **Safe parallelism** | Explicit `depends_on` DAG; categories run in parallel the moment dependencies are `done`; failure cascades to `blocked` (`validateGraph`, `readyCategories`, `cascadeBlocked`) | throughput, fewer broken builds |
| **Keep code private** | CLI file/shell tools execute **on the user's machine**; the server never reads the workspace (`delegation/`, `terminal/src/tool/`). Only model calls + optional web search leave the laptop | security review, procurement |
| **Cheap to run** | Server is a thin Socket.IO + model orchestrator; no database, queue, or filesystem state. Sessions persist as a local JSON file | infra cost |
| **Fewer context switches** | Main-agent-only structured questionnaire with a forced write-in option; one place to answer, not N sub-agent threads | attention |

The product is a **coordination layer**, not another executor: it is the memory +
scheduling + interaction shell around agents that already exist.

## Where the value compounds

- **Cost avoidance:** every avoided restart preserves in-flight tokens and time;
  every dropped pending task avoids spend; duplicate task lines do not run twice.
- **Onboarding:** the morph history is a readable record of "what was asked, what
  changed, and why", which shortens handoffs.
- **Flow:** the user keeps prompting instead of stopping, waiting, and re-planning.

## Who buys

- **Primary:** engineering teams (5–200 devs) already paying for one or more
  agentic tools, where a lead owns velocity and token spend.
- **Best fit:** teams with **security constraints** (code must not leave
  developer machines) and **cost constraints** (runaway agent spend) — leopardcode's
  client-side execution and thin server directly address both.

## Defensibility

- **The morph is data.** Pending changes, blocking, dedupe, and reordering are
  inspectable state, not model prose—so the user can see what changed.
- **Client-side execution as a trust story.** "Your code never reaches our
  servers" is a concrete, checkable property of the architecture.
- The moat is execution quality and distribution, not a patent.

## Alignment with the scoring rubric

| Score | Weight | Where leopardcode earns it |
|---|---|---|
| Impact | 30 | Live morphing removes the restart-and-re-explain tax for teams that keep discovering work mid-run; the persistent graph preserves intent across prompts ([problem](problem.md), [user_workflows](user_workflows.md)). |
| Technical | 20 | Explicit DAG with dependency readiness, a morph operation that touches only pending work, a detached execution pass with a planning gate, and client-side tool execution ([architecture](../engineering/architecture.md), [pipelines](../engineering/pipelines.md)). |
| Innovation | 15 | Not scheduling but *morphing a running plan from prose*: add, remove, rename, dedupe, and rewire pending work while running categories stay immutable ([task_morphing](../engineering/task_morphing.md)). |
| Demo | 15 | Five live morphs on one running plan; the running command card never changes; the web `/sample` scenarios replay them ([user_workflows](user_workflows.md)). |
| Product & UX | 10 | One questionnaire flow, a two-pane CLI, a three-pane web workspace, `/model`, `/memory`, `/runs`, and a live task graph. |
| Sponsor tech | 10 | Nemotron plans every morph, H-MEM (Meterless) informs the next one, and Zetaris records the task runs behind it ([integration_writeup](integration_writeup.md), [sponsor_verification](../engineering/sponsor_verification.md)). |
