import { describe, it, expect } from "bun:test";
import { spawnSync } from "child_process";

function runCLI(...args: string[]): { stdout: string; stderr: string; exitCode: number } {
  const result = spawnSync("bun", ["run", "src/index.ts", ...args], {
    cwd: process.cwd(),
    encoding: "utf8",
  });
  return {
    stdout: (result.stdout ?? "").trim(),
    stderr: (result.stderr ?? "").trim(),
    exitCode: result.status ?? -1,
  };
}

describe("src/index.ts CLI entry point", () => {
  it("happy path: prints 'Hello, Alice!' when called with 'Alice'", () => {
    const { stdout, exitCode } = runCLI("Alice");
    expect(exitCode).toBe(0);
    expect(stdout).toBe("Hello, Alice!");
  });

  it("no-arg fallback: prints 'Hello, world!' when called with no arguments", () => {
    const { stdout, exitCode } = runCLI();
    expect(exitCode).toBe(0);
    expect(stdout).toBe("Hello, world!");
  });

  it("edge case: empty string arg falls back to 'Hello, world!'", () => {
    const { stdout, exitCode } = runCLI("");
    expect(exitCode).toBe(0);
    expect(stdout).toBe("Hello, world!");
  });

  it("edge case: only first argument is used when multiple args are given", () => {
    const { stdout, exitCode } = runCLI("Bob", "Charlie");
    expect(exitCode).toBe(0);
    expect(stdout).toBe("Hello, Bob!");
  });
});
