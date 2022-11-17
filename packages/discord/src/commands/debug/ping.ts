import { CommandInteraction, SlashCommandBuilder } from "discord.js";

const data = new SlashCommandBuilder()
  .setName("ping")
  .setDescription("Replies with Pong!");

async function execute(interaction: CommandInteraction) {
  const start = new Date();
  await interaction.deferReply();
  const end = new Date();
  await interaction.editReply(`Pong! \`${end.getTime() - start.getTime()}ms\``);
}

export default { data, execute };
