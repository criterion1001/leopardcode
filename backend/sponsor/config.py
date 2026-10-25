from __future__ import annotations

import os


def envValue(name: str, default: str = "") -> str:
    value = os.getenv(name, "").strip()
    return value if value else default


def zetarisRestUrl() -> str:
    return envValue("ZETARIS_REST_URL", "http://localhost:8888/api/v1.0").rstrip("/")


def zetarisApiKey() -> str:
    return envValue("ZETARIS_API_KEY")


def zetarisOrgId() -> str:
    return envValue("ZETARIS_ORG_ID", "1")
