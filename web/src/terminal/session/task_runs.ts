import {
  createTaskRunRecorder,
  TASK_RUNS_FILE_NAME,
  type TaskRunRow,
} from "../../../../packages/task_runs/src";
import type { TaskCategoryDTO } from "../dto/wire";
import { browserPersistence } from "./browser_storage";

export { TASK_RUNS_FILE_NAME };
export type { TaskRunRow };

const recorder = createTaskRunRecorder(browserPersistence("task_runs"));

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
