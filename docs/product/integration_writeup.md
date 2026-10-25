# Integration write-up

Submission deliverable for the **Open Agent Hackathon 2026**: how Zetaris and
Meterless are integrated, where NVIDIA technology contributes, how development
used AI tooling, and what is unique about the sponsor technology use.

leopardcode is a multi-agent coding orchestrator built around one persistent
task graph. A main agent turns each prompt into categories of work, categories
launch in parallel as their dependencies finish, and a later prompt morphs the
pending work instead of restarting the plan. Everything below is wired into that
loop or proves a sponsor contract end to end.

## NVIDIA Nemotron

Nemotron is the product's inference layer. The backend serves every model
through the NVIDIA NIM endpoint (`https://integrate.api.nvidia.com/v1`) using an
OpenAI-compatible client, and the three selectable ids are all Nemotron:

| Id | Model | Role |
|---|---|---|
| 2 | `nvidia/nemotron-3.5-super-vl-120b-a12b` | default planning and execution model |
| 3 | `nvidia/nemotron-3.5-lightning-30b-a3b` | fast loop for quick iterations |
| 4 | `nvidia/nemotron-3-ultra-550b-a55b` | heavy reasoning for large graphs |

- `backend/model/model_client.py` builds each model with `init_chat_model`
  against NIM, and every agent call goes through it: the planning turns that
  rebuild the graph, the sub-agents that execute each category, and the results
  turn that reports back.
- Keys are operator-funded and server-side (`NVIDIA_API_KEY`). Clients never
  send a provider key; the connect handler validates the model id and resolves
  the key from the environment, and a missing key is an explicit rejection
  rather than a silent fallback.
- Sub-agents inherit the main agent's model id, so the whole plan and its
  execution share one Nemotron model and one context budget.
- `backend/sponsor/nim_client.py` exposes the same endpoint directly (model
  listing plus chat completions) and backs the `Nemotron NIM Smoke` CI job: it
  lists NIM's models, picks a Nemotron id, and completes a prompt.

Unique here: Nemotron is not a bolt-on chatbot. The product's only models are
Nemotron, and switching ids 2/3/4 changes planning quality and latency for the
same task graph without any code change.

## Meterless

Meterless contributes on two levels.

**Runtime client.** `backend/sponsor/meterless_client.py` implements the
Meterless provider contract for the backend:

- the base URL is normalized to `<host>/v1`, so a pasted URL never produces
  `/v1/v1`;
- `Authorization: Bearer` comes from `METERLESS_TOKEN` (the runtime's
  `proxy-token` value), with `meterless-app` on every request and
  `meterless-scope: user` on chat;
- model ids are routing modes, `meterless/<disposition>`, kept opaque by the
  client;
- status comes from `GET /v1/models` instead of `/healthz`, so a reachable
  process that refuses the token reports `unauthorized`, not `offline`;
- the timeout is 180 s so a cold model load does not read as an outage.

The `Meterless Hotspot Smoke` CI job runs the status check and one chat round
trip against a configured runtime, and skips cleanly when no runtime is set.

**H-MEM in the product.** `terminal/src/memory/` is our implementation of the
H-MEM engine: canonical records with mandatory source and provenance, the
tiered store with enrichment and decay, the documented hybrid ranking formula
(0.35 semantic / 0.20 keyword / 0.10 tag / 0.10 domain / 0.15 entity / 0.05
layer / 0.05 recency minus 0.20 superseded, multiplied by confidence), exact
feedback deltas, the append-only trust ledger, sleep preview/execute guardrails
with backups, conflict detection with auto-resolution, and dreaming behind an
approval boundary.

It powers project memory in the CLI. Durable preference statements in a prompt
are mined into `user_config/memory/`, relevant records are recalled on each
prompt and appended to the wire payload as a memory context block, completed
categories are recorded as plan completions, and `/memory` lists or searches
what is stored while `/memory forget <id>` lowers confidence through the trust
ledger. Memory stays on the developer's machine, matching the product's
local-first stance.

The official conformance suite runs against that implementation:

```bash
npx -y degit meterless/meterless/engines/hmem#1742dec56a66e58eef9dda2d2b865823758ca8cd hmem-engine
cd hmem-engine/reference
npm install --no-audit --no-fund
HMEM_IMPL=/abs/path/to/leopardcode/terminal/src/memory/index.ts npx tsx ../conformance/runner.ts
```

Last run: 13/13 checks, exit 0. The `H-MEM Conformance` job in
`meterless-conformance.yml` runs the same suite on pull requests that touch the
engine and on `main`.

Unique here: the engine spec is implemented in the product and verified by the
published conformance suite on every engine change, and the runtime client
encodes the contract's edge cases (status semantics, header scope, URL
normalization, timeout) so the product fails honestly.

## Zetaris

`backend/sponsor/zetaris_client.py` talks to the documented Zetaris REST API,
matching the official getting-started scripts:

- `POST {ZETARIS_REST_URL}/sql-editor/sqls/run` with a `queryId`, the SQL, the
  `SqlEditor` source, and a row limit;
- every request carries `Authorization: Bearer`, `X-Org-ID`, and a fresh
  `X-Request-ID`;
- `GET {ZETARIS_REST_URL}/datasource/datasources` lists the datasources the
  instance exposes.

The verification query is committed at
`backend/sponsor/sql/zetaris_verification_select.sql` and the `Zetaris REST
Smoke` job runs it through the REST API after listing datasources. Locally the
same check is:

```bash
cd backend
ZETARIS_REST_URL=... ZETARIS_API_KEY=... ZETARIS_ORG_ID=... uv run python -m sponsor.smoke zetaris
```

Unique here: the proof is a versioned query executed by the same client the
backend ships, not a one-off curl, and query execution stays server-side where
the gateway can attach data work to tasks without handing credentials to
clients.

## Development tooling (including Cursor)

Development ran through **opencode**, configured with NVIDIA Nemotron models and
MCP servers for planning (Obsidian), design (Penpot), and the submission deck
(LibreOffice). Every change moved through a git worktree named for its concern,
small scoped commits, a pull request, and a merge only after the triggered
checks were green.

**Cursor was not used during development**, so there is no Cursor usage to
report. Cursor is optional under the current guide; development ran through
opencode configured with NVIDIA Nemotron, GitHub Actions, and the scripts in
`backend/` and `docs/`.

## Where the sponsor proof lives

| Check | Where | What it proves |
|---|---|---|
| `Nemotron NIM Smoke` | `.github/workflows/sponsor-smoke.yml` | NIM auth, model listing, and a live Nemotron completion |
| `Meterless Hotspot Smoke` | `.github/workflows/sponsor-smoke.yml` | runtime status and one chat round trip with the required headers |
| `H-MEM Conformance` | `.github/workflows/meterless-conformance.yml` | our H-MEM engine against the pinned conformance suite (13/13) |
| `Zetaris REST Smoke` | `.github/workflows/sponsor-smoke.yml` | datasource listing plus the committed verification query |

Variable names live in `.env.example`; values come from the environment locally
and GitHub Actions secrets in CI. Every job guards its live step on its secret
and reports a skip otherwise.

See [sponsor_verification](../engineering/sponsor_verification.md) for the
commands and [submission](submission.md) for the deliverable checklist.
