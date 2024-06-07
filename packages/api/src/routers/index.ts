import { router } from "../trpc";
import { twitchChannelRouter } from "./twitch/channel";
import { twitchTokenRouter } from "./twitch/token";

export const appRouter = router({
  twitchToken: twitchTokenRouter,
  twitchChannel: twitchChannelRouter,
});
