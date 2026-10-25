from __future__ import annotations

import sys
from pathlib import Path

import httpx

from sponsor import config
from sponsor.meterless_client import MeterlessClient
from sponsor.zetaris_client import ZetarisClient

READY_PROMPT = "Reply with the single word: ready"
VERIFICATION_SQL_PATH = Path(__file__).with_name("sql") / "zetaris_verification_select.sql"


def smokeMeterless() -> int:
    token = config.meterlessToken()
    if not token:
        print("meterless: METERLESS_TOKEN is not set")
        return 1
    client = MeterlessClient(
        config.meterlessBaseUrl(),
        token,
        config.meterlessAppId(),
    )
    state = client.status()
    print(f"meterless: status {state} at {client.base_url}")
    if state != "online":
        return 1
    try:
        reply = client.chat(READY_PROMPT)
    except httpx.HTTPError as error:
        print(f"meterless: chat failed: {error}")
        return 1
    if not reply:
        print("meterless: chat returned an empty reply")
        return 1
    print(f"meterless: ok - replied {reply[:80]!r}")
    return 0


def smokeZetaris() -> int:
    api_key = config.zetarisApiKey()
    if not api_key:
        print("zetaris: ZETARIS_API_KEY is not set")
        return 1
    client = ZetarisClient(config.zetarisRestUrl(), api_key, config.zetarisOrgId())
    verification_sql = VERIFICATION_SQL_PATH.read_text(encoding="utf-8").strip()
    try:
        client.datasources()
        rows = client.runQuery(verification_sql, limit=1)
    except httpx.HTTPError as error:
        print(f"zetaris: request failed: {error}")
        return 1
    if not rows:
        print("zetaris: verification query returned no rows")
        return 1
    print(f"zetaris: ok - verification query returned {len(rows)} row(s) at {client.rest_url}")
    return 0


SMOKE_TARGETS = {
    "meterless": smokeMeterless,
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
