/**
 * Shared task-run CSV core.
 *
 * The CLI records terminal task runs to `user_config/task_runs.csv`; the web
 * workspace records the same rows in browser storage. Both use this module so
 * the CSV shape, dedupe rules, and status handling stay identical, and the
 * CSV can be exposed to Zetaris as a FILESTORE table.
 *
 * Persistence is injected as a small text adapter; this package imports no
 * platform modules.
 */
export interface TextStorage {
  readText(name: string): string | null;
  writeText(name: string, contents: string): void;
}

export const TASK_RUNS_FILE_NAME = "task_runs.csv";

const HEADER = "recorded_at,session_id,model_id,category,status,task_count";
const TERMINAL_STATUSES = new Set(["done", "failed", "blocked"]);
const MAX_FIELD_LENGTH = 200;

export type TaskRunRow = {
  recorded_at: string;
  session_id: string;
  model_id: number;
  category: string;
  status: string;
  task_count: number;
};

export type TaskCategoryLike = {
  name: string;
  status: string;
  tasks: readonly unknown[];
};

export type TaskRunRecorder = {
  init(): TaskRunRow[];
  record(categories: readonly TaskCategoryLike[], sessionId: string, modelId: number): void;
  recent(limit?: number): TaskRunRow[];
};

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
    const modelId = Number.parseInt(fields[2], 10);
    const taskCount = Number.parseInt(fields[5], 10);
    rows.push({
      recorded_at: fields[0],
      session_id: fields[1],
      model_id: Number.isNaN(modelId) ? 0 : modelId,
      category: fields[3],
      status: fields[4],
      task_count: Number.isNaN(taskCount) ? 0 : taskCount,
    });
  }
  return rows;
}

export function createTaskRunRecorder(storage: TextStorage): TaskRunRecorder {
  let initialized = false;
  const observedStatuses = new Map<string, string>();
  const recordedKeys = new Set<string>();

  function init(): TaskRunRow[] {
    const content = storage.readText(TASK_RUNS_FILE_NAME);
    if (content === null) {
      storage.writeText(TASK_RUNS_FILE_NAME, `${HEADER}\n`);
      initialized = true;
      return [];
    }
    const lines = content.split("\n");
    const [first, ...rest] = lines;
    if (first === HEADER) {
      initialized = true;
      return parseRows(rest);
    }
    storage.writeText(TASK_RUNS_FILE_NAME, `${HEADER}\n${content}`);
    initialized = true;
    return parseRows(lines);
  }

  function record(categories: readonly TaskCategoryLike[], sessionId: string, modelId: number): void {
    if (!initialized) init();
    const rows: TaskRunRow[] = [];

    for (const category of categories) {
      const status = category.status;
      const previous = observedStatuses.get(category.name);
      observedStatuses.set(category.name, status);

      if (!TERMINAL_STATUSES.has(status)) continue;
      if (previous === undefined) continue;
      if (TERMINAL_STATUSES.has(previous)) continue;

      const key = `${sessionId}|${category.name}`;
      if (recordedKeys.has(key)) continue;
      recordedKeys.add(key);

      rows.push({
        recorded_at: new Date().toISOString(),
        session_id: sessionId,
        model_id: modelId,
        category: category.name,
        status,
        task_count: category.tasks.length,
      });
    }

    if (rows.length === 0) return;
    const previous = storage.readText(TASK_RUNS_FILE_NAME) ?? `${HEADER}\n`;
    storage.writeText(TASK_RUNS_FILE_NAME, `${previous}${rows.map(toCsvLine).join("\n")}\n`);
  }

  function recent(limit = 10): TaskRunRow[] {
    const content = storage.readText(TASK_RUNS_FILE_NAME);
    if (content === null) return [];
    return parseRows(content.split("\n").slice(1)).slice(-limit).reverse();
  }

  return { init, record, recent };
}
