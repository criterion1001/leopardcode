import type { MemoryPersistence } from "../../../../packages/hmem/src/persistence";

const KEY_PREFIX = "leopardcode.";

/**
 * Browser-backed text persistence shared by the H-MEM engine and the task-run
 * recorder. A namespace keeps the two stores apart in localStorage, mirroring
 * the CLI's `user_config/memory/` and `user_config/task_runs.csv`.
 */
export function browserPersistence(namespace: string): MemoryPersistence {
  const key = (name: string) => `${KEY_PREFIX}${namespace}.${name}`;
  return {
    readText(name) {
      return window.localStorage.getItem(key(name));
    },
    writeText(name, contents) {
      window.localStorage.setItem(key(name), contents);
    },
  };
}
