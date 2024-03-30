import type { AppRouter } from "@roboct0/api";
import { createTRPCClient, httpBatchLink } from "@trpc/client";

const trpc = createTRPCClient<AppRouter>({
  links: [httpBatchLink({ url: `${process.env.ROBOCT0_API_URL}/trpc` })],
});

await trpc.todo.createTodo.mutate({ text: "Hello, world!" });

const todos = await trpc.todo.listTodos.query();

console.log(todos);
