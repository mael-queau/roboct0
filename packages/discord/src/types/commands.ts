import type {
  ChatInputCommandInteraction,
  Collection,
  SlashCommandBuilder,
} from "discord.js";

export interface Command {
  data: SlashCommandBuilder | SlashCommandSubcommandsOnlyBuilder;
  execute: (interaction: ChatInputCommandInteraction) => Promise<void>;
}

export type CommandsCollection = Collection<string, Command>;
