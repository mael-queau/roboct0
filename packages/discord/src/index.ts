import type { AppRouter } from "@roboct0/api";
import { createTRPCClient, httpBatchLink } from "@trpc/client";
import { Client, Events, GatewayIntentBits } from "discord.js";
import superjson from "superjson";

import commands from "./commands";
import { LOGGER } from "./logger";

if (!process.env.ROBOCT0_API_URL) {
  throw new Error("ROBOCT0_API_URL is not set");
}

if (!process.env.DISCORD_CLIENT_ID) {
  throw new Error("DISCORD_CLIENT_ID is required");
}

if (!process.env.DISCORD_CLIENT_SECRET) {
  throw new Error("DISCORD_SECRET is required");
}

if (!process.env.DISCORD_TOKEN) {
  throw new Error("DISCORD_TOKEN is required");
}

const trpc = createTRPCClient<AppRouter>({
  links: [
    httpBatchLink({
      url: `${process.env.ROBOCT0_API_URL}/trpc`,
      transformer: superjson,
    }),
  ],
});

// Create a new client instance
const client = new Client({ intents: [GatewayIntentBits.Guilds] });

// When the client is ready, run this code (only once).
// The distinction between `client: Client<boolean>` and `readyClient: Client<true>` is important for TypeScript developers.
// It makes some properties non-nullable.
client.once(Events.ClientReady, (readyClient) => {
  LOGGER.log(`Logged in as ${readyClient.user.tag}`);
});

// Log in to Discord with your client's token
client.login(process.env.DISCORD_TOKEN);

client.on(Events.InteractionCreate, (interaction) => {
  if (interaction.isChatInputCommand()) {
    const command = commands.get(interaction.commandName);

    if (!command) return;

    command.execute(interaction);
  }
});

export { client, trpc };
