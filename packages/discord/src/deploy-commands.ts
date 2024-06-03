import commands from "./commands";
import deployCommands from "./commands/deploy";

await deployCommands(commands, process.env.DISCORD_GUILD_ID!);
