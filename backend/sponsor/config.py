from __future__ import annotations

import os


def envValue(name: str, default: str = "") -> str:
    value = os.getenv(name, "").strip()
    return value if value else default


def nemotronApiKey() -> str:
    return envValue("NVIDIA_API_KEY")


def nemotronBaseUrl() -> str:
    return envValue("NIM_BASE_URL", "https://integrate.api.nvidia.com/v1").rstrip("/")


def meterlessBaseUrl() -> str:
    return envValue("METERLESS_BASE_URL", "http://127.0.0.1:8088/v1")


def meterlessToken() -> str:
    return envValue("METERLESS_TOKEN")


def meterlessAppId() -> str:
    return envValue("METERLESS_APP_ID", "leopardcode")


def zetarisRestUrl() -> str:
    return envValue("ZETARIS_REST_URL", "http://localhost:8888/api/v1.0").rstrip("/")


def zetarisApiKey() -> str:
    return envValue("ZETARIS_API_KEY")


def zetarisOrgId() -> str:
    return envValue("ZETARIS_ORG_ID", "1")
