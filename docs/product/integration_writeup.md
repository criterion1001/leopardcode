# Integration write-up

Submission deliverable for the **Open Agent Hackathon 2026**: how Zetaris and
Meterless are integrated, where NVIDIA technology contributes, how development
used AI tooling, and what is unique about the sponsor technology use.

leopardcode is **real-time task morphing for coding agents**. A main agent keeps
one persistent task graph per session. A later prompt reshapes the pending work —
add, remove, rename/rescope, dedupe, rewire — while running categories continue.
Everything below is wired into that morph loop or proves a sponsor contract end
to end.

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
- Users bring their own NVIDIA API key, entered in the CLI (`/model`, then
  `/key`) or the web key prompt. The connect handler rejects a Nemotron model
  without a key, and the backend holds no NVIDIA credential of its own.
- Sub-agents inherit the main agent's model id, so the whole plan and its
  execution share one Nemotron model and one context budget.
- Model 6 (DeepSeek Flash) stays operator-funded via `PROVIDED_MODEL_KEY` for the
  web demo, so the workspace can be tried without a key.

Unique here: Nemotron is not a bolt-on chatbot. Models 2–4 are the models that
**plan each live morph**, and switching ids changes the morph's planning quality
and latency without any code change. Model 6 remains the operator-funded web
demo.

## Meterless

Meterless contributes through its H-MEM engine, implemented in the product.

**H-MEM in the product.** `packages/hmem/src/` is our implementation of the
H-MEM engine: canonical records with mandatory source and provenance, the
tiered store with enrichment and decay, the documented hybrid ranking formula
(0.35 semantic / 0.20 keyword / 0.10 tag / 0.10 domain / 0.15 entity / 0.05
layer / 0.05 recency minus 0.20 superseded, multiplied by confidence), exact
feedback deltas, the append-only trust ledger, sleep preview/execute guardrails
with backups, conflict detection with auto-resolution, and dreaming behind an
approval boundary.

It powers project memory in the CLI. Durable preference statements in a prompt
are mined into `user_config/memory/`, relevant records are recalled on each
prompt and appended to the wire payload as a memory context block, so the **next
morph starts informed**. Completed categories are recorded as plan completions,
and `/memory` lists or searches
what is stored while `/memory forget <id>` lowers confidence through the trust
ledger. Memory stays on the developer's machine, matching the product's
local-first stance.

The official conformance suite runs against that implementation:

```bash
npx -y degit meterless/meterless/engines/hmem#1742dec56a66e58eef9dda2d2b865823758ca8cd hmem-engine
cd hmem-engine/reference
npm install --no-audit --no-fund
HMEM_IMPL=/abs/path/to/leopardcode/packages/hmem/src/index.ts npx tsx ../conformance/runner.ts
```

The pinned-spec run is archived at `docs/media/hmem-conformance.txt` (13/13
checks passed). The `H-MEM Conformance` job in
`meterless-conformance.yml` runs the same suite on pull requests that touch the
engine and on `main`.

Unique here: the engine spec is implemented in the product and verified by the
published conformance suite on every engine change, and the same records shape
the next morph without leaving the developer's machine.

## Zetaris

`backend/sponsor/zetaris_client.py` talks to the documented Zetaris REST API,
matching the official getting-started scripts:

- `POST {ZETARIS_REST_URL}/sql-editor/sqls/run` with a `queryId`, the SQL, the
  `SqlEditor` source, and a row limit;
- every request carries `Authorization: Bearer`, `X-Org-ID`, and a fresh
  `X-Request-ID`;
- `GET {ZETARIS_REST_URL}/datasource/datasources` lists the datasources the
  instance exposes.

Sub-agents get a `zetarisQuery` tool on top of that client: it accepts a single
read-only statement, returns rows as JSON with row and size caps, and reports
`Zetaris is not configured` when the environment is absent, so data work joins
the same task graph as file and web work.

The CLI also feeds that data layer. Terminal task runs are appended to
`user_config/task_runs.csv`; a local Zetaris bundle exposes that file as a
FILESTORE table (mounted read-only into its local file root), so the agent can
answer run-analytics questions such as failures by category through the same
tool. In other words, Zetaris records the task runs behind each morph and lets the
user ask what ran. The loop was verified locally: seeded rows were queryable, and a row the
CLI appended mid-session appeared on the next query without re-registration.

The primary verification query is committed at
`backend/sponsor/sql/zetaris_task_runs_select.sql`: it counts the task runs the
CLI has recorded, grouped by status, against the `LEOPARDCODE_RUNS.task_runs`
FILESTORE table. If the table is not registered on the target instance, the
smoke falls back to `backend/sponsor/sql/zetaris_verification_select.sql`
(`SELECT 1`), so the check still proves connectivity and authentication. Both run
through `Zetaris REST Smoke` after listing datasources, and locally:

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
report; opencode with NVIDIA Nemotron, GitHub Actions, and the scripts in
`backend/` and `docs/` was used throughout.

## Where the sponsor proof lives

| Check | Where | What it proves |
|---|---|---|
| `H-MEM Conformance` | `.github/workflows/meterless-conformance.yml` | our H-MEM engine against the pinned conformance suite (13/13; output archived at `docs/media/hmem-conformance.txt`) |
| `Zetaris REST Smoke` | `.github/workflows/sponsor-smoke.yml` | datasource listing plus the committed verification query, with a `SELECT 1` fallback when the task_runs table is not registered |

Zetaris variable names live in `.env.example`; values come from the environment
locally and GitHub Actions secrets in CI, and the job guards its live step on its
secret and reports a skip otherwise. Nemotron runs in the product with the user's
own key, and Meterless runs as the H-MEM engine with its conformance suite, so
neither needs a server-side secret.

See [sponsor_verification](../engineering/sponsor_verification.md) for the
commands and [submission](submission.md) for the deliverable checklist.
