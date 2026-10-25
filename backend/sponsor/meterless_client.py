from __future__ import annotations

import httpx


class MeterlessClient:
    """Client for the Meterless local hotspot (OpenAI-compatible proxy).

    Status follows the Meterless provider contract: GET /v1/models decides
    online (200 with meterless/* model ids), unauthorized (401/403), or
    offline (runtime unreachable).
    """

    def __init__(self, base_url: str, token: str, app_id: str, timeout: float = 180.0) -> None:
        self.base_url = self._normalizeBaseUrl(base_url)
        self.token = token
        self.app_id = app_id
        self.timeout = timeout

    @staticmethod
    def _normalizeBaseUrl(base_url: str) -> str:
        normalized = base_url.strip().rstrip("/")
        if not normalized.endswith("/v1"):
            normalized = f"{normalized}/v1"
        return normalized

    def _headers(self, scope: str | None = None) -> dict[str, str]:
        headers = {
            "Authorization": f"Bearer {self.token}",
            "meterless-app": self.app_id,
            "Content-Type": "application/json",
        }
        if scope:
            headers["meterless-scope"] = scope
        return headers

    def models(self) -> list[str]:
        response = httpx.get(
            f"{self.base_url}/models",
            headers=self._headers(),
            timeout=self.timeout,
        )
        response.raise_for_status()
        payload = response.json()
        data = payload.get("data", []) if isinstance(payload, dict) else []
        return [
            item["id"]
            for item in data
            if isinstance(item, dict) and isinstance(item.get("id"), str)
        ]

    def status(self) -> str:
        try:
            response = httpx.get(
                f"{self.base_url}/models",
                headers=self._headers(),
                timeout=self.timeout,
            )
        except httpx.HTTPError:
            return "offline"
        if response.status_code in (401, 403):
            return "unauthorized"
        if response.status_code != 200:
            return "offline"
        try:
            payload = response.json()
        except ValueError:
            return "unexpected"
        data = payload.get("data", []) if isinstance(payload, dict) else []
        model_ids = [
            item["id"]
            for item in data
            if isinstance(item, dict) and isinstance(item.get("id"), str)
        ]
        if any(model_id.startswith("meterless/") for model_id in model_ids):
            return "online"
        return "unexpected"

    def chat(self, prompt: str, model: str = "meterless/auto", max_tokens: int = 64) -> str:
        response = httpx.post(
            f"{self.base_url}/chat/completions",
            headers=self._headers(scope="user"),
            json={
                "model": model,
                "messages": [{"role": "user", "content": prompt}],
                "max_tokens": max_tokens,
            },
            timeout=self.timeout,
        )
        response.raise_for_status()
        payload = response.json()
        choices = payload.get("choices", []) if isinstance(payload, dict) else []
        if not choices:
            return ""
        message = choices[0].get("message", {}) if isinstance(choices[0], dict) else {}
        return str(message.get("content") or "").strip()
