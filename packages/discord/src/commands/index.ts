import { Collection } from "discord.js";
import type { CommandsCollection } from "../types/commands";
import debug from "./debug";

const commands: CommandsCollection = new Collection(
  debug.map((command) => [command.data.name, command])
);

export default commands;
