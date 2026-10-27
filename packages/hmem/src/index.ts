import { MemoryStore } from "./store";
import type { AddInput } from "./store";
import { TrustLedger } from "./ledger";
import { MemoryRetrieval } from "./retrieval";
import type { QueryOptions } from "./retrieval";
import { MemoryMining } from "./mining";
import { ConflictDetection } from "./conflicts";
import { Dreaming } from "./dreaming";
import { SleepCycle } from "./sleep";
import type {
  FeedbackKind,
  HmemOptions,
  MiningEventType,
  MemoryRecord,
  QueryResult,
} from "./types";

export * from "./types";
export { MemoryStore } from "./store";
export type { AddInput } from "./store";
export { TrustLedger } from "./ledger";
export { MemoryRetrieval } from "./retrieval";
export { MemoryMining, parseStringArray } from "./mining";
export { ConflictDetection } from "./conflicts";
export { Dreaming } from "./dreaming";
export { SleepCycle } from "./sleep";
export { embed, cosine, tokenize, jaccard } from "./embeddings";
export { classifyDomain, extractEntities } from "./enrichment";

export class HMEM {
  readonly clock: () => number;
  readonly ledger: TrustLedger;
  readonly store: MemoryStore;
  readonly retrieval: MemoryRetrieval;
  readonly mining: MemoryMining;
  readonly conflicts: ConflictDetection;
  readonly sleep: SleepCycle;
  readonly dreaming: Dreaming;

  constructor(options: HmemOptions = {}) {
    this.clock = options.clock ?? Date.now;
    const actor = options.actor ?? "system";
    this.ledger = new TrustLedger(this.clock, options.persist);
    this.store = new MemoryStore(this.clock, this.ledger, actor, options.persist);
    this.retrieval = new MemoryRetrieval(this.store, this.ledger, this.clock, actor);
    this.mining = new MemoryMining(this.store, this.clock, options.minerFn);
    this.conflicts = new ConflictDetection(this.store, this.ledger, this.clock, actor);
    this.sleep = new SleepCycle(this.store, this.ledger, this.clock, actor);
    this.dreaming = new Dreaming(this.store, this.ledger, this.clock, actor);
  }

  add(input: AddInput): MemoryRecord {
    return this.store.add(input);
  }

  mine(
    event: MiningEventType,
    text: string,
    options?: { chatId?: string },
  ): Promise<MemoryRecord[]> {
    return this.mining.mineInteraction(event, text, options);
  }

  query(text: string, options?: QueryOptions): QueryResult {
    return this.retrieval.query(text, options);
  }

  feedback(memoryId: string, kind: FeedbackKind): void {
    this.retrieval.feedback(memoryId, kind);
  }
}
