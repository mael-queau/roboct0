import {
  ChatInputCommandInteraction,
  EmbedBuilder,
  SlashCommandSubcommandBuilder,
} from "discord.js";

const data = new SlashCommandSubcommandBuilder()
  .setName("list")
  .setDescription("Lists all channels included on this server.");

async function execute(interaction: ChatInputCommandInteraction) {
  try {
    await interaction.reply("Listing channels...");
    const response = await fetch(
      `${process.env.API_URL}/guilds/${interaction.guildId}/channels`,
      {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          "r0_key": process.env.R0_KEY!,
        },
      },
    );
    if (response.ok) {
      const result = await response.json();
      if (result.success) {
        // An embed listing channels (Twitch channels, not Discord channels)
        const embed = new EmbedBuilder()
          .setTitle("Channels")
          .setDescription(
            result.data
              .map((channel: any) => {
                return `• ${channel.username}`;
              })
              .join("\n"),
          );
        await interaction.editReply({ embeds: [embed] });
      } else {
        await interaction.editReply(`Failed to list channels.`);
      }
    }
  } catch (error) {
    console.error(error);
    await interaction.editReply(`Failed to list channels.`);
  }
}

export default { data, execute };
