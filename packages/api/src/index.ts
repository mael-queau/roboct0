import { trpcServer } from "@hono/trpc-server";
import { Hono } from "hono";
import { logger as honoLogger } from "hono/logger";
import { LOGGER } from "./logger";
import { appRouter } from "./routers";
import twitchRouter from "./twitch";

const app = new Hono();

app.use(
  "/trpc/*",
  trpcServer({
    router: appRouter,
  }),
  honoLogger((msg) => LOGGER.log(msg))
);

app.route("/twitch", twitchRouter);

export default {
  fetch: app.fetch,
  port: process.env.ROBOCT0_API_PORT ?? 3000,
};

export type AppRouter = typeof appRouter;
