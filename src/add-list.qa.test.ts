import { test, expect, describe, beforeEach, afterEach } from "bun:test";
import { existsSync, writeFileSync, unlinkSync } from "fs";
import { join } from "path";

const DB_PATH = join(import.meta.dir, "..", "todos.json");
const CWD = join(import.meta.dir, "..");

function cleanDb() {
  if (existsSync(DB_PATH)) unlinkSync(DB_PATH);
}

function run(...args: string[]) {
  return Bun.spawnSync(["bun", "run", "src/index.ts", ...args], { cwd: CWD });
}

// Acceptance criteria from #23
describe("[QA] add and list — acceptance criteria (#23)", () => {
  beforeEach(cleanDb);
  afterEach(cleanDb);

  test("AC1: add 'buy milk' then list prints '[1] buy milk'", () => {
    expect(run("add", "buy milk").exitCode).toBe(0);
    const list = run("list");
    expect(list.exitCode).toBe(0);
    expect(list.stdout.toString().trim()).toBe("[1] buy milk");
  });

  test("AC2: add twice then list prints both entries with ids 1 and 2 in order", () => {
    expect(run("add", "first task").exitCode).toBe(0);
    expect(run("add", "second task").exitCode).toBe(0);
    const list = run("list");
    expect(list.exitCode).toBe(0);
    const lines = list.stdout.toString().trim().split("\n");
    expect(lines).toHaveLength(2);
    expect(lines[0]).toBe("[1] first task");
    expect(lines[1]).toBe("[2] second task");
  });

  test("AC3: list on missing todos.json prints nothing and exits 0", () => {
    const proc = run("list");
    expect(proc.exitCode).toBe(0);
    expect(proc.stdout.toString().trim()).toBe("");
  });
});

// Edge cases not covered by existing tests
describe("[QA] add and list — edge cases", () => {
  beforeEach(cleanDb);
  afterEach(cleanDb);

  test("add with multiple separate argv tokens joins them into a single text", () => {
    // args.join(" ") should concatenate: ["buy", "fresh", "milk"] → "buy fresh milk"
    expect(run("add", "buy", "fresh", "milk").exitCode).toBe(0);
    const list = run("list");
    expect(list.exitCode).toBe(0);
    expect(list.stdout.toString().trim()).toBe("[1] buy fresh milk");
  });

  test("list on todos.json containing an empty array prints nothing and exits 0", () => {
    // File exists but holds [] — distinct from missing file (tests the raw="" branch)
    writeFileSync(DB_PATH, JSON.stringify([]) + "\n");
    const proc = run("list");
    expect(proc.exitCode).toBe(0);
    expect(proc.stdout.toString().trim()).toBe("");
  });
});
