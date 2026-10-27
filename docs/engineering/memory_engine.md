# H-MEM engine (Meterless)

The **H-MEM** engine is leopardcode's own implementation of the **Meterless**
sponsor technology: a local, dependency-free memory engine that mines durable
preferences from every prompt, ranks them on recall, guards writes with a trust
ledger, and feeds recalled context into the next planning turn so preferences
compound across morphs instead of vanishing at the end of a session.

It lives in [`packages/hmem/src`](../../packages/hmem/src), is imported by
both the terminal CLI and the web workspace, and is the target of the pinned
Meterless conformance suite in `.github/workflows/meterless-conformance.yml`
(last run: 13/13; output archived to `docs/media/hmem-conformance.txt` by the sponsor-proof PR and cross-linked from `docs/engineering/sponsor_verification.md`).

## What it does

1. **Mine.** Every user prompt is scanned for durable preference statements
   (for example "always use snake_case", "run tests before committing") and
   stored as memory records with provenance, type, and domain.
2. **Recall.** For each new prompt, records are ranked against it and the top
   matches (`retrievalTopN = 5`, threshold `0.35`) are appended to the planning
   prompt as recalled context.
3. **Score.** Ranking blends semantic similarity, keyword overlap, tag match,
   domain match, entity match, layer weight, and recency, with a penalty for
   superseded records:

   `0.35·semantic + 0.20·keyword + 0.10·tag + 0.10·domain + 0.15·entity +
   0.05·layer + 0.05·recency − 0.20·superseded`

   Layer weights: `long_term 1.0`, `working 0.8`, `short_term 0.6`.
4. **Guard.** Feedback moves confidence by `helpful +0.05`,
   `not_helpful −0.03`, `wrong −0.20` (clamped to [0,1]); every change is
   written to the trust ledger with action, actor, and timestamp.
5. **Sleep.** A nightly-style cycle consolidates old high-confidence records to
   `long_term` (after `consolidationDays = 7`), archives records untouched for
   `archiveMinDays = 30` days with `archiveMaxAccess = 2` accesses, merges
   related clusters (`dreamRelatedness = 0.35`), and proposes dream insights —
   hub records with `relatedTo.length >= 3` are never archived.

## Record shape (`MemoryRecord`)

| Field | Meaning |
|-------|---------|
| `id`, `content` | Record identifier and text |
| `type` | `personal` \| `factual` \| `preference` \| `general` |
| `layer` | `short_term` \| `working` \| `long_term` |
| `timestamp`, `lastAccessed`, `accessCount` | Timing for recency and decay |
| `confidence` | 0–1 trust score, moved by feedback |
| `domain`, `namespace`, `entities` | Ranking axes |
| `tags` | Free-form tags matched at recall |
| `provenance` | `{ origin, learnedAt, label, refs? }`: where the fact came from |
| `relatedTo`, `supersedes`, `supersededBy`, `derivedFrom?` | Graph links between records |

## Files

| File | Role |
|------|------|
| `index.ts` | `HMEM` facade: `add`, `mine`, `query`, `feedback`, plus sub-engine access |
| `store.ts` | Tiered record store (`short_term`/`working`/`long_term`) with pluggable persistence |
| `types.ts` | `MemoryRecord`, `MemoryLayer`, `MemoryType`, defaults, weights |
| `retrieval.ts` | Ranked recall and feedback application |
| `mining.ts` | Durable-preference extraction from interactions |
| `ledger.ts` | Trust ledger with append-only action log |
| `conflicts.ts` | Conflicting-memory detection |
| `sleep.ts` | Consolidation, archiving, dream proposals |
| `dreaming.ts` | Insight synthesis from related clusters |
| `enrichment.ts` | Domain/entity extraction used by ranking |

## Persistence

The engine core imports no `node:fs`; persistence is injected as a small
`{ read, write }` adapter. The CLI wires a filesystem adapter over
`user_config/memory/`; the web workspace wires a browser-storage adapter so the
same engine runs in both frontends.

## Frontend wiring

`terminal/src/session/project_memory.ts` builds `HMEM` with
`persist: fsPersistence(user_config/memory/)` and, per prompt:

- `preparePrompt()` recalls the top 5 records above threshold 0.2 and prepends
  them to the outgoing prompt (shown as "Recalled N project memories").
- `rememberPrompt()` mines durable preferences from the user prompt (called by
  `preparePrompt`).
- `trackPlanProgress()` records completed categories.
- `forgetMemory()` lowers confidence via `feedback(id, "wrong")`.

Commands: `/memory` (list), `/memory find <text>`, `/memory forget <id>`.
Task runs are recorded to `user_config/task_runs.csv` (the Zetaris FILESTORE
feed — see `docs/engineering/sponsor_verification.md`).

`web/src/terminal/session/project_memory.ts` mirrors that flow against the same
engine with `browserPersistence("hmem")` over `localStorage`, so `/memory` and
recall work in the browser workspace too; task runs use the shared
`packages/task_runs` recorder with a matching browser adapter.

## Conformance

The pinned Meterless H-MEM conformance suite
(`meterless/meterless/engines/hmem#1742dec56a66e58eef9dda2d2b865823758ca8cd`)
runs against `packages/hmem/src/index.ts` on every push/PR touching
`packages/hmem/**` or `backend/sponsor/**`. To run it locally:
```bash
npx -y degit meterless/meterless/engines/hmem#1742dec... hmem-engine
cd hmem-engine/reference && npm install --no-audit --no-fund
HMEM_IMPL="$PWD/../../packages/hmem/src/index.ts" npx tsx ../conformance/runner.ts
```

The commit that arches the last run's output is referenced from
`docs/engineering/sponsor_verification.md`.

## See also

- [`docs/engineering/sponsor_verification.md`](sponsor_verification.md) — Zetaris
  smoke test and how the task-run table reaches Zetaris FILESTORE
- [`docs/product/integration_writeup.md`](../product/integration_writeup.md) —
  sponsor integration write-up (Nemotron, Meterless, Zetaris)
