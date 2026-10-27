# Real-time task morphing

**Real-time task morphing** is leopardcode's differentiator: a new prompt reshapes
the pending task graph **while execution is already running** — add, remove,
rename/rescope, dedupe, and rewire work — without restarting running categories.

This note is the canonical explanation of the morph path. Product-facing copy
should link here instead of re-deriving the mechanics.

## What morphs, and what never morphs

| | Pending work | Running work |
|---|---|---|
| Add a category | Yes | — |
| Remove a category | Yes | No |
| Rename or rescope | Yes | No |
| Rewire `depends_on` | Yes | No |
| Dedupe task lines | Yes | No |
| Reorder | Yes | No |

The invariant is simple: **only `pending_categories` is ever replaced.
`running_categories` is untouched by a new prompt.** A running category finishes
as it started. If a prompt reuses a running category's name, the newcomer is
renamed (`name (2)`) instead of merged into the running card.

"Real-time" here means **during execution**: the morph is computed on prompt
arrival and applied to pending state before the next dispatch. It does not mean
token-by-token streaming.

## Morph operations

| Operation | User-facing meaning | Implementation |
|---|---|---|
| **Add** | "Also do this" | New categories enter the incoming pending list |
| **Remove** | "Drop that for now" | Omitted categories leave the authoritative pending list |
| **Rename / rescope** | "Call it X, and only cover Y" | Same category slot, new name/tasks |
| **Dedupe** | "I already asked for that" | Exact task lines collapse; duplicate category names are renamed, not semantically merged |
| **Rewire** | "This should wait for that" | `depends_on` edges change; the DAG is revalidated |
| **Reorder** | "Do this next" | Pending order changes; readiness still follows dependencies |

Morphing is structural, not prose: the model proposes the complete pending list,
and the backend validates, repairs, merges, and dispatches it as data.

## Call path

When a prompt arrives, the main agent calls `processNewTask(categories)` with the
**complete pending graph**:

1. **Validate** — `validateCategoryInput` checks category shape, tasks, and
   `depends_on`; duplicate task descriptions inside a category are dropped.
2. **Repair** — `repairGraph` renames names that collide with running or
   completed categories or with an earlier category in the same call, and drops
   unknown or self dependencies.
3. **Check the DAG** — `validateGraph` runs Kahn's algorithm over incoming,
   running, and completed categories; cycles are rejected.
4. **Merge** — `mergeCategoryLists` treats the incoming list as authoritative and
   replaces only the pending list. If the incoming list is empty, the old pending
   list is kept.
5. **Cascade** — `cascadeBlocked` marks pending categories whose dependencies are
   failed or blocked.
6. **Commit and display** — `pending_categories` is replaced, completed copies of
   re-added names are dropped, and `updateTaskDisplay` emits a `task_update`
   snapshot.
7. **Dispatch** — the detached execution pass re-reads pending state, so morphs
   that are ready join the running pass.

Code: `backend/ai_tool/task/tool.py`,
`backend/ai_tool/task/task_graph.py`,
`backend/ai_tool/task/merge_task_lists.py`.

## Five live morphs: CLI todo

The `/sample` CLI todo scenario is the canonical user story:

| Step | You send | The pending plan morphs | What stays untouched |
|---|---|---|---|
| Seed | Build a CLI todo app: data model, commands, tests, JSON persistence | `data-model` starts; `commands`, `json-store`, `tests` are pending | — |
| M1 | "Add color output" | `color-output` enters pending | `commands` keeps running |
| M2 | "Add undo, depending on the commands" | `undo` enters pending with `depends_on: commands` | `commands` keeps running |
| M3 | "Rename persistence to a JSON store with autosave" | `json-store` is renamed and rescoped in place | `commands` keeps running |
| M4 | "Add tests for the commands" | The existing `tests` category is updated; duplicate task lines drop | `commands` keeps running |
| M5 | "Drop color output; add CLI wiring" | `color-output` leaves pending; `cli-wiring` enters | `commands` keeps running |

The graph in the Task pane changes at every step; the running card does not.

## User-visible behavior

- Pending cards appear, disappear, rename, and rewire between prompts.
- Running cards keep their status, progress, and result.
- Dependencies decide what starts next; a morph can make new work ready.
- A repeated request does not create duplicate task lines in the same category.
- Dropping or renaming a running category is refused or renamed, never applied.

## Failure handling

- A sub-agent timeout is retried once with a fresh agent and a full budget
  (`SUBAGENT_ATTEMPTS=2`, `SUBAGENT_RETRY_BACKOFF_SECONDS=5`); the timed-out
  attempt's messages are not replayed.
- Two failed attempts fail the category, and its dependents cascade to `blocked`
  for the rest of the pass. The next prompt can re-add the work.

## Boundaries

- Running work cannot be canceled by a prompt. Only pending work can be dropped.
- The plan is per session; resuming a session restores its graph.
- Dedupe is exact (normalized task description), not semantic. Two differently
  named categories covering similar work are not merged automatically.
- The model proposes categories; the backend owns reconciliation. The graph is
  deterministic data after the turn.

## Verification

- `backend/ai_tool/task/` contains the validation, repair, DAG, and merge logic.
- The `task_update` snapshot is the UI contract for a morph.
- The CLI todo `/sample` scenario demonstrates add, dependency, rename, dedupe,
  and drop against a running plan.
- Sponsor proof: Nemotron plans the morph (models 2–4), H-MEM informs the next
  morph, and Zetaris records the task runs behind it.
