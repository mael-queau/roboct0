import express from "express";
import dotenv from "dotenv/config";
import dotenvExpand from "dotenv-expand";
import { PrismaClient } from "@prisma/client";
import * as twitch_oauth from "./oauth/twitch";
import * as discord_oauth from "./oauth/discord";
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

discord_oauth.verifyAllTokens().then((invalidChannels) => {
  invalidChannels.forEach(discord_oauth.refreshToken);
});

twitch_oauth.verifyAllTokens().then((invalidChannels) => {
  invalidChannels.forEach(twitch_oauth.refreshToken);
});

setInterval(() => {
  twitch_oauth.verifyAllTokens().then((invalidChannels) => {
    invalidChannels.forEach(twitch_oauth.refreshToken);
  });
}, 3600000);

import oauth from "./oauth";
server.use("", oauth);

server.listen(port, () => {
  console.log(`🚀 API is listening on port ${port}`.dim);
});
