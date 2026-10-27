import fs from "node:fs";
import path from "node:path";
import type { MemoryPersistence } from "./persistence";

/** Filesystem-backed persistence for the CLI, rooted at `user_config/memory/`. */
export function fsPersistence(dir: string): MemoryPersistence {
  fs.mkdirSync(dir, { recursive: true });
  return {
    readText(name) {
      const file = path.join(dir, name);
      return fs.existsSync(file) ? fs.readFileSync(file, "utf-8") : null;
    },
    writeText(name, contents) {
      fs.writeFileSync(path.join(dir, name), contents, "utf-8");
    },
  };
}
