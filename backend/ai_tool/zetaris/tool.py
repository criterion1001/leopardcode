"""Zetaris tools — read-only SQL against the team's data platform."""

from __future__ import annotations

import asyncio
import json
import re

from langchain_core.tools import tool

from sponsor.config import zetarisApiKey, zetarisOrgId, zetarisRestUrl
from sponsor.zetaris_client import ZetarisClient
from systemconfig.limits import TOOL_TIMEOUT_SECONDS

MAX_ROWS = 50
MAX_OUTPUT_CHARS = 20000

READ_ONLY_START = re.compile(r"(?is)^\s*(select|with)\b")
WRITE_KEYWORDS = re.compile(
    r"\b(insert|update|delete|merge|drop|alter|create|truncate|grant|revoke|copy|call|vacuum|analyze)\b",
    re.IGNORECASE,
)


def readOnlyStatement(sql: str) -> str:
    """Return the trimmed statement or raise when it is not a single read-only query."""
    statement = sql.strip()
    if not statement:
        raise ValueError("empty SQL statement")
    if statement.endswith(";"):
        statement = statement[:-1].strip()
    if ";" in statement:
        raise ValueError("only a single statement is allowed")
    if not READ_ONLY_START.match(statement):
        raise ValueError("only SELECT or WITH statements are allowed")
    if WRITE_KEYWORDS.search(statement):
        raise ValueError("only read-only SQL is allowed")
    return statement


@tool
async def zetarisQuery(sql: str) -> str:
    """Run a read-only SQL query against the team's Zetaris data platform.

    Use it when a task needs data that lives in Zetaris (tables, views, or files
    registered there). Returns the rows as JSON. Only SELECT or WITH statements
    are accepted; results are capped.

    Args:
        sql: A single read-only SQL statement
    """
    if not zetarisApiKey():
        return "Error: Zetaris is not configured (set ZETARIS_REST_URL and ZETARIS_API_KEY)"

    try:
        statement = readOnlyStatement(sql)
    except ValueError as error:
        return f"Error: {error}"

    client = ZetarisClient(zetarisRestUrl(), zetarisApiKey(), zetarisOrgId())
    try:
        rows = await asyncio.wait_for(
            asyncio.to_thread(client.runQuery, statement, MAX_ROWS),
            timeout=TOOL_TIMEOUT_SECONDS,
        )
    except TimeoutError:
        return f"Zetaris error: timed out after {TOOL_TIMEOUT_SECONDS}s"
    except Exception as error:  # noqa: BLE001
        return f"Zetaris error: {error}"

    payload = json.dumps(rows, ensure_ascii=False, default=str)
    if len(payload) > MAX_OUTPUT_CHARS:
        payload = f"{payload[:MAX_OUTPUT_CHARS]}... (truncated)"
    return payload
