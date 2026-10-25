# Sponsor verification

Every sponsor integration ships with a repeatable check. None of them reads a
committed credential: values come from the environment locally and from GitHub
Actions secrets in CI, and a job whose secret is missing reports a skip instead
of failing.

## NVIDIA Nemotron

The product models 2-4 run on Nemotron through the NIM endpoint
(`backend/model/model_client.py`), and `backend/sponsor/nim_client.py` exposes
the same endpoint directly.

```bash
cd backend
NVIDIA_API_KEY=... uv run python -m sponsor.smoke nemotron
```

The `Nemotron NIM Smoke` job in
[`sponsor-smoke.yml`](../../.github/workflows/sponsor-smoke.yml) runs the same
check: list the models NIM serves, pick a Nemotron id, and complete a prompt.

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

2. The H-MEM engine conformance suite, run against the engine's reference
   implementation:

   ```bash
   npx -y degit meterless/meterless/engines/hmem hmem-engine
   cd hmem-engine/reference
   npm install --no-audit --no-fund
   npm test
   HMEM_IMPL="$PWD/src/index.ts" npx tsx ../conformance/runner.ts
   ```

   Last local run against `meterless/meterless@HEAD`: reference tests 10/10,
   conformance 13/13 (exit 0). The `H-MEM Conformance` job in
   [`meterless-conformance.yml`](../../.github/workflows/meterless-conformance.yml)
   re-runs the suite on `main` changes to the sponsor package.

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

Variable names are documented in `.env.example`: `NVIDIA_API_KEY`,
`NIM_BASE_URL`, `METERLESS_BASE_URL`, `METERLESS_TOKEN`, `METERLESS_APP_ID`,
`ZETARIS_REST_URL`, `ZETARIS_API_KEY`, and `ZETARIS_ORG_ID`. Secrets stay out of
the repository.
