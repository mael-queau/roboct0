import { CommandBuilder } from "../../types/commands";

export default new CommandBuilder("ping")
  .setDescription("Pong!")
  .setHandler(async (context) => {
    await context.say("Pong!");
  })
  .build();
