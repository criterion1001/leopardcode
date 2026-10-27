# Getting started

leopardcode is a terminal-native, multi-agent coding orchestrator built around a persistent task
graph. This page gets the backend, CLI, and web workspace running on your machine. For the full
environment, Docker setup, CI, and deploy notes, see [Build & run](engineering/build_and_run.md).

## Prerequisites

| Requirement | Version | Check |
| --- | --- | --- |
| Python | ≥ 3.13 | `python3 --version` |
| Node.js | ≥ 22 | `node --version` |
| pnpm | 12.5.1 | `pnpm --version` |
| uv | latest | `uv --version` |

You need an NVIDIA API key for the planning models: pick a Nemotron model (2–4) in the CLI or web
workspace and paste your own `nvapi-…` key (from build.nvidia.com) when prompted. The web-only demo
model 6 is operator-funded via `PROVIDED_MODEL_KEY` and needs no key.

## 1. Clone and enter the repo

```bash
git clone git@github.com:includecctype/leopardcode-open-agent-hackathon-2026.git
cd leopardcode-open-agent-hackathon-2026
```

## 2. Run the backend

```bash
just backend
```

The Socket.IO gateway serves on `http://localhost:8000`; the health route is at
`/health` (no trailing slash):

```bash
curl http://localhost:8000/health
```

## 3. Open the web workspace

```bash
just web
```

Vite serves the browser workspace at `http://localhost:5173/`. It connects to the backend over
Socket.IO; point `LEOPARDCODE_BACKEND_URL` at a deployed gateway to use a remote backend instead.

## 4. Run the CLI

```bash
cd terminal && pnpm dev
```

(or `just terminal`). On first run the setup checklist walks you through the model, backend URL,
and optional Doppler config. The built binary is `dist/app.js` (`pnpm build` via tsup).

Try a live morph:

```bash
# in the CLI
/sample
```

`/sample` seeds a task graph, then five follow-up prompts morph it live — add work, add a
dependency, rename, dedupe, and drop pending work while a category keeps running. Running cards
keep their progress.

## 5. Your first session

1. Send your first message — leopardcode replies immediately with a plan of concrete, testable
   steps.
2. Send a second prompt while work is running. Watch pending cards morph: added, renamed,
   deduped, or dropped. The running card keeps its progress.
3. Keep sending prompts; when the graph drains, leopardcode reports what finished.

## Sponsor tools quick reference

| Sponsor | What it is | Where to start |
| --- | --- | --- |
| **NVIDIA Nemotron** | Models 2–4 (Nemotron via NIM) plan and execute every morph. Users bring their own NVIDIA API key; the backend holds no NVIDIA credential. | `/model` then `/key` in the CLI, or the web key prompt |
| **Meterless** | H-MEM, our local memory engine: durable preferences mined from prompts and recalled into later morphs, inspected with `/memory` | `packages/hmem/src/`; conformance suite in `meterless-conformance.yml` |
| **Zetaris** | Read-only `zetarisQuery` SQL tool for sub-agents; CLI task runs feed `user_config/task_runs.csv` as a Zetaris FILESTORE table | `python -m sponsor.smoke zetaris` |

## Environment

Required:

| Variable | Purpose |
| --- | --- |
| `LEOPARDCODE_BACKEND_URL` | Backend Socket.IO URL (default `http://localhost:8000`) |

Optional:

| Variable | Purpose |
| --- | --- |
| `PROVIDED_MODEL_KEY` | Operator-funded key for web demo model 6 |
| `WEB_SEARCH_API` | Exa key for `webSearch` / `webFetch` |
| `WEB_ALLOWED_ORIGINS` | Comma-separated browser origins allowed to connect |
| `OCI_*` | Object Storage identity, key, namespace, bucket for the web file explorer |
| `ZETARIS_REST_URL`, `ZETARIS_API_KEY`, `ZETARIS_ORG_ID` | Zetaris REST API used by `zetarisQuery` and the sponsor smoke checks |

`.env.example` (and `web/.env.example`) list every variable with blank values; the real `.env`
files are git-ignored, `docker compose` reads the backend one, and the `justfile` can inject
secrets through Doppler (`doppler run`).

## Where to go next

- [Build & run](engineering/build_and_run.md) — complete variable table, Docker, CI, deploy
- [Architecture](engineering/architecture.md) — components, runtime topology, delegation, morph path
- [Pipelines](engineering/pipelines.md) — connect, prompt queue, graph scheduling, execution, recovery
- [Terminal reference](engineering/terminal_reference.md) — every CLI command and keybinding
- [Web reference](engineering/web_reference.md) — the browser workspace
- [Sponsor verification](engineering/sponsor_verification.md) — repeatable proof for Nemotron, Meterless, Zetaris
