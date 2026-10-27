# leopardcode documentation

**leopardcode is real-time task morphing for coding agents.** A main orchestrator
agent keeps one **persistent task graph** per session. A new prompt reshapes the
pending graph in place — add, remove, rename/rescope, dedupe, rewire — while
running categories continue untouched. Categories run in parallel as soon as
their `depends_on` dependencies finish; tasks inside a category run sequentially.
The morph is the differentiator; the persistent graph is its substrate.

The top-level [`AGENTS.md`](../AGENTS.md) holds the working agreement; this
folder is the reference documentation for leopardcode, built for the
**Open Agent Hackathon 2026**.

## Engineering (how it works)

| Note | Covers |
|---|---|
| [getting_started](getting_started.md) | First run: backend, CLI, and web workspace |
| [task_morphing](engineering/task_morphing.md) | Real-time task morphing: operations, invariants, call path, verification |
| [architecture](engineering/architecture.md) | Components, runtime topology, delegation, deployment |
| [tech_stack](engineering/tech_stack.md) | Exact languages, frameworks, and tooling |
| [data_model](engineering/data_model.md) | Categories/tasks/statuses, session memory, wire DTOs, on-disk config |
| [pipelines](engineering/pipelines.md) | Connect, prompt queue, graph scheduling, execution, display, recovery |
| [socket_protocol](engineering/socket_protocol.md) | Every Socket.IO event and payload, both directions |
| [ai_tools](engineering/ai_tools.md) | Every agent tool, its signature, and where it runs |
| [backend_reference](engineering/backend_reference.md) | Module-by-module backend map |
| [terminal_reference](engineering/terminal_reference.md) | Module-by-module CLI map, commands, keybindings |
| [web_reference](engineering/web_reference.md) | Browser workspace, storage panes, build and deploy |
| [build_and_run](engineering/build_and_run.md) | Setup, environment, Docker, CI, deploy |
| [sponsor_verification](engineering/sponsor_verification.md) | Repeatable proof for the Nemotron, Meterless, and Zetaris integrations |
| [memory_engine](engineering/memory_engine.md) | H-MEM (Meterless) engine: record schema, ranking, trust ledger, conformance |

## Product (why)

| Note | Covers |
|---|---|
| [problem](product/problem.md) | Why plans freeze: the missing capability is live morphing |
| [solution](product/solution.md) | Real-time task morphing, its invariants, and how it is dispatched |
| [user_workflows](product/user_workflows.md) | What you can do because the plan morphs |
| [competition_analysis](product/competition_analysis.md) | leopardcode vs. other agentic coding tools |
| [business_value](product/business_value.md) | The value case, derived from the product's capabilities |
| [submission](product/submission.md) | Open Agent Hackathon 2026 submission checklist |
| [integration_writeup](product/integration_writeup.md) | How the sponsor technologies are integrated, and the proof that ships with each |

## Hackathon (Open Agent Hackathon 2026)

| Note | Covers |
|---|---|
| [overview](hackathon/overview.md) | Event facts, key dates, sponsors, community |
| [official_rules](hackathon/official_rules.md) | The 10 official rule sections |
| [tracks_and_prizes](hackathon/tracks_and_prizes.md) | Challenge tracks, prize pool, scoring rubric |
| [faq](hackathon/faq.md) | FAQ, judges and mentors roster |

## The system in one paragraph

The backend (`backend/`) is a Python 3.13 `python-socketio` ASGI app. Per
connected client it holds a `ConnectedUserMemory` with the main agent
(LangChain `create_agent`), the pending/running/completed category graph, and
history. One prompt worker per session turns incoming prompts into planning
turns; each turn morphs the pending graph and task-graph execution runs in a
detached background pass, so a new prompt is planned immediately and its
categories join the running pass. The CLI
(`terminal/`) and web workspace (`web/`) render the same Ink UI; file/shell
tools are forwarded to the CLI and executed on the user's machine, while web
sessions run those tools server-side against the session's OCI Object Storage
folder. Only `webSearch`/`webFetch` always run on the backend.
