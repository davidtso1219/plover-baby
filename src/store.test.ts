import { test, expect, describe, beforeEach, afterEach } from "bun:test";
import { existsSync, mkdtempSync, rmSync, writeFileSync, unlinkSync } from "fs";
import { join } from "path";
import { loadTodos, saveTodos, nextId, type Todo } from "./store";

const DB_PATH = join(import.meta.dir, "..", "todos.json");
const CWD = join(import.meta.dir, "..");

function cleanDb() {
  if (existsSync(DB_PATH)) unlinkSync(DB_PATH);
}

function seedDb(todos: Todo[]) {
  writeFileSync(DB_PATH, JSON.stringify(todos, null, 2) + "\n");
}

describe("loadTodos", () => {
  beforeEach(cleanDb);
  afterEach(cleanDb);

  test("returns [] when todos.json does not exist (ENOENT)", () => {
    expect(loadTodos()).toEqual([]);
  });

  test("returns [] when todos.json is empty", () => {
    writeFileSync(DB_PATH, "");
    expect(loadTodos()).toEqual([]);
  });

  test("returns parsed todos from an existing file", () => {
    const todos: Todo[] = [{ id: 1, text: "hello" }];
    writeFileSync(DB_PATH, JSON.stringify(todos));
    expect(loadTodos()).toEqual(todos);
  });
});

describe("saveTodos / loadTodos round-trip", () => {
  beforeEach(cleanDb);
  afterEach(cleanDb);

  test("save then load returns the same data", () => {
    const todos: Todo[] = [
      { id: 1, text: "buy milk" },
      { id: 2, text: "walk dog" },
    ];
    saveTodos(todos);
    expect(loadTodos()).toEqual(todos);
  });
});

describe("nextId", () => {
  test("returns 1 when no todos exist", () => {
    expect(nextId([])).toBe(1);
  });

  test("returns max+1 for existing todos", () => {
    expect(nextId([{ id: 1, text: "a" }, { id: 3, text: "b" }])).toBe(4);
  });

  test("never reuses a deleted id — after removing id 1 from [1,2], nextId returns 3", () => {
    const todos: Todo[] = [{ id: 1, text: "a" }, { id: 2, text: "b" }];
    todos.splice(todos.findIndex((t) => t.id === 1), 1);
    expect(nextId(todos)).toBe(3);
  });
});

describe("CLI: done command", () => {
  beforeEach(cleanDb);
  afterEach(cleanDb);

  test("done <id> removes the matching todo, saves, and exits 0", () => {
    seedDb([
      { id: 1, text: "buy milk" },
      { id: 2, text: "write tests" },
    ]);

    const proc = Bun.spawnSync(["bun", "run", "src/index.ts", "done", "1"], { cwd: CWD });

    expect(proc.exitCode).toBe(0);
    const remaining = loadTodos();
    expect(remaining).toHaveLength(1);
    expect(remaining[0].id).toBe(2);
  });

  test("done <nonexistent-id> writes error to stderr and exits 1", () => {
    seedDb([{ id: 1, text: "buy milk" }]);

    const proc = Bun.spawnSync(["bun", "run", "src/index.ts", "done", "99"], { cwd: CWD });

    expect(proc.exitCode).toBe(1);
    expect(proc.stderr.toString()).toContain("no todo with id 99");
    expect(loadTodos()).toHaveLength(1);
  });
});
