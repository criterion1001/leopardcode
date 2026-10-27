/**
 * Persistence seam for the H-MEM engine.
 *
 * The engine core never imports `node:fs`: callers inject a small text adapter.
 * The CLI wires `fsPersistence()` over `user_config/memory/`; the web workspace
 * wires a browser-storage adapter so the same engine runs in both frontends.
 */
export interface MemoryPersistence {
  readText(name: string): string | null;
  writeText(name: string, contents: string): void;
}

export const STATE_FILE = "state.json";
export const LEDGER_FILE = "ledger.jsonl";
