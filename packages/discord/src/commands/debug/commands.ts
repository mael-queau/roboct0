import {
  ChatInputCommandInteraction,
  Collection,
  SlashCommandBuilder,
} from "discord.js";
import commands from "..";
import deployCommands from "../deploy";

const data = new SlashCommandBuilder()
  .setName("commands")
  .setDescription("Manages the bot's commands")
  .addSubcommand((subcommand) =>
    subcommand
      .setName("deploy")
      .setDescription("Deploys slash commands for the bot")
      .addStringOption((option) =>
        option
          .setName("guild")
          .setDescription("The guild ID to deploy the commands to")
      )
  )
  .addSubcommand((subcommand) =>
    subcommand
      .setName("clear")
      .setDescription("Clears all the bot's commands")
      .addStringOption((option) =>
        option
          .setName("guild")
          .setDescription("The guild ID to clear the commands from")
      )
  );

const execute = async (interaction: ChatInputCommandInteraction) => {
  const subcommand = interaction.options.getSubcommand();
  const guild = interaction.options.getString("guild") ?? undefined;

  if (subcommand === "deploy") {
    try {
      await deployCommands(commands, guild);
    } catch (error) {
      await interaction.reply(
        `Failed to deploy commands${guild ? ` for guild ${guild} : " globally"}` : ""}`
      );
      console.error(error);
      return;
    }

    await interaction.reply(
      `Successfully deployed commands${guild ? ` for guild ${guild} : " globally"}` : ""}`
    );
  } else if (subcommand === "clear") {
    try {
      await deployCommands(new Collection(), guild);
    } catch (error) {
      await interaction.reply(
        `Failed to clear commands${guild ? ` for guild ${guild} : " globally"}` : ""}`
      );
      console.error(error);
      return;
    }

    await interaction.reply(
      `Successfully cleared commands${guild ? ` for guild ${guild} : " globally"}` : ""}`
    );
  }
};

export default {
  data,
  execute,
};
