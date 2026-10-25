from __future__ import annotations

import uuid
from typing import Any

import httpx


class ZetarisClient:
    """Client for the documented Zetaris REST API.

    Endpoints and headers mirror the official getting-started scripts:
    Bearer API key, X-Org-ID, and a per-request X-Request-ID uuid.
    """

    def __init__(
        self, rest_url: str, api_key: str, org_id: str = "1", timeout: float = 60.0
    ) -> None:
        self.rest_url = rest_url.rstrip("/")
        self.api_key = api_key
        self.org_id = org_id
        self.timeout = timeout

    def _headers(self) -> dict[str, str]:
        return {
            "Authorization": f"Bearer {self.api_key}",
            "X-Org-ID": self.org_id,
            "X-Request-ID": str(uuid.uuid4()),
            "Content-Type": "application/json",
        }

    def _call(self, path: str, body: dict[str, Any] | None = None) -> Any:
        if body is None:
            response = httpx.get(
                f"{self.rest_url}{path}",
                headers=self._headers(),
                timeout=self.timeout,
            )
        else:
            response = httpx.post(
                f"{self.rest_url}{path}",
                headers=self._headers(),
                json=body,
                timeout=self.timeout,
            )
        response.raise_for_status()
        text = response.text.strip()
        if not text:
            return None
        return response.json()

    def datasources(self) -> Any:
        return self._call("/datasource/datasources")

    def runQuery(self, sql: str, limit: int = 20) -> list[list[Any]]:
        payload = self._call(
            "/sql-editor/sqls/run",
            {
                "queryId": str(uuid.uuid4()),
                "sql": sql,
                "source": "SqlEditor",
                "limit": limit,
            },
        )
        data = payload.get("data") if isinstance(payload, dict) else None
        return data if isinstance(data, list) else []
