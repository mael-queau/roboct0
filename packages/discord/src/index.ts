import type { AppRouter } from "@roboct0/api";
import { createTRPCClient, httpBatchLink } from "@trpc/client";

const trpc = createTRPCClient<AppRouter>({
  links: [httpBatchLink({ url: "http://localhost:3000" })],
});

await trpc.todo.createTodo.mutate({ text: "Hello, world!" });

const todos = await trpc.todo.listTodos.query();

console.log(todos);
