# Sponsor verification

Meterless and Zetaris ship with repeatable automated checks; Nemotron is
exercised by the product path with the user's own key. No committed credential
is read: values come from the environment locally and from GitHub Actions
secrets in CI, and a job whose secret is missing reports a skip instead of
failing.

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

Two checks cover the hotspot:

1. The hotspot contract — status from `GET /v1/models`, then one chat round trip
   with the `meterless-app` and `meterless-scope: user` headers:

   ```bash
   cd backend
   METERLESS_TOKEN=... uv run python -m sponsor.smoke meterless
   ```

   The `Meterless Hotspot Smoke` job in
   [`sponsor-smoke.yml`](../../.github/workflows/sponsor-smoke.yml) runs it
   against a configured runtime.

2. The H-MEM engine conformance suite, run against the engine implemented in
   this repository (`terminal/src/memory/index.ts`):

   ```bash
   npx -y degit meterless/meterless/engines/hmem#1742dec56a66e58eef9dda2d2b865823758ca8cd hmem-engine
   cd hmem-engine/reference
   npm install --no-audit --no-fund
   HMEM_IMPL=/abs/path/to/leopardcode/terminal/src/memory/index.ts npx tsx ../conformance/runner.ts
   ```

   Last local run against the pinned spec (`1742dec`): 13/13 checks, exit 0. The
   `H-MEM Conformance` job in
   [`meterless-conformance.yml`](../../.github/workflows/meterless-conformance.yml)
   runs the same command on pull requests that touch the engine and on `main`.

The engine's first product feature is project memory in the CLI: durable
preferences are mined into `user_config/memory`, recalled into later prompts,
and inspected with `/memory` (see [terminal_reference](terminal_reference.md)).

## Zetaris

Queries go through the documented REST API (`/sql-editor/sqls/run` with a
Bearer key, `X-Org-ID`, and a per-request `X-Request-ID`). The verification
query is committed at `backend/sponsor/sql/zetaris_verification_select.sql`.

```bash
cd backend
ZETARIS_REST_URL=... ZETARIS_API_KEY=... ZETARIS_ORG_ID=... uv run python -m sponsor.smoke zetaris
```

The `Zetaris REST Smoke` job in
[`sponsor-smoke.yml`](../../.github/workflows/sponsor-smoke.yml) lists the
datasources and runs the committed query.

## Configuration

Variable names are documented in `.env.example`: `METERLESS_BASE_URL`,
`METERLESS_TOKEN`, `METERLESS_APP_ID`, `ZETARIS_REST_URL`, `ZETARIS_API_KEY`, and
`ZETARIS_ORG_ID`. Secrets stay out of the repository.
