import { test, expect } from "bun:test";
import { greet } from "./greet";

// Unit tests for greet()
test("greet with name returns 'Hello, <name>!'", () => {
  expect(greet("Alice")).toBe("Hello, Alice!");
});

test("greet with no argument returns 'Hello, world!'", () => {
  expect(greet()).toBe("Hello, world!");
});
