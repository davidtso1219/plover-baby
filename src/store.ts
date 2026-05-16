import { readFileSync, writeFileSync } from "fs";
import { join } from "path";

export type Todo = { id: number; text: string };

const DATA_FILE = join(import.meta.dir, "..", "todos.json");

export function loadTodos(filePath: string = DATA_FILE): Todo[] {
  try {
    const raw = readFileSync(filePath, "utf-8").trim();
    if (!raw) return [];
    return JSON.parse(raw) as Todo[];
  } catch (e) {
    if ((e as NodeJS.ErrnoException).code !== 'ENOENT') throw e;
    return [];
  }
}

export function saveTodos(todos: Todo[], filePath: string = DATA_FILE): void {
  writeFileSync(filePath, JSON.stringify(todos, null, 2));
}

export function nextId(todos: Todo[]): number {
  if (todos.length === 0) return 1;
  return Math.max(...todos.map((t) => t.id)) + 1;
}
