import {
  AutocompleteInteraction,
  ChatInputCommandInteraction,
  SlashCommandBuilder,
} from "discord.js";
import add from "./add";

const data = new SlashCommandBuilder()
  .setName("channel")
  .setDescription(
    "Everything that has to do with Twitch channels registered with RobOct0."
  )
  .addSubcommand(add.data);

async function execute(interaction: ChatInputCommandInteraction) {
  const option = interaction.options.getSubcommand();
  if (option === "add") {
    add.execute(interaction);
  }
}

async function autocomplete(interaction: AutocompleteInteraction) {
  const option = interaction.options.getSubcommand();
  if (option === "add") {
    add.autocomplete(interaction);
  }
}

export default { data, execute, autocomplete };
