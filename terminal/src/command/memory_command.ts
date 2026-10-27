import type { MemoryRecord } from "../../../packages/hmem/src";
import { forgetMemory, recentMemories, searchMemories } from "../session/project_memory";

function formatMemory(record: MemoryRecord): string {
  const layer = record.layer === "long_term" ? "LT" : record.layer === "working" ? "WK" : "ST";
  return `[${layer} ${record.id} conf=${record.confidence.toFixed(2)}] ${record.content}`;
}

export function isMemoryCommand(input: string): boolean {
  const trimmed = input.trim();
  return trimmed === "/memory" || trimmed.startsWith("/memory ");
}

export function runMemoryCommand(input: string): string[] {
  const parts = input.trim().split(/\s+/);
  const action = parts[1];

  if (action === undefined) {
    const memories = recentMemories();
    if (memories.length === 0) return ["No memories stored for this project yet"];
    return ["Project memory:", ...memories.map(formatMemory)];
  }

  if (action === "find") {
    const query = parts.slice(2).join(" ");
    if (!query) return ["Usage: /memory find <text>"];
    const found = searchMemories(query);
    if (found.length === 0) return [`No memories matched "${query}"`];
    return [`Memories for "${query}":`, ...found.map((item) => formatMemory(item.memory))];
  }

  if (action === "forget") {
    const memoryId = parts[2];
    if (!memoryId) return ["Usage: /memory forget <id>"];
    try {
      forgetMemory(memoryId);
    } catch {
      return [`No memory with id ${memoryId}`];
    }
    return [`Marked ${memoryId} as wrong: confidence lowered, history kept`];
  }

  return ["Usage: /memory [find <text> | forget <id>]"];
}
