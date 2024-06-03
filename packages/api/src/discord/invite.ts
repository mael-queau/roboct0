import { Hono } from "hono";

export const router = new Hono();

router.get("/", async (c) => {
  const scopes = ["bot", "applications.commands"];

  const url = `https://discord.com/oauth2/authorize?client_id=${process.env.DISCORD_CLIENT_ID}&redirect_uri=${process
    .env.DISCORD_REDIRECT_URI!}&scope=${scopes.join(" ")}&permissions=0`;

  return c.redirect(url);
});

export default router;
