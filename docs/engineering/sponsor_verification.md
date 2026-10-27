# Sponsor verification

Meterless and Zetaris ship with repeatable automated checks; Nemotron is
exercised by the product path with the user's own key. Every check is tied to the
real-time task morph loop: Nemotron plans the morph, H-MEM informs the next morph,
and Zetaris records the task runs behind it. No committed credential is read:
values come from the environment locally and from GitHub Actions secrets in CI,
and a job whose secret is missing reports a skip instead of failing.

## NVIDIA Nemotron

The product models 2-4 run on Nemotron through the NIM endpoint
(`backend/model/model_client.py`) using the NVIDIA API key the user enters in the
CLI or web workspace. There is no server-side NVIDIA key.

```bash
cd backend
uv run main.py
```

Then pick a Nemotron model in the client and paste your `nvapi-...` key when
prompted. The connect handler rejects a Nemotron model without a key, and every
planning and execution turn runs on the selected model.

## Meterless

The H-MEM engine conformance suite runs against the engine implemented in this
repository (`packages/hmem/src/index.ts`):

```bash
npx -y degit meterless/meterless/engines/hmem#1742dec56a66e58eef9dda2d2b865823758ca8cd hmem-engine
cd hmem-engine/reference
npm install --no-audit --no-fund
HMEM_IMPL=/abs/path/to/leopardcode/packages/hmem/src/index.ts npx tsx ../conformance/runner.ts
```

The pinned-spec run is archived at [`docs/media/hmem-conformance.txt`](../../media/hmem-conformance.txt)
(13/13 checks passed). The `H-MEM Conformance` job in
[`meterless-conformance.yml`](../../.github/workflows/meterless-conformance.yml)
runs the same command on pull requests that touch the engine and on `main`.

The engine's first product feature is project memory in the CLI: durable
preferences are mined into `user_config/memory`, recalled into later prompts,
and inspected with `/memory` (see [terminal_reference](terminal_reference.md)).

## Zetaris

Queries go through the documented REST API (`/sql-editor/sqls/run` with a
Bearer key, `X-Org-ID`, and a per-request `X-Request-ID`).

The primary verification query is committed at
`backend/sponsor/sql/zetaris_task_runs_select.sql`: it counts the task runs the
CLI has recorded, grouped by status, against the `LEOPARDCODE_RUNS.task_runs`
FILESTORE table. If the table is not registered on the target instance, the
smoke falls back to `backend/sponsor/sql/zetaris_verification_select.sql`
(`SELECT 1`) so the check still proves connectivity and authentication.

```bash
cd backend
ZETARIS_REST_URL=... ZETARIS_API_KEY=... ZETARIS_ORG_ID=... uv run python -m sponsor.smoke zetaris
```

The `Zetaris REST Smoke` job in
[`sponsor-smoke.yml`](../../.github/workflows/sponsor-smoke.yml) lists the
datasources and runs the committed query.

In the product, sub-agents call the `zetarisQuery` tool for read-only SQL; it
uses the same environment and returns `Zetaris is not configured` when the
credentials are absent.

### Task-run table (local instance)

The CLI writes terminal task runs to `<project>/user_config/task_runs.csv`. A
local Zetaris bundle exposes that file through its restricted local file root
(`ZETARIS_LOCAL_FILE_SYSTEM_ROOT_PATH`, for example
`/home/zetaris/customer-data/shared`):

1. Mount only the CSV into the API and driver containers; never mount the whole
   project folder, because `config.json` holds model keys:

   ```yaml
   services:
     api:
       volumes:
         - /path/to/project/user_config/task_runs.csv:/home/zetaris/customer-data/shared/task_runs.csv:ro
     driver:
       volumes:
         - /path/to/project/user_config/task_runs.csv:/home/zetaris/customer-data/shared/task_runs.csv:ro
   ```

2. Register and query the table (the qualified name is required):

   ```sql
   CREATE LIGHTNING DATABASE LEOPARDCODE_RUNS DESCRIBE BY "leopardcode task runs";
   CREATE LIGHTNING FILESTORE TABLE task_runs FROM LEOPARDCODE_RUNS FORMAT CSV
   OPTIONS (PATH "/home/zetaris/customer-data/shared/task_runs.csv",
            header "true", inferSchema "true");
   ```

   The create and analytics statements are committed at
   `backend/sponsor/sql/zetaris_task_runs_create.sql` and
   `backend/sponsor/sql/zetaris_task_runs_select.sql`.

3. Paths outside that root, relative paths, and `file://` URIs are rejected
   with `Invalid file path to access`.

Verified locally on 2026-10-26 against the Docker bundle: the smoke returned one
row, the FILESTORE table served the seeded rows, and a row appended by the CLI
appeared on the next query without re-registration. The `Zetaris REST Smoke` CI
job stays skipped because a local instance is not reachable from GitHub Actions.

![Zetaris SQL Workspace showing task-run counts](../media/zetaris-verification.png)

## Configuration

Variable names are documented in `.env.example`: `ZETARIS_REST_URL`,
`ZETARIS_API_KEY`, and `ZETARIS_ORG_ID`. Secrets stay out of the repository.
