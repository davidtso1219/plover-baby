import { test, expect, describe, beforeEach, afterEach } from "bun:test";
import { existsSync, writeFileSync, unlinkSync } from "fs";
import { join } from "path";
import type { Todo } from "./store";

const DB_PATH = join(import.meta.dir, "..", "todos.json");
const CWD = join(import.meta.dir, "..");

function cleanDb() {
  if (existsSync(DB_PATH)) unlinkSync(DB_PATH);
}

function seedDb(todos: Todo[]) {
  writeFileSync(DB_PATH, JSON.stringify(todos, null, 2));
}

function run(...args: string[]) {
  return Bun.spawnSync(["bun", "run", "src/index.ts", ...args], { cwd: CWD });
}

// Acceptance criteria from #29
describe("[QA] count command — acceptance criteria (#29)", () => {
  beforeEach(cleanDb);
  afterEach(cleanDb);

  test("AC1: count prints '0\\n' when no todos.json exists", () => {
    const proc = run("count");
    expect(proc.exitCode).toBe(0);
    expect(proc.stdout.toString()).toBe("0\n");
    expect(proc.stderr.toString()).toBe("");
  });

  test("AC2: count prints the number of todos followed by a newline, no extra text", () => {
    seedDb([
      { id: 1, text: "buy milk" },
      { id: 2, text: "write tests" },
      { id: 3, text: "ship it" },
    ]);
    const proc = run("count");
    expect(proc.exitCode).toBe(0);
    expect(proc.stdout.toString()).toBe("3\n");
  });

  test("AC3: count exits 0", () => {
    seedDb([{ id: 1, text: "one" }]);
    const proc = run("count");
    expect(proc.exitCode).toBe(0);
  });

  test("AC4: usage message on unknown command now includes 'count'", () => {
    const proc = run("unknown-command");
    expect(proc.exitCode).toBe(1);
    expect(proc.stderr.toString()).toContain("count");
  });
});

// Edge cases
describe("[QA] count command — edge cases", () => {
  beforeEach(cleanDb);
  afterEach(cleanDb);

  test("count on empty todos.json array prints '0\\n'", () => {
    writeFileSync(DB_PATH, JSON.stringify([]));
    const proc = run("count");
    expect(proc.exitCode).toBe(0);
    expect(proc.stdout.toString()).toBe("0\n");
  });

  test("count reflects state after add and done operations", () => {
    expect(run("add", "first").exitCode).toBe(0);
    expect(run("add", "second").exitCode).toBe(0);

    const afterTwo = run("count");
    expect(afterTwo.exitCode).toBe(0);
    expect(afterTwo.stdout.toString()).toBe("2\n");

    expect(run("done", "1").exitCode).toBe(0);

    const afterDone = run("count");
    expect(afterDone.exitCode).toBe(0);
    expect(afterDone.stdout.toString()).toBe("1\n");
  });
});
