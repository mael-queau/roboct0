import { router } from "../trpc";
import { twitchTokenRouter } from "./twitch/token";

export const appRouter = router({
  twitchToken: twitchTokenRouter,
});
