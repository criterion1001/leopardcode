import { DAY_MS, DEFAULTS, FEEDBACK_DELTAS, LAYER_WEIGHT, clamp01 } from "./types";
import type { FeedbackKind, MemoryRecord, QueryResult, RetrievedMemory } from "./types";
import { cosine, embed, jaccard, tokenize } from "./embeddings";
import { classifyDomain, extractEntities } from "./enrichment";
import type { TrustLedger } from "./ledger";
import { snapshotOf } from "./store";
import type { MemoryStore } from "./store";

export interface QueryOptions {
  topN?: number;
  threshold?: number;
  chatId?: string;
}

export class MemoryRetrieval {
  constructor(
    private store: MemoryStore,
    private ledger: TrustLedger,
    private clock: () => number,
    private actor: string,
  ) {}

  scoreOne(memory: MemoryRecord, query: string): number {
    return this.scoreFor(
      memory,
      query,
      embed(query),
      extractEntities(query),
      classifyDomain(query, [], "general"),
    );
  }

  query(query: string, options?: QueryOptions): QueryResult {
    const queryEmbedding = embed(query);
    const queryTokens = tokenize(query).slice(0, 8);
    const queryEntities = extractEntities(query);
    const queryDomain = classifyDomain(query, [], "general");
    const threshold = options?.threshold ?? DEFAULTS.retrievalThreshold;
    const topN = options?.topN ?? DEFAULTS.retrievalTopN;

    const scored: RetrievedMemory[] = [];
    for (const memory of this.store.all()) {
      if (options?.chatId && memory.chatId && memory.chatId !== options.chatId) continue;
      const relevance = this.scoreFor(
        memory,
        query,
        queryEmbedding,
        queryEntities,
        queryDomain,
        queryTokens,
      );
      if (relevance >= threshold) scored.push({ memory, relevance });
    }
    scored.sort((a, b) => b.relevance - a.relevance || a.memory.id.localeCompare(b.memory.id));
    const selected = scored.slice(0, topN);

    for (const { memory } of selected) {
      this.store.touch(memory.id);
      this.ledger.log(memory.id, "read", this.actor, { details: { query } });
    }

    const strategy =
      selected.length <= 1
        ? "minimal"
        : selected.some(
              (item) => item.memory.type === "personal" || item.memory.type === "preference",
            )
          ? "personal"
          : "comprehensive";

    return {
      memories: selected,
      context: this.formatReinjection(selected),
      trace: {
        retrievalReason: `hybrid ranking for "${query}" (domain: ${queryDomain})`,
        strategy,
        scores: Object.fromEntries(
          selected.map((item) => [item.memory.id, Number(item.relevance.toFixed(4))]),
        ),
      },
    };
  }

  formatReinjection(items: RetrievedMemory[]): string {
    if (items.length === 0) return "";
    const byDomain = new Map<string, RetrievedMemory[]>();
    for (const item of items) {
      const group = byDomain.get(item.memory.domain) ?? [];
      group.push(item);
      byDomain.set(item.memory.domain, group);
    }
    const lines = ["[MEMORY CONTEXT]"];
    for (const [domain, group] of [...byDomain.entries()].sort()) {
      lines.push(`## ${domain}`);
      for (const { memory } of group) {
        const marker =
          memory.layer === "long_term" ? "LT" : memory.layer === "working" ? "WK" : "ST";
        const entities = memory.entities.length ? ` (entities: ${memory.entities.join(", ")})` : "";
        lines.push(`- [${marker}] ${memory.content}${entities} <${memory.id}>`);
      }
    }
    lines.push("[/MEMORY CONTEXT]");
    return lines.join("\n");
  }

  feedback(memoryId: string, kind: FeedbackKind): void {
    const memory = this.store.get(memoryId);
    if (!memory) throw new Error(`H-MEM: unknown memory id ${memoryId}`);
    const previous = snapshotOf(memory);
    if (kind === "helpful") memory.accessCount += 1;
    memory.confidence = clamp01(memory.confidence + FEEDBACK_DELTAS[kind]);
    if (kind === "wrong" && !memory.tags.includes("review")) memory.tags.push("review");
    this.ledger.log(memoryId, "feedback", this.actor, {
      previousState: previous,
      newState: snapshotOf(memory),
      details: { kind, delta: FEEDBACK_DELTAS[kind] },
    });
    this.store.persist();
  }

  private scoreFor(
    memory: MemoryRecord,
    query: string,
    queryEmbedding: number[],
    queryEntities: string[],
    queryDomain: string,
    queryTokens?: string[],
  ): number {
    const tokens = queryTokens ?? tokenize(query).slice(0, 8);
    const semantic = clamp01(cosine(queryEmbedding, memory.embedding));
    const keyword = jaccard(tokens, tokenize(memory.content));
    const tag = jaccard(
      tokens,
      memory.tags.map((value) => value.toLowerCase()),
    );
    const domain = memory.domain === queryDomain ? 1 : 0;
    const entity = jaccard(queryEntities, memory.entities);
    const layer = LAYER_WEIGHT[memory.layer];
    const ageDays = (this.clock() - memory.lastAccessed) / DAY_MS;
    const recency = Math.exp(-ageDays / DEFAULTS.recencyDays);
    const superseded = memory.supersededBy ? 1 : 0;
    const raw =
      0.35 * semantic +
      0.2 * keyword +
      0.1 * tag +
      0.1 * domain +
      0.15 * entity +
      0.05 * layer +
      0.05 * recency -
      0.2 * superseded;
    return clamp01(raw) * memory.confidence;
  }
}
