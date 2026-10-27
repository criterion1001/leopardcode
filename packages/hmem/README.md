# hmem — the Meterless H-MEM engine

`packages/hmem/src` is leopardcode's own **H-MEM** memory engine: the local,
dependency-free implementation of the **Meterless** sponsor technology. It is
imported by both frontends — the terminal CLI (`terminal/src/session/project_memory.ts`)
and the web workspace (`web/src/terminal/…`) — so one engine powers both
surfaces and the hackathon conformance suite runs against this exact directory.

## What it does

H-MEM mines durable preference statements from every user prompt, stores them
per project with provenance and confidence, ranks them on recall (recency,
access count, confidence, tier, domain match, retrieval feedback, decay), guards
writes with a trust ledger (sleep/dreaming boundaries, conflict detection), and
appends recalled context to the next planning prompt so preferences compound
across morphs instead of vanishing at the end of a session.

## Files

| File | Role |
|------|------|
| `index.ts` | `HMEM` facade: store, retrieval, mining, conflicts, sleep, dreaming, ledger |
| `store.ts` | tiered record store with pluggable persistence |
| `types.ts` | `MemoryRecord`, `MemoryLayer`, `HmemOptions`, ranking defaults |
| `retrieval.ts` | ranked recall against the current prompt |
| `mining.ts` | durable-preference extraction |
| `ledger.ts` | trust ledger with feedback deltas |
| `conflicts.ts` | conflicting-memory detection |
| `sleep.ts` | consolidation/archive/dreaming guardrails |
| `dreaming.ts` | synthesis of related memories |
| `enrichment.ts` | domain/entity extraction for ranking |

## Persistence

The engine core is free of `node:fs`. Persistence is injected through a small
`{ read, write }` adapter: the CLI uses a filesystem adapter backed by
`user_config/memory/`; the web workspace uses a browser-storage adapter. See
`docs/engineering/memory_engine.md` for the full design and record schema.

## Conformance

The pinned Meterless H-MEM conformance suite runs against
`packages/hmem/src/index.ts` in `.github/workflows/meterless-conformance.yml`
(the last run passed 13/13; see `docs/media/hmem-conformance.txt` once archived).
