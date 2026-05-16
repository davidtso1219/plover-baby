import { test, expect, describe, beforeEach, afterEach } from "bun:test";
import { existsSync, mkdtempSync, rmSync, writeFileSync } from "fs";
import { join } from "path";
import { tmpdir } from "os";
import { loadTodos, saveTodos, nextId, type Todo } from "./store";

// Each test uses its own temp directory so there is no shared state
function makeTmpDir() {
  return mkdtempSync(join(tmpdir(), "qa-store-"));
}

// --- Acceptance criteria: loadTodos returns [] when file is absent ---
describe("[QA] loadTodos — acceptance criteria", () => {
  test("returns [] when todos.json does not exist (ENOENT)", () => {
    const dir = makeTmpDir();
    try {
      expect(loadTodos(join(dir, "todos.json"))).toEqual([]);
    } finally {
      rmSync(dir, { recursive: true });
    }
  });

  test("returns [] when todos.json is present but empty", () => {
    const dir = makeTmpDir();
    const file = join(dir, "todos.json");
    try {
      writeFileSync(file, "");
      expect(loadTodos(file)).toEqual([]);
    } finally {
      rmSync(dir, { recursive: true });
    }
  });
});

// --- saveTodos / loadTodos round-trip ---
describe("[QA] saveTodos → loadTodos round-trip", () => {
  test("written todos are read back with all fields intact", () => {
    const dir = makeTmpDir();
    const file = join(dir, "todos.json");
    try {
      const todos: Todo[] = [
        { id: 1, text: "buy milk" },
        { id: 3, text: "write tests" },
      ];
      saveTodos(todos, file);
      const loaded = loadTodos(file);
      expect(loaded).toEqual(todos);
    } finally {
      rmSync(dir, { recursive: true });
    }
  });

  test("saving an empty array and reloading returns []", () => {
    const dir = makeTmpDir();
    const file = join(dir, "todos.json");
    try {
      saveTodos([], file);
      expect(loadTodos(file)).toEqual([]);
    } finally {
      rmSync(dir, { recursive: true });
    }
  });
});

// --- nextId: acceptance criteria ---
describe("[QA] nextId — acceptance criteria", () => {
  test("nextId([{id:1},{id:3}]) returns 4 (max+1, not gap-fill)", () => {
    expect(nextId([{ id: 1, text: "a" }, { id: 3, text: "b" }])).toBe(4);
  });
});

// --- E2e: sequential add commands accumulate todos ---
describe("[QA] CLI e2e — accumulation and uniqueness", () => {
  const CWD = join(import.meta.dir, "..");
  const DB = join(CWD, "todos.json");

  function run(...args: string[]) {
    return Bun.spawnSync(["bun", "run", "src/index.ts", ...args], { cwd: CWD });
  }

  beforeEach(() => { if (existsSync(DB)) rmSync(DB); });
  afterEach(() => { if (existsSync(DB)) rmSync(DB); });

  test("three sequential adds each get a unique, increasing id", () => {
    run("add", "first");
    run("add", "second");
    run("add", "third");

    const todos = loadTodos(DB);
    expect(todos).toHaveLength(3);
    const ids = todos.map((t) => t.id);
    expect(new Set(ids).size).toBe(3);
    expect(ids[0]).toBeLessThan(ids[1]);
    expect(ids[1]).toBeLessThan(ids[2]);
  });

  test("done on a missing id leaves the file unchanged", () => {
    run("add", "only todo");
    const before = loadTodos(DB);

    const proc = run("done", "999");
    expect(proc.exitCode).toBe(1);
    expect(proc.stderr.toString()).toContain("no todo with id 999");

    const after = loadTodos(DB);
    expect(after).toEqual(before);
  });
});
