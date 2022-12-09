import {
  AutocompleteInteraction,
  ChatInputCommandInteraction,
  SlashCommandBuilder,
} from "discord.js";
import add from "./add";
import list from "./list";

const data = new SlashCommandBuilder()
  .setName("channel")
  .setDescription(
    "Everything that has to do with Twitch channels registered with RobOct0.",
  )
  .addSubcommand(add.data)
  .addSubcommand(list.data);

async function execute(interaction: ChatInputCommandInteraction) {
  const option = interaction.options.getSubcommand();
  switch (option) {
    case "add":
      await add.execute(interaction);
      break;
    case "list":
      await list.execute(interaction);
      break;
  }
}

async function autocomplete(interaction: AutocompleteInteraction) {
  const option = interaction.options.getSubcommand();
  switch (option) {
    case "add":
      await add.autocomplete(interaction);
      break;
  }
}

export default { data, execute, autocomplete };
