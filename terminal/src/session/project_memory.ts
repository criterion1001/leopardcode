import { join } from "node:path";
import type { TaskCategoryDTO } from "../dto/wire";
import { HMEM } from "../../../packages/hmem/src";
import type { MemoryRecord, RetrievedMemory } from "../../../packages/hmem/src";
import { fsPersistence } from "../../../packages/hmem/src/persistence_fs";
import { configDirPath } from "../save/config_path";

const RECALL_TOP_N = 5;
const RECALL_THRESHOLD = 0.2;
const MIN_DURABLE_LENGTH = 16;
const DURABLE_PATTERN =
  /\b(always|never|prefer|avoid|use|don't|do not|instead|remember|must|should)\b/i;
const CORRECTION_PATTERN =
  /\b(actually|instead|no longer|not anymore|changed to|correction|don't|do not|never)\b/i;
const QUESTION_PATTERN =
  /^(how|what|why|when|where|who|which|can|could|should|would|do|does|did|is|are|was|were)\b/i;

let memory: HMEM | undefined;
const seen_done_categories = new Set<string>();

function projectMemory(): HMEM {
  if (memory === undefined) {
    memory = new HMEM({
      persist: fsPersistence(join(configDirPath(), "memory")),
      actor: "leopardcode-cli",
    });
  }
  return memory;
}

function hasContent(content: string): boolean {
  return projectMemory()
    .store.all()
    .some((record) => record.content === content);
}

export function preparePrompt(prompt: string): { wire_prompt: string; recalled_count: number } {
  const result = projectMemory().query(prompt, {
    topN: RECALL_TOP_N,
    threshold: RECALL_THRESHOLD,
  });
  rememberPrompt(prompt);
  const wire_prompt = result.context ? `${prompt}\n\n${result.context}` : prompt;
  return { wire_prompt, recalled_count: result.memories.length };
}

export function rememberPrompt(prompt: string): MemoryRecord | undefined {
  const content = prompt.trim();
  if (content.length < MIN_DURABLE_LENGTH) return undefined;
  if (content.endsWith("?")) return undefined;
  if (QUESTION_PATTERN.test(content)) return undefined;
  if (!DURABLE_PATTERN.test(content)) return undefined;
  if (hasContent(content)) return undefined;

  return projectMemory().add({
    content,
    type: "preference",
    layer: "working",
    tags: ["source:cli"],
    confidence: 0.8,
    source: "cli:prompt",
    provenance: {
      origin: CORRECTION_PATTERN.test(content) ? "user_correction" : "chat_message",
      learnedAt: Date.now(),
      label: "stated in the terminal",
    },
  });
}

export function trackPlanProgress(categories: TaskCategoryDTO[]): void {
  for (const category of categories) {
    if (category.status !== "done") continue;
    if (seen_done_categories.has(category.name)) continue;
    seen_done_categories.add(category.name);
    const content = `Completed work: ${category.name}`;
    if (hasContent(content)) continue;
    projectMemory().add({
      content,
      type: "general",
      layer: "short_term",
      tags: ["source:plan"],
      confidence: 0.7,
      source: "cli:plan",
      provenance: {
        origin: "plan_completion",
        learnedAt: Date.now(),
        label: "completed category",
      },
    });
  }
}

export function recentMemories(limit = 10): MemoryRecord[] {
  return [...projectMemory().store.all()]
    .sort((first, second) => second.timestamp - first.timestamp)
    .slice(0, limit);
}

export function searchMemories(query: string, limit = 5): RetrievedMemory[] {
  return projectMemory().query(query, { topN: limit, threshold: RECALL_THRESHOLD }).memories;
}

export function forgetMemory(memoryId: string): void {
  projectMemory().feedback(memoryId, "wrong");
}
