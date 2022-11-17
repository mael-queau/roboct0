import { ChatInputCommandInteraction, SlashCommandBuilder } from "discord.js";

const data = new SlashCommandBuilder()
  .setName("user")
  .setDescription("Provides information about a user.");

async function execute(interaction: ChatInputCommandInteraction) {
  await interaction.reply(
    `This command was run by ${interaction.user.username}.`
  );
}

export default { data, execute };
