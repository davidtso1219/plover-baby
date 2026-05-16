import { test, expect, describe, beforeEach, afterEach } from "bun:test";
import { existsSync, writeFileSync, unlinkSync } from "fs";
import { join } from "path";
import { loadTodos, type Todo } from "./store";

const DB_PATH = join(import.meta.dir, "..", "todos.json");
const CWD = join(import.meta.dir, "..");

function cleanDb() {
  if (existsSync(DB_PATH)) unlinkSync(DB_PATH);
}

function seedDb(todos: Todo[]) {
  writeFileSync(DB_PATH, JSON.stringify(todos, null, 2) + "\n");
}

function run(...args: string[]) {
  return Bun.spawnSync(["bun", "run", "src/index.ts", ...args], { cwd: CWD });
}

describe("[QA] done command — edge cases", () => {
  beforeEach(cleanDb);
  afterEach(cleanDb);

  test("done with no argument prints usage to stderr and exits 1", () => {
    const proc = run("done");
    expect(proc.exitCode).toBe(1);
    expect(proc.stderr.toString()).toContain("Usage: done <id>");
  });

  test("done with non-numeric id prints usage to stderr and exits 1", () => {
    seedDb([{ id: 1, text: "buy milk" }]);
    const proc = run("done", "abc");
    expect(proc.exitCode).toBe(1);
    expect(proc.stderr.toString()).toContain("Usage: done <id>");
    expect(loadTodos()).toHaveLength(1);
  });

  test("done on an empty list exits 1 with error message", () => {
    const proc = run("done", "1");
    expect(proc.exitCode).toBe(1);
    expect(proc.stderr.toString()).toContain("no todo with id 1");
  });
});

describe("[QA] full add → list → done workflow", () => {
  beforeEach(cleanDb);
  afterEach(cleanDb);

  test("add two todos, done the first, list shows only the second", () => {
    expect(run("add", "buy milk").exitCode).toBe(0);
    expect(run("add", "write tests").exitCode).toBe(0);

    const listBefore = run("list");
    expect(listBefore.exitCode).toBe(0);
    expect(listBefore.stdout.toString()).toContain("buy milk");
    expect(listBefore.stdout.toString()).toContain("write tests");

    const todos = loadTodos();
    const firstId = todos[0].id;
    expect(run("done", String(firstId)).exitCode).toBe(0);

    const listAfter = run("list");
    expect(listAfter.exitCode).toBe(0);
    expect(listAfter.stdout.toString()).not.toContain("buy milk");
    expect(listAfter.stdout.toString()).toContain("write tests");

    expect(loadTodos()).toHaveLength(1);
  });

  test("nextId does not reuse id after done removes a todo (end-to-end)", () => {
    run("add", "first");
    run("add", "second");

    const before = loadTodos();
    const firstId = before[0].id;
    run("done", String(firstId));

    run("add", "third");
    const after = loadTodos();
    const ids = after.map((t) => t.id);
    expect(ids).not.toContain(firstId);
    expect(Math.max(...ids)).toBe(firstId + 2);
  });
});
