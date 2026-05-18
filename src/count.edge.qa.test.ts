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

describe("[QA] count command — additional edge cases", () => {
  beforeEach(cleanDb);
  afterEach(cleanDb);

  test("count with extra arguments ignores them and returns the correct total", () => {
    run("add", "buy milk");
    run("add", "walk dog");
    const proc = run("count", "extra-arg", "another");
    expect(proc.exitCode).toBe(0);
    expect(proc.stdout.toString().trim()).toBe("2");
  });

  test("count with malformed JSON in todos.json exits non-zero with no count on stdout", () => {
    writeFileSync(DB_PATH, "{ not valid json ]]]");
    const proc = run("count");
    expect(proc.exitCode).not.toBe(0);
    expect(proc.stdout.toString().trim()).toBe("");
  });
});
