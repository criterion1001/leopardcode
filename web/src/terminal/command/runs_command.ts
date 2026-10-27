import { recentRuns } from "../session/task_runs";
import { isCommand } from "./command_list";

export function isRunsCommand(input: string): boolean {
  return isCommand(input, "/runs");
}

export function runRunsCommand(): string[] {
  const rows = recentRuns();
  if (rows.length === 0) return ["No task runs recorded yet"];
  return [
    "Recent task runs:",
    ...rows.map(
      (row) =>
        `${row.recorded_at} | model ${row.model_id} | ${row.status} | ${row.category} | ${row.task_count} tasks`,
    ),
  ];
}
