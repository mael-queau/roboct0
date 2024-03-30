import { trpcServer } from "@hono/trpc-server";
import { Hono } from "hono";
import { appRouter } from "./routers";
import twitchRouter from "./twitch";

const app = new Hono();

app.use(
  "/trpc/*",
  trpcServer({
    router: appRouter,
  })
);

app.route("/twitch", twitchRouter);

export default {
  fetch: app.fetch,
  port: process.env.ROBOCT0_API_PORT ?? 3000,
};

export type AppRouter = typeof appRouter;
