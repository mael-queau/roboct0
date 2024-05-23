import type { AppRouter } from "@roboct0/api";
import { createTRPCClient, httpBatchLink } from "@trpc/client";
import { ApiClient } from "@twurple/api";
import { RefreshingAuthProvider } from "@twurple/auth";
import { ChatClient } from "@twurple/chat";
import superjson from "superjson";
import { LOGGER } from "./logger";

const trpc = createTRPCClient<AppRouter>({
  links: [
    httpBatchLink({
      url: `${process.env.ROBOCT0_API_URL}/trpc`,
      transformer: superjson,
    }),
  ],
});

if (!process.env.TWITCH_CLIENT_ID) {
  throw new Error("TWITCH_CLIENT_ID is required");
}

if (!process.env.TWITCH_CLIENT_SECRET) {
  throw new Error("TWITCH_CLIENT_SECRET is required");
}

const authProvider = new RefreshingAuthProvider({
  clientId: process.env.TWITCH_CLIENT_ID,
  clientSecret: process.env.TWITCH_CLIENT_SECRET,
});

authProvider.onRefresh(async (userId, newTokenData) => {
  LOGGER.log(`🔄 Refreshing token for user ${userId}`);

  try {
    await trpc.twitchToken.updateToken.mutate({
      userId,
      accessToken: newTokenData.accessToken,
      refreshToken: newTokenData.refreshToken,
      expiresIn: newTokenData.expiresIn,
      obtainedAt: new Date(newTokenData.obtainmentTimestamp),
    });

    LOGGER.log(`✅ Refreshed token for user ${userId}`);
  } catch (error) {
    LOGGER.error(
      `❌ Failed to refresh token for user ${userId}`,
      error instanceof Error ? error : undefined
    );
  }
});

authProvider.onRefreshFailure(async (userId, error) => {
  LOGGER.error(
    `❌ Failed to refresh token for user ${userId}`,
    error instanceof Error ? error : undefined
  );
});

const botToken = await trpc.twitchToken.getBotToken.query();

if (!botToken) {
  throw new Error("Bot token not found");
}

await authProvider.addUserForToken(
  {
    refreshToken: botToken.refreshToken,
    accessToken: botToken.accessToken,
    expiresIn: botToken.expiresIn,
    obtainmentTimestamp: botToken.obtainedAt.getTime(),
  },
  ["chat:read", "chat:edit"]
);

const client = new ChatClient({
  authProvider,
  authIntents: ["chat:read", "chat:edit"],
  channels: ["roboct0"],
});

const apiClient = new ApiClient({ authProvider });

client.connect();

client.onConnect(() => {
  LOGGER.log("🚀 Connected to Twitch chat");
});

client.onMessage((channel, user, message, msg) => {
  if (user === "roboct0") {
    return;
  }

  const args = message.split(" ");

  if (!message.startsWith("!")) {
    return;
  }

  const command = args.shift()?.slice(1);

  if (command === "ping") {
    client.say(channel, "Pong!");
  }
});
