import {
  AutocompleteInteraction,
  ChatInputCommandInteraction,
  SlashCommandSubcommandBuilder,
} from "discord.js";

const data = new SlashCommandSubcommandBuilder()
  .setName("add")
  .setDescription(
    "Adds a channel to the list of channels included on this server."
  )
  .addStringOption((option) =>
    option
      .setName("channel")
      .setDescription("The channel to add.")
      .setRequired(true)
      .setAutocomplete(true)
  );

async function execute(interaction: ChatInputCommandInteraction) {
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
    }
  );
  if (response.ok) {
    await interaction.editReply(`Successfully added channel ${channel}.`);
  } else {
    await interaction.editReply(`Failed to add channel ${channel}.`);
  }
}

async function autocomplete(interaction: AutocompleteInteraction) {
  const channel = interaction.options.getString("channel", true);
  const response = await fetch(
    `${process.env.API_URL}/channels?search=${channel}`,
    {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        "r0_key": process.env.R0_KEY!,
      },
    }
  );
  console.log(await response.json());
}

export default { data, execute, autocomplete };
