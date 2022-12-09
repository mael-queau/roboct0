import {
  AutocompleteInteraction,
  ChatInputCommandInteraction,
  SlashCommandSubcommandBuilder,
} from "discord.js";

const data = new SlashCommandSubcommandBuilder()
  .setName("add")
  .setDescription(
    "Adds a channel to the list of channels included on this server.",
  )
  .addStringOption((option) =>
    option
      .setName("channel")
      .setDescription("The channel to add.")
      .setRequired(true)
      .setAutocomplete(true)
  );

async function execute(interaction: ChatInputCommandInteraction) {
  try {
    const channel = interaction.options.getString("channel", true);
    await interaction.reply(`Adding channel ${channel}...`);
    const response = await fetch(
      `${process.env.API_URL}/guilds/${interaction.guildId}/channels`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "r0_key": process.env.R0_KEY!,
        },
        body: JSON.stringify({
          channelId: channel,
        }),
      },
    );
    if (response.ok) {
      const result = await response.json();
      if (result.success) {
        await interaction.editReply(`Successfully added channel ${channel}.`);
      } else {
        await interaction.editReply(`Failed to add channel ${channel}.`);
      }
    } else {
      if (response.status == 409) {
        await interaction.editReply(
          `Channel ${channel} is already included on this server.`,
        );
      } else {
        console.log(
          `${"[ERROR]".red} ❌ Got status code ${response.status} when adding channel ${
            `${channel}`.blue
          } to guild ${`${interaction.guildId}`.blue}.`,
        );
        await interaction.editReply(`Failed to add channel ${channel}.`);
      }
    }
  } catch (error) {
    console.error(error);
    await interaction.editReply(`Failed to add channel.`);
  }
}

async function autocomplete(interaction: AutocompleteInteraction) {
  try {
    const channel = interaction.options.getString("channel", true);
    const response = await fetch(
      `${process.env.API_URL}/channels?search=${channel}`,
      {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          "r0_key": process.env.R0_KEY!,
        },
      },
    );
    if (response.status == 404) {
      interaction.respond([]);
    } else {
      const result = await response.json();
      if (result.success) {
        interaction.respond(result.data.map((channel: any) => ({
          name: channel.username,
          value: channel.channelId,
        })));
      } else {
        interaction.respond([]);
      }
    }
  } catch (error) {
    console.error(error);
    interaction.respond([]);
  }
}

export default { data, execute, autocomplete };
