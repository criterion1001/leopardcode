import fs from "node:fs";
import path from "node:path";
import type { LedgerAction, LedgerEntry, MemoryRecord } from "./types";

export interface LedgerExtra {
  previousState?: Partial<MemoryRecord>;
  newState?: Partial<MemoryRecord>;
  details?: Record<string, unknown>;
}

export class TrustLedger {
  private entries: LedgerEntry[] = [];
  private filePath?: string;

  constructor(
    private clock: () => number,
    persistDir?: string,
  ) {
    if (!persistDir) return;
    this.filePath = path.join(persistDir, "ledger.jsonl");
    if (!fs.existsSync(this.filePath)) return;
    const lines = fs.readFileSync(this.filePath, "utf-8").split("\n").filter(Boolean);
    this.entries = lines.map((line) => JSON.parse(line) as LedgerEntry);
  }

  log(memoryId: string, action: LedgerAction, actor: string, extra?: LedgerExtra): LedgerEntry {
    const entry: LedgerEntry = { memoryId, action, actor, timestamp: this.clock(), ...extra };
    this.entries.push(entry);
    if (this.filePath) fs.appendFileSync(this.filePath, `${JSON.stringify(entry)}\n`, "utf-8");
    return entry;
  }

  history(memoryId: string): LedgerEntry[] {
    return this.entries.filter((entry) => entry.memoryId === memoryId);
  }

  all(): readonly LedgerEntry[] {
    return this.entries;
  }

  stats(): Record<string, number> {
    const counts: Record<string, number> = {};
    for (const entry of this.entries) counts[entry.action] = (counts[entry.action] ?? 0) + 1;
    return counts;
  }
}
