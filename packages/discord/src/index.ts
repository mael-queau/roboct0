import { Client, Events, GatewayIntentBits, REST, Routes } from "discord.js";
import dotenv from "dotenv";
import dotenvExpand from "dotenv-expand";

import commands from "./commands";

dotenvExpand.expand(dotenv.config());

type ClientWithCommands = Client & { commands: typeof commands };

const client = new Client({
  intents: [GatewayIntentBits.Guilds],
}) as ClientWithCommands;

client.commands = commands;

async function registerCommands() {
  try {
    const rest = new REST({ version: "10" }).setToken(
      process.env.DISCORD_TOKEN!
    );

    console.log("Started refreshing application (/) commands.");

    if (process.env.NODE_ENV === "production") {
      await rest.put(
        Routes.applicationCommands(process.env.DISCORD_CLIENT_ID!),
        {
          body: commands.map((command) => command.data.toJSON()),
        }
      );
    } else {
      await rest.put(
        Routes.applicationGuildCommands(
          process.env.DISCORD_CLIENT_ID!,
          process.env.DISCORD_GUILD_ID!
        ),
        {
          body: commands.map((command) => command.data.toJSON()),
        }
      );
    }

    console.log("Successfully reloaded application (/) commands.");
  } catch (error) {
    console.error(error);
  }
}

client.once(Events.ClientReady, (client) => {
  console.log(`Logged in as ${client.user.tag}!`);
  registerCommands();
});

client.on("interactionCreate", async (interaction) => {
  if (interaction.isChatInputCommand()) {
    try {
      client.commands.get(interaction.commandName)?.execute(interaction);
    } catch (error) {
      console.error(error);
      await interaction.reply({
        content: "There was an error while executing this command!",
        ephemeral: true,
      });
    }
  } else if (interaction.isAutocomplete()) {
    try {
      const autocomplete = client.commands.get(
        interaction.commandName
      )?.autocomplete;

      if (autocomplete) {
        autocomplete(interaction);
      }
    } catch (error) {
      console.error(error);
    }
  }
});

client.login(process.env.DISCORD_TOKEN);
