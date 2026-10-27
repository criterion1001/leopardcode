from __future__ import annotations

import asyncio
import logging

from ai_tool.task.emit.sub_agent import subAgentResponse
from ai_tool.task.emit.task import updateTaskDisplay
from ai_tool.task.prompt_format import buildGraphOverview, buildTaskPrompt
from ai_tool.task.task_graph import (
    buildStatusMap,
    cascadeBlocked,
    readyCategories,
)
from ai_tool.task.task_models import TaskCategory
from gateway.retry.agent_error import emitAgentError
from model.agent_session import lastTextFromResult
from systemconfig.limits import SUBAGENT_ATTEMPTS, SUBAGENT_RETRY_BACKOFF_SECONDS

logger = logging.getLogger(__name__)


async def runTaskWithRetries(
    *,
    agent_id: int,
    api_key: str,
    category_name: str,
    sid: str,
    prompt: str,
    create_sub_agent_fn,
    call_with_retry_fn,
    subagent_timeout: int,
) -> str:
    """Run one task, building a fresh sub-agent for every attempt.

    Only TimeoutError is retried: a fresh agent and thread_id avoid replaying the
    timed-out attempt's messages. Other failures surface immediately, and each
    attempt keeps the full sub-agent budget.
    """
    last_timeout: TimeoutError | None = None
    for attempt in range(1, SUBAGENT_ATTEMPTS + 1):
        sub_agent = create_sub_agent_fn(agent_id=agent_id, api_key=api_key, sid=sid)
        try:
            result = await call_with_retry_fn(
                lambda agent=sub_agent: agent.ainvoke(prompt),
                timeout=subagent_timeout,
            )
            return lastTextFromResult(result)
        except TimeoutError as exc:
            last_timeout = exc
            logger.warning(
                "Sub-agent timed out in category '%s' (attempt %d/%d)",
                category_name,
                attempt,
                SUBAGENT_ATTEMPTS,
            )
            if attempt >= SUBAGENT_ATTEMPTS:
                break
            await asyncio.sleep(SUBAGENT_RETRY_BACKOFF_SECONDS)

    if last_timeout is None:
        raise RuntimeError("retry loop exited without a result or a timeout")
    raise last_timeout


async def runCategory(
    category: TaskCategory,
    sid: str,
    connected_users: dict,
    create_sub_agent_fn,
    call_with_retry_fn,
    subagent_timeout: int,
) -> None:
    """
    Run all tasks in a category sequentially.
    Each task gets a fresh sub-agent.
    On failure, remaining tasks and the category are marked failed.
    """
    user = connected_users.get(sid)
    if user is None:
        return

    for index, item in enumerate(category.tasks):
        item.status = "running"
        await updateTaskDisplay(sid, connected_users)

        graph_overview = buildGraphOverview(
            user.pending_categories,
            user.running_categories,
            user.completed_categories,
        )
        prompt = buildTaskPrompt(
            category=category,
            task_index=index,
            completed=user.completed_categories,
            last_user_request=user.last_user_request,
            graph_overview=graph_overview,
        )

        try:
            content = await runTaskWithRetries(
                agent_id=user.main_agent.agent_id,
                api_key=user.api_key,
                category_name=category.name,
                sid=sid,
                prompt=prompt,
                create_sub_agent_fn=create_sub_agent_fn,
                call_with_retry_fn=call_with_retry_fn,
                subagent_timeout=subagent_timeout,
            )
            item.result = content
            item.status = "done"
            await updateTaskDisplay(sid, connected_users)
            await subAgentResponse(sid, category.name, "done", content)
        except Exception as exc:  # noqa: BLE001
            logger.error("Task failed in category '%s': %s", category.name, exc)
            item.status = "failed"
            # Mark remaining tasks as failed
            for remaining in category.tasks[index + 1 :]:
                remaining.status = "failed"
            category.status = "failed"
            if isinstance(exc, TimeoutError):
                message = (
                    f"Sub-agent timed out after {subagent_timeout}s "
                    f"({SUBAGENT_ATTEMPTS} attempts)"
                )
            else:
                message = f"Sub-agent model failed: {exc}"
            await emitAgentError(sid, message)
            await updateTaskDisplay(sid, connected_users)
            await subAgentResponse(sid, category.name, "failed", message)
            return

    category.status = "done"
    await updateTaskDisplay(sid, connected_users)


async def runTaskGraph(
    sid: str,
    connected_users: dict,
    create_sub_agent_fn,
    call_with_retry_fn,
    subagent_timeout: int,
) -> dict[str, list[str]]:
    """
    Event-driven DAG scheduler.
    Loop: cascadeBlocked → readyCategories → create_task per ready → wait(FIRST_COMPLETED) → drain.
    Returns per-pass stats: category names that are done / failed / blocked.
    """
    user = connected_users.get(sid)
    if user is None:
        return {"done": [], "failed": [], "blocked": []}

    running_tasks: dict[asyncio.Task, TaskCategory] = {}
    stats: dict[str, list[str]] = {"done": [], "failed": [], "blocked": []}

    try:
        while True:
            status_map = buildStatusMap(
                user.pending_categories,
                user.running_categories,
                user.completed_categories,
            )

            newly_blocked, user.pending_categories = cascadeBlocked(
                user.pending_categories, status_map
            )
            if newly_blocked:
                for cat in newly_blocked:
                    stats["blocked"].append(cat.name)
                    user.completed_categories.append(cat)
                status_map = buildStatusMap(
                    user.pending_categories,
                    user.running_categories,
                    user.completed_categories,
                )

            ready = readyCategories(user.pending_categories, status_map)

            for cat in ready:
                user.pending_categories.remove(cat)
                cat.status = "running"
                user.running_categories.append(cat)
                task = asyncio.create_task(
                    runCategory(
                        cat,
                        sid,
                        connected_users,
                        create_sub_agent_fn,
                        call_with_retry_fn,
                        subagent_timeout,
                    )
                )
                running_tasks[task] = cat

            await updateTaskDisplay(sid, connected_users)

            if not running_tasks:
                # No running tasks — check if there is still pending work
                if not user.pending_categories:
                    break
                # Pending exists but nothing ready (all blocked or waiting) — break
                ready_check = readyCategories(
                    user.pending_categories,
                    buildStatusMap(
                        user.pending_categories,
                        user.running_categories,
                        user.completed_categories,
                    ),
                )
                if not ready_check:
                    break
                continue

            done, _ = await asyncio.wait(running_tasks.keys(), return_when=asyncio.FIRST_COMPLETED)

            for finished_task in done:
                cat = running_tasks.pop(finished_task)
                crashed = finished_task.cancelled() or finished_task.exception() is not None
                if crashed and cat.status == "running":
                    # Unexpected runCategory crash: fail instead of hanging the graph.
                    cat.status = "failed"
                    for item in cat.tasks:
                        if item.status in ("pending", "running"):
                            item.status = "failed"
                    if isinstance(finished_task, asyncio.Task) and not finished_task.cancelled():
                        exc = finished_task.exception()
                        logger.error(
                            "Category '%s' crashed before completing: %s",
                            cat.name,
                            exc,
                            exc_info=(type(exc), exc, exc.__traceback__) if exc else None,
                        )
                user.running_categories.remove(cat)
                user.completed_categories.append(cat)
                if cat.status in ("done", "failed"):
                    stats[cat.status].append(cat.name)
    finally:
        # A cancelled pass (e.g. on disconnect) must not leave sub-agent calls running.
        for task in running_tasks:
            task.cancel()

    # Result excerpts are built by the caller from these stats, so results are
    # reported only for the categories that ran in this pass.
    return stats
