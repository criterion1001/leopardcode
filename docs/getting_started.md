# Getting started

leopardcode is a terminal-native, multi-agent coding orchestrator built around a persistent task
graph. This page gets the backend, CLI, and web workspace running on your machine. For the full
environment and Docker setup, see [Build & run](#/build-and-run).

## Prerequisites

| Requirement | Version | Check |
| --- | --- | --- |
| Python | ≥ 3.11 | `python3 --version` |
| Node.js | ≥ 22 | `node --version` |
| pnpm | ≥ 10 | `pnpm --version` |
| uv | latest | `uv --version` |

You also need a model key: pick a Nemotron model in the CLI or web workspace and
paste your own NVIDIA API key (`nvapi-…` from build.nvidia.com) when prompted.
The web-only demo model 6 needs `PROVIDED_MODEL_KEY` on the backend instead (see
[Environment](#environment)). A Doppler service token is optional if you want
config pulled from Doppler (`doppler setup` after installing the CLI).

## 1. Clone and enter the repo

```bash
git clone git@github.com:includecctype/leopardcode.git
cd leopardcode
```

## 2. Run the backend

```bash
just backend-run
```

The backend serves the Socket.IO gateway on `http://localhost:5000` and the health route on
`/health/`. Open `http://localhost:5000/health/` to confirm it is up.

## 3. Open the web workspace

```bash
just web-run
```

Vite serves the browser workspace at `http://localhost:5173/` and proxies `/socket.io/` to the
backend. Use the arrow keys to move, `i` to open the input, `f` to toggle the file tree, `g` to
open the task graph, and `Escape` to leave a pane.

## 4. Run the CLI

```bash
leopardcode start
```

- Prompt naturally and workstreams as tasks arrive — the workspace reshapes its task graph while
  your project updates in real time.
- Try `/sample` to load a predefined task graph.

On a first run, `leopardcode start` walks you through a setup checklist (model, Doppler, backend
URL, hooks).

## 5. Your first session

1. Send your first message — leopardcode replies immediately with a plan of concrete, testable
   steps.
2. As tasks complete, the graph reshapes: cancelled work disappears, new tasks arrive.
3. Keep sending prompts; when the graph drains, leopardcode reports what finished.

## Environment

Required:

| Variable | Purpose |
| --- | --- |
| `LEOPARDCODE_BACKEND_URL` | Backend base URL (CLI and web both honor it) |
| `PROVIDED_MODEL_KEY` | Operator-funded key for web demo model 6 (optional when every client brings its own Nemotron key) |

Optional:

| Variable | Purpose |
| --- | --- |
| `WEB_SEARCH_API` | Exa key for `webSearch` / `webFetch` |
| `WEB_ALLOWED_ORIGINS` | Comma-separated browser origins allowed to connect |
| `OCI_*` | Object Storage identity, key, namespace, and bucket for the web file explorer |
| `ZETARIS_REST_URL` / `ZETARIS_API_KEY` / `ZETARIS_ORG_ID` | Zetaris REST API used by the sponsor smoke checks |

`.env.example` (and `web/.env.example`) list every variable with blank values;
the real `.env` files are git-ignored, `docker compose` reads the backend one,
and the `justfile` can inject secrets through Doppler (`doppler run`). See
[Build & run](#/build-and-run) for the complete variable table and the Docker
workflows.

## Where to go next

- [Build & run](#/build-and-run) — environment, Docker, CI, deploy
- [Architecture](#/architecture) — components, runtime topology, delegation
- [Pipelines](#/pipelines) — connect, prompt queue, graph scheduling, execution
- [Terminal reference](#/terminal-reference) — every CLI command and keybinding
- [Web reference](#/web-reference) — the browser workspace
