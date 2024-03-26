import { createHTTPServer } from "@trpc/server/adapters/standalone";
import { todoRouter } from "./routers/todo";
import { router } from "./trpc";

const appRouter = router({
  todo: todoRouter,
});

const server = createHTTPServer({
  router: appRouter,
});

server.listen(3000, () => {
  console.log("Listening on http://localhost:3000");
});

console.log(process.env.DATABASE_URL);

export type AppRouter = typeof appRouter;
