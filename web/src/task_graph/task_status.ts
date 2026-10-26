import type { TaskCategoryDTO } from "../terminal/dto/wire";

export type TaskStatus = TaskCategoryDTO["status"];

/** Terminal-theme palette used for both node fills and edge/arrow colours. */
export const STATUS_COLORS: Record<TaskStatus, string> = {
  running: "#E3A32F",
  done: "#9DBF6B",
  failed: "#FF6B4A",
  blocked: "#F2C14E",
  pending: "#A28A67",
};

/** Legend order — most active first. */
export const STATUS_ORDER: TaskStatus[] = ["running", "pending", "blocked", "done", "failed"];
