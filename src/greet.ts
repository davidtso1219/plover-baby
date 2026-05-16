export function greet(name?: string): string {
  if (!name) return "Hello, world!";
  return `Hello, ${name}!`;
}
