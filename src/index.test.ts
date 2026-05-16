import { test, expect, beforeEach, afterEach } from "bun:test";
import { existsSync, rmSync } from "fs";
import { join } from "path";

const REPO_ROOT = join(import.meta.dir, "..");
const TODOS_FILE = join(REPO_ROOT, "todos.json");

function runCLI(...args: string[]) {
  return Bun.spawnSync(["bun", "run", "src/index.ts", ...args], {
    cwd: REPO_ROOT,
  });
}

beforeEach(() => {
  if (existsSync(TODOS_FILE)) rmSync(TODOS_FILE);
});

afterEach(() => {
  if (existsSync(TODOS_FILE)) rmSync(TODOS_FILE);
});

test("no args: exits 1 with usage hint to stderr", () => {
  const proc = runCLI();
  expect(proc.exitCode).toBe(1);
  expect(proc.stderr.toString()).toContain("Unknown command");
});

test("list with no todos.json: exits 0 with empty output", () => {
  const proc = runCLI("list");
  expect(proc.exitCode).toBe(0);
  expect(proc.stdout.toString().trim()).toBe("");
});

test("add then list: stores a todo and retrieves it", () => {
  const addProc = runCLI("add", "buy milk");
  expect(addProc.exitCode).toBe(0);

  const listProc = runCLI("list");
  expect(listProc.exitCode).toBe(0);
  expect(listProc.stdout.toString()).toContain("buy milk");
});

test("add with no text: exits 1 and prints usage to stderr", () => {
  const proc = runCLI("add");
  expect(proc.exitCode).toBe(1);
  expect(proc.stderr.toString()).toContain("Usage:");
});

test("add with multi-word text: full text is stored", () => {
  runCLI("add", "take", "out", "trash");
  const listProc = runCLI("list");
  expect(listProc.exitCode).toBe(0);
  expect(listProc.stdout.toString()).toContain("take out trash");
});

test("done with no id: exits 1 with usage to stderr", () => {
  const proc = runCLI("done");
  expect(proc.exitCode).toBe(1);
  expect(proc.stderr.toString()).toContain("Usage:");
});
