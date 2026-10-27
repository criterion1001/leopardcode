# Competition Analysis

> Competitor statements are **EXTERNAL** (public docs).

## Thesis

Agentic coding tools nailed the *execution* half of agentic coding but treat every
prompt as a fresh start. The differentiator is not a bigger context window or a
better multi-agent UI; it is **real-time task morphing**. leopardcode lets a new
prompt reshape the pending plan while running work continues. The persistent graph
is the substrate; live morphing is the claim.

## Head-to-head: leopardcode vs. leading agentic coding tools

Method: capability-level comparison from vendor product documentation as of
October 2026, not a benchmark. The competitor column is deliberately generic —
request-scoped agents as a class — and no vendor is named or ranked.

| Capability | Request-scoped agents (external) | leopardcode |
|---|---|---|
| Main agent spawns isolated parallel subagents | Yes — per-task subagents in most tools | Yes — fresh sub-agent per task |
| Consolidated view of parallel runs | Per-session transcript; no live plan view | Two-pane TUI: live graph + conversation; per-category progress lines |
| Cross-prompt task memory and dedupe | Re-plans every request | Persistent graph; `processNewTask` morphs pending work; exact task dedupe |
| Live morph while work runs | No — restart the prompt | **Yes — add, remove, rename, dedupe, rewire pending work; running categories immutable** |
| Dependency scheduling (sequential vs. simultaneous) | Model decides ad hoc | Explicit `depends_on` DAG, topological readiness, failure cascade |
| Automatic parallel dispatch | Ad hoc or user-approved | `executeCurrentTask` dispatches automatically |
| Runs file/shell work on the user's machine | Local in the vendor CLI, sandboxed in hosted variants | Forwarded over Socket.IO to the CLI |

## The real difference: execution vs. structure

| | Request-scoped agents (external) | leopardcode |
|---|---|---|
| Unit of work | one ad-hoc subagent brief | persistent graph entry (category) |
| Task relationships | none as data | `depends_on` DAG, exact-dedupe, failure cascade |
| Lifespan | single request | across all prompts/sessions |
| Parallelism | improvised by the model | dispatched from explicit dependency readiness |

Request-scoped tools solved *"how do I run isolated tasks in parallel?"*
leopardcode solves *"how does the user reshape a running plan?"* Context isolation
and live intent continuity are different axes.

## Distinct claims: mechanism → outcome

1. **Real-time task morphing** → keep sending prompts while agents work; add,
   remove, rename, dedupe, and rewire pending work without restarting.
2. **Persistent task graph** → you don't re-explain; identical task lines are
   deduped; relationships are data.
3. **Dependency-aware dispatch** → a morph can make new work ready; parallel work
   is coordinated by `depends_on`, not guessed.

## Wider field

Parallel subagents are standard across agentic coding tools (Claude Code
Task/subagents, OpenAI Codex). Few, if any, let a user reshape a running coding
plan from a new prompt. Live morphing—not parallelism—is leopardcode's
differentiation.

## Other agentic coding tools

The mainstream agentic coding tools are **request-scoped executors** (Claude
Code, OpenAI Codex, Cursor, Aider, OpenHands, Copilot): each prompt is planned on
its own, and steering means restarting the prompt. (Competitor statements are
external and descriptive, not endorsements.)

| Capability | Request-scoped agents (external) | leopardcode |
|---|---|---|
| Unit of work | one prompt / one spawned agent | an entry in a persistent work graph |
| Across prompts | re-plans from scratch | **morphs pending work live** |
| Task relationships | implicit in the model's prose | first-class `depends_on`, dedupe, result flow |
| Live morph while running | no — restart the prompt | **yes — pending work only; running untouched** |
| Parallel dispatch | ad hoc / user-approved | triggered by dependency readiness |
| Where code runs (CLI) | per-tool (vendor or local) | on the user's machine; server is a thin orchestrator |

## Fit with the hackathon tracks

**Primary track: Reasoning Architecture.** The claim is about how an agent
reasons over a plan that outlives a single prompt: a persistent dependency
graph, an explicit morph operation that replaces only pending work, and
execution driven by topological readiness. The demo is scored on that reasoning
structure, not on raw code-generation throughput. See
[tracks_and_prizes](../hackathon/tracks_and_prizes.md) and
[user workflows](user_workflows.md), which maps each morph to a user-visible
outcome.

## Why not "just a scheduler"?

Airflow, Temporal, CI, and build systems already do scheduling, dedupe, and
dependency ordering. The claim is narrower: **a user can morph a running coding
plan from a natural-language prompt**. The DAG is the mechanism; live morphing is
the story.

## Sources

No external benchmark figures are claimed. The comparison is capability-level,
drawn from the product documentation of request-scoped coding agents as of
October 2026; leopardcode's columns are verifiable in this repository
([architecture](../engineering/architecture.md),
[data model](../engineering/data_model.md),
[task morphing](../engineering/task_morphing.md)).
