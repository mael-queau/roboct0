import express from "express";
import dotenv from "dotenv/config";
import dotenvExpand from "dotenv-expand";
import { PrismaClient } from "@prisma/client";
import * as twitch_oauth from "./oauth/twitch";
import * as discord_oauth from "./oauth/discord";
import * as bot_oauth from "./oauth/bot";
import "colors";

dotenvExpand.expand(dotenv);

const server = express();
server.use(express.json());
server.use(express.urlencoded({ extended: true }));
const port = process.env.PORT ?? "3000";

import api from "./api";
server.use("/api", api);

const prisma = new PrismaClient();
prisma.state.deleteMany({});

/***** Bot Oauth2 *****/

bot_oauth.checkAndRefresh().catch((error) => {
  console.error(`[FATAL BOT OAUTH ERROR] SHUTTING DOWN`.bgYellow);
  console.error(error);
  process.exit(1);
});

setInterval(() => {
  bot_oauth.checkAndRefresh().catch((error) => {
    console.error(`[FATAL BOT OAUTH ERROR] SHUTTING DOWN`.bgYellow);
    console.error(error);
    process.exit(1);
  });
}, 1000 * 60 * 60);

/***** User OAuth2 *****/

import oauth from "./oauth";
server.use("", oauth);

discord_oauth.verifyAllTokens().then((invalidGuilds) => {
  invalidGuilds.forEach(discord_oauth.refreshToken);
});

twitch_oauth.verifyAllTokens().then((invalidChannels) => {
  invalidChannels.forEach(twitch_oauth.refreshToken);
});

setInterval(() => {
  twitch_oauth.verifyAllTokens().then((invalidChannels) => {
    invalidChannels.forEach(twitch_oauth.refreshToken);
  });
}, 1000 * 60 * 60);

server.listen(port, () => {
  console.log(`🚀 API is listening on port ${port}`.dim);
});
