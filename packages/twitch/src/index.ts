import type { AppRouter } from "@roboct0/api";
import { createTRPCClient, httpBatchLink } from "@trpc/client";
import { ApiClient } from "@twurple/api";
import { RefreshingAuthProvider } from "@twurple/auth";
import { Bot, createBotCommand } from "@twurple/easy-bot";
import superjson from "superjson";
import commands from "./commands";
import { LOGGER } from "./logger";

if (!process.env.ROBOCT0_API_URL) {
  throw new Error("ROBOCT0_API_URL is not set");
}

if (!process.env.TWITCH_CLIENT_ID) {
  throw new Error("TWITCH_CLIENT_ID is required");
}

if (!process.env.TWITCH_CLIENT_SECRET) {
  throw new Error("TWITCH_CLIENT_SECRET is required");
}

const trpc = createTRPCClient<AppRouter>({
  links: [
    httpBatchLink({
      url: `${process.env.ROBOCT0_API_URL}/trpc`,
      transformer: superjson,
    }),
  ],
});

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
  [
    "chat:read",
    "chat:edit",
    "whispers:read",
    "whispers:edit",
    "user:manage:whispers",
  ]
);

const apiClient = new ApiClient({
  authProvider,
  logger: {
    colors: true,
    emoji: true,
    timestamps: true,
  },
});

const bot = new Bot({
  authProvider,
  chatClientOptions: {
    authIntents: ["chat:read", "chat:edit"],
  },
  channels: ["roboct0"],
  commands: commands.map((command) =>
    createBotCommand(command.keyword, (params, context) =>
      command.execute(params, context)
    )
  ),
});

bot.onConnect(() => {
  LOGGER.log("🚀 Connected to Twitch chat");
});

export const botUserId = botToken.userId;

export { apiClient, bot };
