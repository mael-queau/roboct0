import { zValidator } from "@hono/zod-validator";
import { exchangeCode, getTokenInfo } from "@twurple/auth";
import { Hono } from "hono";
import { z } from "zod";
import { createTwitchChannelForUserId } from "../controllers/twitchChannel";
import { createTwitchUserToken } from "../controllers/twitchUserToken";

const router = new Hono();

router.get(
  "/",
  zValidator("query", z.object({ code: z.string() })),
  async (c) => {
    const { code } = c.req.valid("query");

    try {
      const tokenData = await exchangeCode(
        process.env.TWITCH_CLIENT_ID!,
        process.env.TWITCH_CLIENT_SECRET!,
        code,
        process.env.TWITCH_REDIRECT_URI!
      );

      const { userId, userName } = await getTokenInfo(tokenData.accessToken);

      if (!userId) {
        return c.json({ error: "Invalid token" }, 400);
      }

      await createTwitchUserToken({
        userId,
        accessToken: tokenData.accessToken,
        refreshToken: tokenData.refreshToken!,
        expiresIn: tokenData.expiresIn,
        obtainedAt: new Date(tokenData.obtainmentTimestamp),
      });

      if (userName) {
        await createTwitchChannelForUserId(userId, {
          userName,
        });
      }
    } catch (e) {
      console.error(e);
      return c.json({ error: "An error occurred" }, 500);
    }

    return c.json({ success: true });
  }
);

export default router;
