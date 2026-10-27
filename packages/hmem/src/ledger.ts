import type { LedgerAction, LedgerEntry, MemoryRecord } from "./types";
import type { MemoryPersistence } from "./persistence";
import { LEDGER_FILE } from "./persistence";

export interface LedgerExtra {
  previousState?: Partial<MemoryRecord>;
  newState?: Partial<MemoryRecord>;
  details?: Record<string, unknown>;
}

export class TrustLedger {
  private entries: LedgerEntry[] = [];

  constructor(
    private clock: () => number,
    private storage?: MemoryPersistence,
  ) {
    const saved = this.storage?.readText(LEDGER_FILE);
    if (!saved) return;
    this.entries = saved
      .split("\n")
      .filter(Boolean)
      .map((line) => JSON.parse(line) as LedgerEntry);
  }

  log(memoryId: string, action: LedgerAction, actor: string, extra?: LedgerExtra): LedgerEntry {
    const entry: LedgerEntry = { memoryId, action, actor, timestamp: this.clock(), ...extra };
    this.entries.push(entry);
    if (this.storage) {
      const previous = this.storage.readText(LEDGER_FILE) ?? "";
      this.storage.writeText(LEDGER_FILE, `${previous}${JSON.stringify(entry)}\n`);
    }
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
