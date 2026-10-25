from __future__ import annotations

import os
import uuid
from typing import Any

from langchain.agents import create_agent
from langchain.agents.middleware import ToolErrorMiddleware
from langchain_core.language_models import BaseChatModel
from langgraph.checkpoint.memory import InMemorySaver

from model.agent_session import AgentSession
from sponsor.config import nemotronApiKey, nemotronBaseUrl

# Cache models by (agent_id, api_key) to avoid rebuilding on every sub-agent creation
model_cache: dict[tuple[int, str], BaseChatModel] = {}

NEMOTRON_MODELS = {
    2: "nvidia/nemotron-3.5-super-vl-120b-a12b",
    3: "nvidia/nemotron-3.5-lightning-30b-a3b",
    4: "nvidia/nemotron-3-ultra-550b-a55b",
}

DEEPSEEK_MODEL = "deepseek-flash"

# Model 6 is "provided" and web-only: the operator funds it, so its key comes
# from the environment instead of the client, and the funded key is never sent
# to clients.
PROVIDED_AGENT_ID = 6
PROVIDED_MODEL_ENV = "PROVIDED_MODEL_KEY"


def providedModelKey() -> str:
    key = os.getenv(PROVIDED_MODEL_ENV, "").strip()
    if not key:
        raise ValueError(f"{PROVIDED_MODEL_ENV} is not set")
    return key


def validModelId(agent_id: int) -> bool:
    return agent_id in NEMOTRON_MODELS or agent_id == PROVIDED_AGENT_ID


def fundedModelKey(agent_id: int) -> str:
    """Resolve the operator-funded key for a model that needs no client key."""
    if agent_id == PROVIDED_AGENT_ID:
        return providedModelKey()
    if agent_id in NEMOTRON_MODELS:
        key = nemotronApiKey()
        if not key:
            raise ValueError("NVIDIA_API_KEY is not set")
        return key
    raise ValueError(f"Invalid agent_id: {agent_id}")


def initModel(agent_id: int, api_key: str) -> BaseChatModel:
    if not validModelId(agent_id):
        raise ValueError(f"Invalid agent_id: {agent_id}")
    api_key = fundedModelKey(agent_id)

    cache_key = (agent_id, api_key)
    if cache_key in model_cache:
        return model_cache[cache_key]

    from langchain.chat_models import init_chat_model

    if agent_id in NEMOTRON_MODELS:
        model = init_chat_model(
            model=NEMOTRON_MODELS[agent_id],
            model_provider="openai",
            api_key=api_key,
            base_url=nemotronBaseUrl(),
        )
    else:
        model = init_chat_model(model=DEEPSEEK_MODEL, model_provider="deepseek", api_key=api_key)

    model_cache[cache_key] = model
    return model


def toolErrorMiddleware() -> ToolErrorMiddleware:
    """Convert any tool exception into a string the model can recover from."""

    def on_error(exc: Exception, request: Any) -> str:
        return (
            f"Tool failed: {type(exc).__name__}: {exc}. "
            "Adjust inputs and retry once, or report the failure to the user and continue."
        )

    async def aon_error(exc: Exception, request: Any) -> str:
        return on_error(exc, request)

    return ToolErrorMiddleware(on_error=on_error, aon_error=aon_error)


def buildAgent(
    agent_id: int,
    api_key: str,
    tools: list[Any],
    system_prompt: str,
    thread_id: str | None = None,
) -> AgentSession:
    model = initModel(agent_id, api_key)
    checkpointer = InMemorySaver()
    tid = thread_id or str(uuid.uuid4())

    agent = create_agent(
        model=model,
        tools=tools,
        checkpointer=checkpointer,
        system_prompt=system_prompt,
        middleware=[toolErrorMiddleware()],
    )
    return AgentSession(agent=agent, thread_id=tid)
