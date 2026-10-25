import { appendFileSync, existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import type { TaskCategoryDTO, TaskCategoryStatus } from "../dto/wire";
import { configDirPath } from "../save/config_path";

export const TASK_RUNS_FILE_NAME = "task_runs.csv";

const HEADER = "recorded_at,session_id,model_id,category,status,task_count";
const TERMINAL_STATUSES: TaskCategoryStatus[] = ["done", "failed", "blocked"];
const MAX_FIELD_LENGTH = 200;

export type TaskRunRow = {
  recorded_at: string;
  session_id: string;
  model_id: number;
  category: string;
  status: string;
  task_count: number;
};

let initialized = false;
const observed_statuses = new Map<string, TaskCategoryStatus>();
const recorded_keys = new Set<string>();

function runsFilePath(): string {
  return join(configDirPath(), TASK_RUNS_FILE_NAME);
}

function escapeField(value: string): string {
  const clean = value.replace(/\s+/g, " ").trim().slice(0, MAX_FIELD_LENGTH);
  if (/[",\n]/.test(clean)) return `"${clean.replace(/"/g, '""')}"`;
  return clean;
}

function toCsvLine(row: TaskRunRow): string {
  return [
    row.recorded_at,
    row.session_id,
    String(row.model_id),
    escapeField(row.category),
    row.status,
    String(row.task_count),
  ].join(",");
}

function parseCsvLine(line: string): string[] {
  const fields: string[] = [];
  let current = "";
  let quoted = false;
  for (let index = 0; index < line.length; index++) {
    const character = line[index];
    if (quoted) {
      if (character === '"' && line[index + 1] === '"') {
        current += '"';
        index++;
      } else if (character === '"') {
        quoted = false;
      } else {
        current += character;
      }
    } else if (character === '"') {
      quoted = true;
    } else if (character === ",") {
      fields.push(current);
      current = "";
    } else {
      current += character;
    }
  }
  fields.push(current);
  return fields;
}

function parseRows(lines: string[]): TaskRunRow[] {
  const rows: TaskRunRow[] = [];
  for (const line of lines) {
    if (!line.trim()) continue;
    const fields = parseCsvLine(line);
    if (fields.length < 6) continue;
    const model_id = Number.parseInt(fields[2], 10);
    const task_count = Number.parseInt(fields[5], 10);
    rows.push({
      recorded_at: fields[0],
      session_id: fields[1],
      model_id: Number.isNaN(model_id) ? 0 : model_id,
      category: fields[3],
      status: fields[4],
      task_count: Number.isNaN(task_count) ? 0 : task_count,
    });
  }
  return rows;
}

export function initTaskRuns(): TaskRunRow[] {
  const directory = configDirPath();
  mkdirSync(directory, { recursive: true });
  const path = runsFilePath();
  if (!existsSync(path)) {
    writeFileSync(path, `${HEADER}\n`, "utf-8");
    initialized = true;
    return [];
  }
  const content = readFileSync(path, "utf-8");
  const lines = content.split("\n");
  const [first, ...rest] = lines;
  if (first === HEADER) {
    initialized = true;
    return parseRows(rest);
  }
  writeFileSync(path, `${HEADER}\n${content}`, "utf-8");
  initialized = true;
  return parseRows(lines);
}

export function recordTaskRuns(
  categories: TaskCategoryDTO[],
  session_id: string,
  model_id: number,
): void {
  if (!initialized) initTaskRuns();
  const rows: TaskRunRow[] = [];

  for (const category of categories) {
    const status = category.status;
    const previous = observed_statuses.get(category.name);
    observed_statuses.set(category.name, status);

    if (!TERMINAL_STATUSES.includes(status)) continue;
    if (previous === undefined) continue;
    if (TERMINAL_STATUSES.includes(previous)) continue;

    const key = `${session_id}|${category.name}`;
    if (recorded_keys.has(key)) continue;
    recorded_keys.add(key);

    rows.push({
      recorded_at: new Date().toISOString(),
      session_id,
      model_id,
      category: category.name,
      status,
      task_count: category.tasks.length,
    });
  }

  if (rows.length === 0) return;
  appendFileSync(runsFilePath(), `${rows.map(toCsvLine).join("\n")}\n`, "utf-8");
}

export function recentRuns(limit = 10): TaskRunRow[] {
  if (!existsSync(runsFilePath())) return [];
  const rows = parseRows(readFileSync(runsFilePath(), "utf-8").split("\n").slice(1));
  return rows.slice(-limit).reverse();
}
