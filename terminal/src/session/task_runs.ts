import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import type { TaskCategoryDTO } from "../dto/wire";
import { configDirPath } from "../save/config_path";
import {
  createTaskRunRecorder,
  TASK_RUNS_FILE_NAME,
  type TaskRunRow,
  type TextStorage,
} from "../../../packages/task_runs/src";

export { TASK_RUNS_FILE_NAME };
export type { TaskRunRow };

function runsFilePath(name: string): string {
  return join(configDirPath(), name);
}

function fsStorage(): TextStorage {
  return {
    readText(name) {
      const path = runsFilePath(name);
      if (existsSync(path)) return readFileSync(path, "utf-8");
      return null;
    },
    writeText(name, contents) {
      mkdirSync(configDirPath(), { recursive: true });
      writeFileSync(runsFilePath(name), contents, "utf-8");
    },
  };
}

const recorder = createTaskRunRecorder(fsStorage());

export function initTaskRuns(): TaskRunRow[] {
  return recorder.init();
}

export function recordTaskRuns(
  categories: TaskCategoryDTO[],
  session_id: string,
  model_id: number,
): void {
  recorder.record(categories, session_id, model_id);
}

export function recentRuns(limit = 10): TaskRunRow[] {
  return recorder.recent(limit);
}
