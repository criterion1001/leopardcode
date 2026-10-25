from __future__ import annotations

import httpx

DEFAULT_NEMOTRON_MODEL = "nvidia/nemotron-3.5-lightning-30b-a3b"


class NemotronClient:
    """OpenAI-compatible client for the NVIDIA NIM endpoint (build.nvidia.com)."""

    def __init__(self, api_key: str, base_url: str, timeout: float = 60.0) -> None:
        self.api_key = api_key
        self.base_url = base_url.rstrip("/")
        self.timeout = timeout

    def _headers(self) -> dict[str, str]:
        return {
            "Authorization": f"Bearer {self.api_key}",
            "Content-Type": "application/json",
        }

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

    def pickNemotronModel(self, model_ids: list[str]) -> str:
        for prefix in ("nvidia/nemotron", "nvidia/"):
            for model_id in model_ids:
                if model_id.startswith(prefix):
                    return model_id
        if model_ids:
            return model_ids[0]
        return DEFAULT_NEMOTRON_MODEL

    def chatCompletion(
        self,
        model: str,
        messages: list[dict[str, str]],
        max_tokens: int = 64,
    ) -> str:
        response = httpx.post(
            f"{self.base_url}/chat/completions",
            headers=self._headers(),
            json={
                "model": model,
                "messages": messages,
                "max_tokens": max_tokens,
                "temperature": 0.0,
            },
            timeout=self.timeout,
        )
        response.raise_for_status()
        payload = response.json()
        choices = payload.get("choices", []) if isinstance(payload, dict) else []
        if not choices:
            return ""
        message = choices[0].get("message", {}) if isinstance(choices[0], dict) else {}
        content = message.get("content") or message.get("reasoning_content") or ""
        return str(content).strip()
