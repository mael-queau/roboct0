import { apiClient, botUserId } from "..";
import { CommandBuilder } from "../types/commands";

export default new CommandBuilder("invite")
  .setDescription("Get the invite link for the bot.")
  .setHandler(async (context) => {
    const url = `${process.env.ROBOCT0_API_URL!}/twitch/invite`;

    await apiClient.whispers.sendWhisper(
      botUserId,
      context.userId,
      `You can invite me on your channel by opening this link:\n\n${url}`
    );
  });
