from __future__ import annotations

import sys
from pathlib import Path

import httpx

from sponsor import config
from sponsor.zetaris_client import ZetarisClient

VERIFICATION_SQL_PATH = Path(__file__).with_name("sql") / "zetaris_verification_select.sql"
TASK_RUNS_SQL_PATH = Path(__file__).with_name("sql") / "zetaris_task_runs_select.sql"


def smokeZetaris() -> int:
    api_key = config.zetarisApiKey()
    if not api_key:
        print("zetaris: ZETARIS_API_KEY is not set")
        return 1
    client = ZetarisClient(config.zetarisRestUrl(), api_key, config.zetarisOrgId())
    try:
        client.datasources()
    except httpx.HTTPError as error:
        print(f"zetaris: request failed: {error}")
        return 1
    real_sql = TASK_RUNS_SQL_PATH.read_text(encoding="utf-8").strip()
    fallback_sql = VERIFICATION_SQL_PATH.read_text(encoding="utf-8").strip()
    try:
        rows = client.runQuery(real_sql, limit=1)
        print(f"zetaris: ok - task_runs query returned {len(rows)} row(s) at {client.rest_url}")
        return 0
    except httpx.HTTPError as error:
        print(f"zetaris: task_runs query unavailable ({error}); falling back to connectivity check")
    try:
        rows = client.runQuery(fallback_sql, limit=1)
    except httpx.HTTPError as error:
        print(f"zetaris: request failed: {error}")
        return 1
    if not rows:
        print("zetaris: verification query returned no rows")
        return 1
    print(f"zetaris: ok - connectivity verified ({len(rows)} row(s)) at {client.rest_url}")
    return 0


SMOKE_TARGETS = {
    "zetaris": smokeZetaris,
}


def main(argv: list[str]) -> int:
    if len(argv) != 1 or argv[0] not in SMOKE_TARGETS:
        targets = "|".join(sorted(SMOKE_TARGETS))
        print(f"usage: python -m sponsor.smoke <{targets}>")
        return 2
    return SMOKE_TARGETS[argv[0]]()


if __name__ == "__main__":
    raise SystemExit(main(sys.argv[1:]))
