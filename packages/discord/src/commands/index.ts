import {
  AutocompleteInteraction,
  ChatInputCommandInteraction,
  Collection,
  SlashCommandBuilder,
  SlashCommandOptionsOnlyBuilder,
  SlashCommandSubcommandsOnlyBuilder,
} from "discord.js";

import ping from "./debug/ping";
import userInfo from "./debug/user_info";
import channel from "./channel";

const commands = new Collection<
  string,
  {
    data:
      | SlashCommandBuilder
      | SlashCommandOptionsOnlyBuilder
      | SlashCommandSubcommandsOnlyBuilder;
    execute: (interaction: ChatInputCommandInteraction) => void;
    autocomplete?: (interaction: AutocompleteInteraction) => void;
  }
>();

commands.set(ping.data.name, ping);
commands.set(userInfo.data.name, userInfo);
commands.set(channel.data.name, channel);

export default commands;
