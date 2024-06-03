import { trpcServer } from "@hono/trpc-server";
import type { Serve } from "bun";
import { Hono } from "hono";
import { logger as honoLogger } from "hono/logger";
import { LOGGER } from "./logger";
import { appRouter } from "./routers";

import discordRouter from "./discord";
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
app.route("/discord", discordRouter);

export default {
  fetch: app.fetch,
  port: process.env.ROBOCT0_API_PORT ?? 3000,
} satisfies Serve;

export type AppRouter = typeof appRouter;
