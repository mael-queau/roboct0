import { Collection } from "discord.js";
import type { CommandsCollection } from "../types/commands";
import channels from "./channels";
import debug from "./debug";

const rawCommands = [...debug, channels];

const commands: CommandsCollection = new Collection(
  rawCommands.map((command) => [command.data.name, command])
);

export default commands;
