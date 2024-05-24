import { CommandBuilder } from "../../types/Command";

export default new CommandBuilder("ping")
  .setDescription("Pong!")
  .setHandler(async (params, context, apiClient) => {
    await context.say("Pong!");
  })
  .build();
