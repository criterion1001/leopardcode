# Problem

Agentic AI development workflows have two linked failures:

1. **The plan freezes when work starts.** Once agents are executing, a new
   requirement cannot reshape the plan. Changing course means restarting the
   prompt and throwing away in-flight work.
2. **Plans have no relationship model.** Tasks are judged in isolation, so
   ordering, duplicates, and dependencies live only in the model's prose for one
   request and vanish when it ends.

The result is a **continuity gap**: every prompt is treated as if nothing happened
before it, and the user pays for the reset.

## What the user feels

1. **Forced restarts.** You notice a missing migration, a wrong scope, or a better
   order — and the only safe move is to stop and restart. Every token and minute
   already spent is gone.
2. **No live morph.** You cannot add work, drop pending work, rename a scope, or
   add a dependency while agents are already running. The plan is fixed at spawn
   time.
3. **Re-planned from scratch.** Each prompt is decomposed as if nothing were
   remembered. Overlapping work accumulates, identical work is redone, and there
   is no cross-prompt memory of what was already asked.
4. **No coordination across parallel work.** Independent work blocks behind
   dependent work, and divergent streams drift out of alignment — parallel tasks
   on backend, frontend, and docs finish inconsistent and are painful to merge.
5. **Fragmented interaction.** When multiple agents run in parallel, their outputs
   and questions arrive uncoordinated, and the developer becomes the manual merge
   layer.

## Root cause: tasks have no relationship model

Tools judge each task in isolation ("is this self-contained enough to spawn?"),
but *relationships between tasks* — depends-on, duplicates, can-run-with — never
exist as data. Ordering, at best, lives implicitly in the model's prose inside a
single request and is discarded the moment the request ends. Parallelism without a
relationship model is improvisation: independent work blocks behind dependent
work, and divergent streams finish inconsistent.

## The missing capability: real-time task morphing

The gap is not just memory. It is the ability to **reshape a running plan**:

- add a category the user just discovered;
- remove or defer pending work before it starts;
- rename or rescope a category as understanding improves;
- dedupe a repeated request;
- rewire `depends_on` so the next ready work dispatches.

All of this has to happen **while execution continues**, with running categories
untouched. That is the capability today's agents do not have.

## What leopardcode builds from this

One **persistent task graph per session** where relationships are first-class
data: `depends_on` (a DAG), status, tasks, and results. A new prompt **morphs**
that graph in place:

- only `pending_categories` is replaced;
- `running_categories` is immutable;
- exact task lines are deduped;
- name collisions with running work are renamed, not merged;
- ready morphs join the running pass.

That is real-time task morphing: keep prompting, change course, and keep the run.
See [what you can do](user_workflows.md) for the user workflows and
[real-time task morphing](../engineering/task_morphing.md) for the mechanics.
