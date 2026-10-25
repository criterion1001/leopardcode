import fs from "node:fs";
import path from "node:path";
import { DEFAULTS, clamp01 } from "./types";
import type { MemoryLayer, MemoryRecord, MemoryType, Provenance } from "./types";
import { cosine, embed } from "./embeddings";
import { classifyDomain, extractEntities, namespaceFor } from "./enrichment";
import type { TrustLedger } from "./ledger";

const CORRECTION_PATTERN = /\b(actually|instead|no longer|not anymore|changed to|correction)\b/i;
const SUPERSEDE_SIMILARITY = 0.85;

export interface AddInput {
  content: string;
  type?: MemoryType;
  layer?: MemoryLayer;
  tags?: string[];
  confidence?: number;
  source: string;
  provenance?: Provenance;
  chatId?: string;
  missionId?: string;
  goalRunId?: string;
  supersedes?: string;
  derivedFrom?: string[];
}

export function snapshotOf(record: MemoryRecord): Partial<MemoryRecord> {
  const { embedding, ...rest } = record;
  return structuredClone(rest);
}

export class MemoryStore {
  private records = new Map<string, MemoryRecord>();
  private seq = 0;
  private stateFile?: string;

  constructor(
    private clock: () => number,
    private ledger: TrustLedger,
    private actor: string,
    persistDir?: string,
  ) {
    if (!persistDir) return;
    fs.mkdirSync(persistDir, { recursive: true });
    this.stateFile = path.join(persistDir, "state.json");
    if (!fs.existsSync(this.stateFile)) return;
    const saved = JSON.parse(fs.readFileSync(this.stateFile, "utf-8")) as {
      seq: number;
      records: MemoryRecord[];
    };
    this.seq = saved.seq;
    for (const record of saved.records) this.records.set(record.id, record);
  }

  add(input: AddInput): MemoryRecord {
    if (!input.source || input.source.trim() === "") {
      throw new Error("H-MEM: a memory record without a source is rejected");
    }
    const now = this.clock();
    const tags = [...(input.tags ?? [])];
    const type = input.type ?? "general";
    const domain = classifyDomain(input.content, tags, type);
    const record: MemoryRecord = {
      id: `mem-${++this.seq}`,
      content: input.content,
      type,
      layer: input.layer ?? "working",
      timestamp: now,
      lastAccessed: now,
      accessCount: 0,
      tags,
      embedding: embed(input.content),
      confidence: clamp01(input.confidence ?? 0.7),
      source: input.source,
      provenance: input.provenance ?? { origin: "manual", learnedAt: now, label: input.source },
      chatId: input.chatId,
      missionId: input.missionId,
      goalRunId: input.goalRunId,
      domain,
      namespace: namespaceFor(domain, type),
      entities: extractEntities(input.content),
      relatedTo: [],
      supersedes: input.supersedes,
      derivedFrom: input.derivedFrom,
    };
    this.discoverRelationships(record);
    this.records.set(record.id, record);
    this.ledger.log(record.id, "create", this.actor, { newState: snapshotOf(record) });
    this.persist();
    return record;
  }

  get(id: string): MemoryRecord | undefined {
    return this.records.get(id);
  }

  all(): MemoryRecord[] {
    return [...this.records.values()];
  }

  update(id: string, patch: Partial<MemoryRecord>): MemoryRecord {
    const record = this.mustGet(id);
    const previous = snapshotOf(record);
    Object.assign(record, patch);
    this.ledger.log(id, "update", this.actor, {
      previousState: previous,
      newState: snapshotOf(record),
    });
    this.persist();
    return record;
  }

  delete(id: string, reason: string): void {
    const record = this.mustGet(id);
    this.records.delete(id);
    this.ledger.log(id, "delete", this.actor, {
      previousState: snapshotOf(record),
      details: { reason },
    });
    this.persist();
  }

  touch(id: string): void {
    const record = this.mustGet(id);
    record.lastAccessed = this.clock();
    record.accessCount += 1;
  }

  promote(id: string, layer: MemoryLayer): void {
    const record = this.mustGet(id);
    const previous = snapshotOf(record);
    record.layer = layer;
    this.ledger.log(id, "promote", this.actor, {
      previousState: previous,
      newState: snapshotOf(record),
    });
    this.persist();
  }

  persist(): void {
    if (!this.stateFile) return;
    const records = [...this.records.values()].sort((a, b) => a.id.localeCompare(b.id));
    fs.writeFileSync(
      this.stateFile,
      `${JSON.stringify({ seq: this.seq, records }, null, 2)}\n`,
      "utf-8",
    );
  }

  snapshotAll(): { records: MemoryRecord[]; seq: number } {
    return { records: structuredClone([...this.records.values()]), seq: this.seq };
  }

  restoreAll(records: MemoryRecord[], seq: number): void {
    this.records = new Map(records.map((record) => [record.id, structuredClone(record)]));
    this.seq = seq;
    this.persist();
  }

  private mustGet(id: string): MemoryRecord {
    const record = this.records.get(id);
    if (!record) throw new Error(`H-MEM: unknown memory id ${id}`);
    return record;
  }

  private discoverRelationships(record: MemoryRecord): void {
    for (const other of this.records.values()) {
      if (record.relatedTo.length >= DEFAULTS.relatedCap) break;
      const sharedEntities = other.entities.filter((entity) => record.entities.includes(entity));
      const similarity = cosine(record.embedding, other.embedding);
      if (
        !record.supersedes &&
        similarity > SUPERSEDE_SIMILARITY &&
        CORRECTION_PATTERN.test(record.content)
      ) {
        record.supersedes = other.id;
        continue;
      }
      if (sharedEntities.length >= 1 && other.domain === record.domain) {
        record.relatedTo.push(other.id);
        if (other.relatedTo.length < DEFAULTS.relatedCap && !other.relatedTo.includes(record.id)) {
          other.relatedTo.push(record.id);
        }
      }
    }
  }
}
