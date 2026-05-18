import { loadTodos, saveTodos, nextId } from "./store";

const [, , command, ...args] = process.argv;

switch (command) {
  case "add": {
    const text = args.join(" ");
    if (!text) {
      process.stderr.write("Usage: add <text>\n");
      process.exit(1);
    }
    const todos = loadTodos();
    todos.push({ id: nextId(todos), text });
    saveTodos(todos);
    break;
  }
  case "list": {
    const todos = loadTodos();
    for (const t of todos) {
      console.log(`[${t.id}] ${t.text}`);
    }
    break;
  }
  case "done": {
    const id = Number(args[0]);
    if (!args[0] || isNaN(id)) {
      process.stderr.write("Usage: done <id>\n");
      process.exit(1);
    }
    const todos = loadTodos();
    const idx = todos.findIndex((t) => t.id === id);
    if (idx === -1) {
      process.stderr.write(`Error: no todo with id ${id}\n`);
      process.exit(1);
    }
    todos.splice(idx, 1);
    saveTodos(todos);
    break;
  }
  case "count": {
    const todos = loadTodos();
    process.stdout.write(`${todos.length}\n`);
    break;
  }
  default: {
    process.stderr.write("Usage: add | list | done | count\n");
    process.exit(1);
  }
}
