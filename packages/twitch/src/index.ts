import type { AppRouter } from "@roboct0/api";
import { createTRPCClient, httpBatchLink } from "@trpc/client";

const trpc = createTRPCClient<AppRouter>({
  links: [httpBatchLink({ url: "http://localhost:3000" })],
});

const todo = await trpc.getTodo.query(1);

console.log(todo);

const createdTodo = await trpc.addTodo.mutate({ text: "Buy milk" });

console.log(createdTodo);
