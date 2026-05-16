import { test, expect, describe, beforeEach, afterEach } from "bun:test";
import { existsSync, unlinkSync, writeFileSync } from "fs";
import { join } from "path";
import { type Todo } from "./store";

const DB_PATH = join(import.meta.dir, "..", "todos.json");
const CWD = join(import.meta.dir, "..");

function cleanDb() {
  if (existsSync(DB_PATH)) unlinkSync(DB_PATH);
}

function run(...args: string[]) {
  return Bun.spawnSync(["bun", "run", "src/index.ts", ...args], { cwd: CWD });
}

describe("[QA] add and list — integration", () => {
  beforeEach(cleanDb);
  afterEach(cleanDb);

  // Happy path: add produces no stdout output (silent success)
  test("add: exits 0 and produces no stdout output", () => {
    const proc = run("add", "silent add");
    expect(proc.exitCode).toBe(0);
    expect(proc.stdout.toString()).toBe("");
  });

  // Happy path: list format holds for multi-digit ids
  test("list: format [<id>] <text> is correct for ids >= 10", () => {
    const todos: Todo[] = Array.from({ length: 10 }, (_, i) => ({
      id: i + 1,
      text: `task ${i + 1}`,
    }));
    writeFileSync(DB_PATH, JSON.stringify(todos, null, 2));

    const proc = run("list");
    expect(proc.exitCode).toBe(0);
    const lines = proc.stdout.toString().trim().split("\n");
    expect(lines).toHaveLength(10);
    expect(lines[9]).toBe("[10] task 10");
  });

  // Edge case: text with special characters is preserved through JSON round-trip
  test("add: special characters in text are stored and listed correctly", () => {
    expect(run("add", "fix [bug] in <module> & retry").exitCode).toBe(0);
    const list = run("list");
    expect(list.exitCode).toBe(0);
    expect(list.stdout.toString().trim()).toBe("[1] fix [bug] in <module> & retry");
  });

  // Edge case: list output is stable across multiple invocations with no mutation
  test("list: repeated calls return identical output without modifying the store", () => {
    run("add", "stable item");
    const first = run("list").stdout.toString();
    const second = run("list").stdout.toString();
    expect(first).toBe(second);
  });
});
