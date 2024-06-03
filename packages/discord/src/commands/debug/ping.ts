import { ChatInputCommandInteraction, SlashCommandBuilder } from "discord.js";

const data = new SlashCommandBuilder()
  .setName("ping")
  .setDescription("Replies with Pong!");

const execute = async (interaction: ChatInputCommandInteraction) => {
  await interaction.reply("Pong!");
};

export default {
  data,
  execute,
};
