import type { MiningEventType, MemoryRecord } from "./types";
import type { MemoryStore } from "./store";

const PREFERENCE_PATTERN = /\b(always|never|prefer|avoid|instead|use|don't|do not|must)\b/i;
const MAX_ITEMS = 5;
const MIN_LENGTH = 8;
const MAX_LENGTH = 240;

const EVENT_INSTRUCTIONS: Record<MiningEventType, string> = {
  chat_message: "Extract durable facts and preferences the user stated.",
  user_correction: "Extract the corrected fact or preference, not the old value.",
  file_save: "Extract durable facts about the file contents and its conventions.",
  file_open: "Extract durable facts about the files the user is working on.",
  file_edit: "Extract durable conventions and decisions implied by the edit.",
  model_response: "Extract durable conclusions worth remembering from the answer.",
  plan_completion: "Extract what the completed plan established for future work.",
};

export function parseStringArray(text: string): string[] {
  const trimmed = text
    .trim()
    .replace(/^```(?:json)?/i, "")
    .replace(/```$/, "")
    .trim();
  const start = trimmed.indexOf("[");
  const end = trimmed.lastIndexOf("]");
  if (start === -1 || end === -1 || end <= start) return [];
  try {
    const parsed = JSON.parse(trimmed.slice(start, end + 1));
    if (!Array.isArray(parsed)) return [];
    return parsed.filter((item): item is string => typeof item === "string");
  } catch {
    return [];
  }
}

export class MemoryMining {
  constructor(
    private store: MemoryStore,
    private clock: () => number,
    private miner?: (prompt: string) => Promise<string>,
  ) {}

  async mineInteraction(
    event: MiningEventType,
    text: string,
    options?: { chatId?: string },
  ): Promise<MemoryRecord[]> {
    const candidates =
      this.miner !== undefined ? await this.withModel(event, text) : this.directly(text);
    const usable = candidates
      .map((candidate) => candidate.trim())
      .filter((candidate) => candidate.length >= MIN_LENGTH && candidate.length <= MAX_LENGTH)
      .slice(0, MAX_ITEMS);
    return usable.map((content) =>
      this.store.add({
        content,
        type: PREFERENCE_PATTERN.test(content) ? "preference" : "general",
        layer: "short_term",
        tags: [`event:${event}`],
        source: `event:${event}`,
        provenance: { origin: event, learnedAt: this.clock(), label: `mined from ${event}` },
        chatId: options?.chatId,
      }),
    );
  }

  private async withModel(event: MiningEventType, text: string): Promise<string[]> {
    if (this.miner === undefined) return [];
    const prompt = [
      "You extract durable memories. Reply with a strict JSON array of strings only.",
      `Event: ${event}. ${EVENT_INSTRUCTIONS[event]}`,
      "Each item: one concise, self-contained statement. No markdown, no commentary.",
      `Text: ${text}`,
    ].join("\n");
    try {
      return parseStringArray(await this.miner(prompt));
    } catch {
      return this.directly(text);
    }
  }

  private directly(text: string): string[] {
    return text
      .split(/\n+|(?<=[.!?])\s+/)
      .map((line) => line.replace(/\s+/g, " ").trim())
      .filter(Boolean);
  }
}
