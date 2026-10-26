# What you can do

leopardcode is **real-time task morphing for coding agents**. You keep a single
living plan, and every new prompt edits the part that has not started yet. Running
work keeps running.

This page is the user-level view. For the call path and invariants, see
[real-time task morphing](../engineering/task_morphing.md).

## Who this is for

Developers and tech leads using coding agents for multi-step work — especially
teams of 5–200 where restarts, duplicate agent work, and token spend matter.

## Five things you can do because the plan morphs

### 1. Change the spec mid-run

**Before:** you notice a missing requirement and restart the prompt, losing
in-flight work.

**With real-time task morphing:** you send the change; the pending categories are
rewritten in place.

**What stays untouched:** every category already running.

### 2. Add work you just discovered

You start a CLI todo app, then remember it needs `undo`, rate limiting, a
migration, or docs. Send it. The new category enters pending work and runs when
its dependencies are done — or immediately if nothing blocks it.

### 3. Drop or rename pending work

You changed your mind about color output, or persistence should be a JSON store
instead of a file. Drop or rename the **pending** card. The running command card
is not disturbed.

> You can drop pending work. You cannot cancel a category that is already
> running; it finishes as it started.

### 4. Repeat a request without duplicate work

You ask for test coverage you already requested. The request updates the existing
`tests` category; duplicate task lines collapse. You do not pay for the same task
twice in one category.

Dedupe is exact (normalized task text). Differently named categories covering
similar work are not semantically merged automatically; the graph keeps both
until you rename or drop one.

### 5. Rewire dependencies and reprioritize

A new task depends on work already in the plan. Add the `depends_on` edge. The
DAG is revalidated, readiness is recomputed, and the next ready category starts —
without restarting the run.

## A real run: CLI todo

The `/sample` CLI todo scenario is the canonical example:

1. The seed plan starts `data-model`; `commands`, `json-store`, and `tests` wait.
2. **You add color output.** It enters pending; `commands` keeps running.
3. **You add undo, depending on commands.** The dependency is recorded; `undo`
   waits.
4. **You rename persistence to a JSON store with autosave.** The pending card is
   renamed and rescoped.
5. **You ask for tests again.** The existing `tests` category absorbs the request;
   duplicate task lines drop.
6. **You drop color output and add CLI wiring.** The pending card disappears; the
   new card enters; the running command card is unchanged.

The Task graph pane shows every morph. The running card never restarts.

## What you still cannot do

- Cancel a running category. It is immutable by design; only pending work changes.
- Morph a plan across sessions. The plan is per session; sessions can be resumed.
- Rely on semantic dedupe. Dedupe is exact; differently named categories are not
  merged automatically.
- Morph while a planning turn is mid-flight. One prompt worker per session keeps
  turns serialized; the next prompt plans immediately after.

## Try it

Open the demo, choose the provided model (6), and run:

```text
/sample
```

Choose **CLI todo app** and send a second prompt while the commands are running.
Watch the pending cards morph; the running card does not.
