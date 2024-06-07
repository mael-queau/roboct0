import {
  AutocompleteInteraction,
  ChatInputCommandInteraction,
  SlashCommandBuilder,
} from "discord.js";
import { trpc } from "..";

const data = new SlashCommandBuilder()
  .setName("channel")
  .setDescription("Manages the bot's channels")
  .addSubcommand((subcommand) =>
    subcommand
      .setName("add")
      .setDescription("Adds a registered Twitch channel to the server")
      .addStringOption((option) =>
        option
          .setName("channel")
          .setDescription("The Twitch channel to add")
          .setRequired(true)
          .setAutocomplete(true)
      )
  );

const autocomplete = async (interaction: AutocompleteInteraction) => {
  const query = interaction.options.getString("channel")!;

  const channels = await trpc.twitchChannel.searchChannels.query({
    query,
  });

  const options = channels.map((channel) => ({
    name: channel.userName,
    value: channel.id,
  }));

  await interaction.respond(options);
};

const execute = async (interaction: ChatInputCommandInteraction) => {
  const subcommand = interaction.options.getSubcommand();
};

export default {
  data,
  execute,
  autocomplete,
};
