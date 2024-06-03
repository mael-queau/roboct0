import { REST, Routes } from "discord.js";
import { LOGGER } from "../logger";
import type { CommandsCollection } from "../types/commands";

export default async function deployCommands(
  commands: CommandsCollection,
  guildId?: string
) {
  if (!process.env.DISCORD_CLIENT_ID) {
    throw new Error("DISCORD_CLIENT_ID is required");
  }

  if (!process.env.DISCORD_CLIENT_SECRET) {
    throw new Error("DISCORD_SECRET is required");
  }

  if (!process.env.DISCORD_TOKEN) {
    throw new Error("DISCORD_TOKEN is required");
  }

  const rest = new REST().setToken(process.env.DISCORD_TOKEN);

  try {
    LOGGER.info(
      `Started refreshing ${commands.size} application (/) commands${
        guildId ? ` for guild ${guildId}` : " globally"
      }`
    );

    if (!guildId) {
      await rest.put(
        Routes.applicationCommands(process.env.DISCORD_CLIENT_ID),
        { body: commands.map((command) => command.data.toJSON()) }
      );

      LOGGER.info(`Successfully reloaded application (/) commands globally`);

      return;
    } else {
      await rest.put(
        Routes.applicationGuildCommands(process.env.DISCORD_CLIENT_ID, guildId),
        { body: commands.map((command) => command.data.toJSON()) }
      );

      LOGGER.info(
        `Successfully reloaded application (/) commands in guild ${guildId}`
      );
    }
  } catch (error) {
    console.error(error);
  }
}
