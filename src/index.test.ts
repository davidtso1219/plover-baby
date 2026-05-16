import { test, expect, describe, beforeEach, afterEach } from "bun:test";
import { existsSync, unlinkSync } from "fs";
import { join } from "path";

const DATA_FILE = join(import.meta.dir, "..", "todos.json");
const CWD = join(import.meta.dir, "..");

function cleanup() {
  if (existsSync(DATA_FILE)) unlinkSync(DATA_FILE);
}

describe("CLI: add and list commands", () => {
  beforeEach(cleanup);
  afterEach(cleanup);

  // Happy path: add a todo and list it
  test("add: stores a todo with id=1 on first add", () => {
    const add = Bun.spawnSync(["bun", "run", "src/index.ts", "add", "buy milk"], { cwd: CWD });
    expect(add.exitCode).toBe(0);

    const list = Bun.spawnSync(["bun", "run", "src/index.ts", "list"], { cwd: CWD });
    expect(list.stdout.toString().trim()).toBe("[1] buy milk");
    expect(list.exitCode).toBe(0);
  });

  // Happy path: list on empty / missing file prints nothing
  test("list: prints nothing when todos.json does not exist", () => {
    const proc = Bun.spawnSync(["bun", "run", "src/index.ts", "list"], { cwd: CWD });
    expect(proc.exitCode).toBe(0);
    expect(proc.stdout.toString().trim()).toBe("");
  });

  // Happy path: ids auto-increment across multiple adds
  test("add: auto-increments id for sequential adds", () => {
    Bun.spawnSync(["bun", "run", "src/index.ts", "add", "first"], { cwd: CWD });
    Bun.spawnSync(["bun", "run", "src/index.ts", "add", "second"], { cwd: CWD });

    const list = Bun.spawnSync(["bun", "run", "src/index.ts", "list"], { cwd: CWD });
    expect(list.stdout.toString().trim()).toBe("[1] first\n[2] second");
    expect(list.exitCode).toBe(0);
  });

  // Edge case: add with no text exits 1 with usage message
  test("add: exits 1 with usage when text argument is missing", () => {
    const proc = Bun.spawnSync(["bun", "run", "src/index.ts", "add"], { cwd: CWD });
    expect(proc.exitCode).toBe(1);
    expect(proc.stderr.toString()).toContain("Usage:");
  });

  // Edge case: unknown command exits 1 with usage message
  test("unknown command: exits 1 with usage message", () => {
    const proc = Bun.spawnSync(["bun", "run", "src/index.ts", "foo"], { cwd: CWD });
    expect(proc.exitCode).toBe(1);
    expect(proc.stderr.toString()).toContain("Usage:");
  });
});
