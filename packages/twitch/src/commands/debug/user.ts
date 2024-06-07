import { apiClient } from "../..";
import { CommandBuilder } from "../../types/commands";

export default new CommandBuilder("user")
  .setDescription("Get user information.")
  .setHandler(async (context) => {
    const user = await apiClient.users.getUserById(context.userId);
    if (user) {
      await context.say(
        `User: ${user.displayName} (${user.id}) - ${user.description}`
      );
    } else {
      await context.say("User not found.");
    }
  })
  .build();
