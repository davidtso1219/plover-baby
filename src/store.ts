import { existsSync, readFileSync, writeFileSync } from "fs";
import { join } from "path";

export type Todo = { id: number; text: string };

const DB_PATH = join(import.meta.dir, "..", "todos.json");

export function loadTodos(): Todo[] {
  if (!existsSync(DB_PATH)) return [];
  const raw = readFileSync(DB_PATH, "utf-8").trim();
  if (!raw) return [];
  return JSON.parse(raw) as Todo[];
}

export function saveTodos(todos: Todo[]): void {
  writeFileSync(DB_PATH, JSON.stringify(todos, null, 2) + "\n");
}

export function nextId(todos: Todo[]): number {
  if (todos.length === 0) return 1;
  return Math.max(...todos.map((t) => t.id)) + 1;
}
