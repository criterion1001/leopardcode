# Solution

Engineering detail: [real-time task morphing](../engineering/task_morphing.md),
[pipelines](../engineering/pipelines.md), [data_model](../engineering/data_model.md),
[architecture](../engineering/architecture.md).

## Positioning: real-time task morphing

Most agentic tools assume a prompt is the unit of work. Miss a detail and you
restart; once agents spawn you cannot change course; every request re-plans from
nothing.

leopardcode makes the **plan** the unit of work, then makes that plan **morph in
real time**. A new prompt reshapes the pending task graph in place — add, remove,
rename/rescope, dedupe, rewire — while already-running work continues untouched.

> The persistent graph is the mechanism. Real-time task morphing is the point.
> Continuity and safe re-steering are the outcome.

## What the user can do

| User action | What morphs | What stays untouched |
|---|---|---|
| "Also add this" | A new pending category | Every running category |
| "Drop that for now" | The pending category leaves | Every running category |
| "Call it X and only cover Y" | Pending name/tasks | Every running category |
| "I already asked for that" | Exact task lines collapse | Every running category |
| "This should wait for that" | `depends_on` edges and readiness | Every running category |

You can keep prompting safely; only pending work changes. You cannot cancel a
running category — it finishes as it started. Full user workflows:
[what you can do](user_workflows.md).

## 1) The morph

### Core invariant: running work is never touched

Work an agent has already begun is immutable. When a new prompt arrives, only
**pending** categories are re-matched, merged, reordered, renamed, or revalidated.
This is what makes "keep sending prompts" safe: amendments steer the plan forward;
they never race an executor mid-change.

Implemented by rejecting or renaming name collisions with running categories
(`repairGraph`, `validateGraph`) and by replacing only `pending_categories`.

### Relationships are first-class data

Every graph entry carries its relationships as inspectable fields:

- **depends-on** → explicit DAG edges (`depends_on`)
- **duplicates** → exact task dedupe; duplicate category names in one call are
  renamed, not semantically merged
- **results** → each category's task results are stored and fed to its dependents

| | Question asked | Where it lives | Lifespan |
|---|---|---|---|
| Typical agent tool | "Can this run in parallel right now?" | ad hoc, in the model's head | one request |
| leopardcode | "What should run, in what order, given everything already asked?" | graph fields (`name`, `tasks`, `depends_on`, `status`, `result`) | across prompts in a session |

### Morph algorithm

When a prompt arrives:

1. **Decomposition** — the main agent breaks it into categories
   `{name, tasks, depends_on}` and returns the **complete pending graph**. Running
   work is untouched.
2. **Validate and repair** — `validateCategoryInput` checks shape and dedupes task
   descriptions; `repairGraph` renames collisions, drops self/unknown deps.
3. **DAG check** — `validateGraph` runs Kahn's algorithm over incoming + running +
   completed; cycles are rejected.
4. **Merge** — `mergeCategoryLists` treats the incoming list as authoritative and
   replaces only pending work.
5. **Dispatch** — `executeCurrentTask` starts or joins a background pass; ready
   categories begin immediately, failures cascade `blocked` to dependents.
6. **Results** — when the pass drains, the main agent reports the outcome in a
   dedicated follow-up message.

Full call path: [real-time task morphing](../engineering/task_morphing.md).

### Why this is not a request-scoped agent

Request-scoped agents re-plan each request in isolation and keep no cross-prompt
graph. They cannot morph a running plan. The persistent graph plus the morph path
is the core difference. See [competition_analysis](competition_analysis.md).

## 2) Execution

leopardcode uses the standard pattern — a main agent spawning isolated parallel
sub-agents — but the morph and dispatch are **driven by the graph**, not by a
per-request model decision.

- **Automatic dispatch** — `executeCurrentTask` starts every ready category and
  runs the pass in the background.
- **Non-blocking planning** — because execution is detached, a new prompt is
  planned immediately, and categories it morphs in **join the running pass**
  (a planning gate closes the exit race).
- **Isolation** — each task gets a fresh sub-agent with file/shell/web tools.
- **Safety** — running categories are immutable; only pending work morphs.

## 3) Client-side execution

In the CLI, file and shell tools are forwarded over Socket.IO and executed on the
user's machine, so code and secrets never leave the laptop. In the web workspace
the same tools run server-side against the session's OCI folder, so the browser
never holds storage credentials.

## 4) Alternatives weighed

- **Bigger context windows only** — extend the per-prompt horizon but cannot morph
  a running plan and create no cross-prompt memory.
- **Better multi-agent UI / tabs** — improve visibility but do not let the user
  reshape work already in flight.
- **A general-purpose scheduler** — Airflow/Temporal/CI can reorder jobs, but they
  do not accept a natural-language morph into a running coding plan. The graph is
  deliberately narrow: it is the smallest structure that makes live morphing safe.
