import { createHTTPServer } from "@trpc/server/adapters/standalone";
import { z } from "zod";
import { publicProcedure, router } from "./trpc";

const appRouter = router({
  listTodos: publicProcedure.query(async () => {
    const todos = await Promise.resolve([
      { id: 1, text: "Buy milk", completed: false },
      { id: 2, text: "Walk the dog", completed: true },
    ]);

    return todos;
  }),
  getTodo: publicProcedure.input(z.number()).query(async ({ input }) => {
    const user = await Promise.resolve({
      id: input,
      text: "Buy milk",
      completed: false,
    });
    return user;
  }),
  addTodo: publicProcedure
    .input(z.object({ text: z.string() }))
    .mutation(async ({ input }) => {
      const todo = await Promise.resolve({
        id: 3,
        text: input.text,
        completed: false,
      });
      return todo;
    }),
});

const server = createHTTPServer({
  router: appRouter,
});

server.listen(3000, () => {
  console.log("Listening on http://localhost:3000");
});

export type AppRouter = typeof appRouter;
