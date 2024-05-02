import { Hono } from "hono";

export const router = new Hono();

router.get("/", async (c) => {
  const url = `https://id.twitch.tv/oauth2/authorize?client_id=${process.env.TWITCH_CLIENT_ID}&redirect_uri=${process.env.TWITCH_REDIRECT_URI}&response_type=code`;

  return c.redirect(url);
});

export default router;
