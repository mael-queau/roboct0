import { PrismaClient } from "@prisma/client";
import { PrismaClientKnownRequestError } from "@prisma/client/runtime";

const prisma = new PrismaClient();

/**
 * Get a Discord token for the bot using the Discord API Client Credentials Grant Flow.
 * @description Upserts a Discord token for the bot into the database.
 */
export async function getDiscordToken() {
  const basicAuth = Buffer.from(
    `${process.env.DISCORD_ID}:${process.env.DISCORD_SECRET}`
  ).toString("base64");

  const headers = {
    "Authorization": `Basic ${basicAuth}`,
    "Content-Type": "application/x-www-form-urlencoded",
  };

  const body = {
    grant_type: "client_credentials",
    scope: "identify",
  };

  const response = await fetch("https://discordapp.com/api/oauth2/token", {
    method: "POST",
    headers,
    body: new URLSearchParams(body),
  });

  if (!response.ok) {
    console.error(
      `[DISCORD ERROR] ${response.status} ${response.statusText}`.bgRed
    );
    throw new Error(`${response.status} ${response.statusText}`);
  }

  const json = await response.json();

  if (json.access_token === undefined) {
    console.error(`[DISCORD ERROR] No bot access token was returned!`.bgRed);
    throw new Error(`${response.status} ${response.statusText}`);
  }

  try {
    await prisma.botToken.upsert({
      create: {
        platform: "DISCORD",
        accessToken: json.access_token,
        expiresAt: new Date(Date.now() + json.expires_in * 1000),
      },
      update: {
        accessToken: json.access_token,
        expiresAt: new Date(Date.now() + json.expires_in * 1000),
      },
      where: {
        platform: "DISCORD",
      },
    });

    console.log("[DISCORD] ".blue + `🤖 Bot token updated!`.green);
  } catch (e) {
    if (e instanceof PrismaClientKnownRequestError) {
      console.error(`[DISCORD ERROR] ${e.code} ${e.message}`.bgRed);
    } else {
      console.error(`[DISCORD ERROR] ${e}`.bgRed);
    }
    throw e;
  }
}

/**
 * Get a Twitch token for the bot using the Twitch API Client Credentials Grant Flow.
 * @description Upserts a Twitch token for the bot into the database.
 */
export async function getTwitchToken() {
  const body = {
    client_id: process.env.TWITCH_ID!,
    client_secret: process.env.TWITCH_SECRET!,
    grant_type: "client_credentials",
  };

  const response = await fetch("https://id.twitch.tv/oauth2/token", {
    method: "POST",
    body: new URLSearchParams(body),
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
    },
  });

  if (!response.ok) {
    console.error(
      `[TWITCH ERROR] ${response.status} ${response.statusText}`.bgRed
    );
    throw new Error(`${response.status} ${response.statusText}`);
  }

  const json = await response.json();

  if (json.access_token === undefined) {
    console.error(`[TWITCH ERROR] No bot access token was returned!`.bgRed);
    throw new Error(`${response.status} ${response.statusText}`);
  }

  try {
    await prisma.botToken.upsert({
      create: {
        platform: "TWITCH",
        accessToken: json.access_token,
        expiresAt: new Date(Date.now() + json.expires_in * 1000),
      },
      update: {
        accessToken: json.access_token,
        expiresAt: new Date(Date.now() + json.expires_in * 1000),
      },
      where: {
        platform: "TWITCH",
      },
    });

    console.log("[TWITCH] ".magenta + `🤖 Bot token updated!`.green);
  } catch (e) {
    if (e instanceof PrismaClientKnownRequestError) {
      console.error(`[TWITCH ERROR] ${e.code} ${e.message}`.bgRed);
    } else {
      console.error(`[TWITCH ERROR] ${e}`.bgRed);
    }
    throw e;
  }
}

/**
 * Checks if the bot's Discord and Twitch token are expired and refreshes them if they are.
 */
export async function checkAndRefresh() {
  const discordToken = await prisma.botToken.findUnique({
    where: {
      platform: "DISCORD",
    },
  });

  if (
    !discordToken ||
    discordToken.expiresAt < new Date(Date.now() + 30 * 60 * 1000)
  ) {
    console.log("[DISCORD] ".blue + `🔁 Invalid bot token.`.red);
    await getDiscordToken();
  } else {
    console.log("[DISCORD] ".blue + `🤖 Bot token is valid.`.green);
  }

  const twitchToken = await prisma.botToken.findUnique({
    where: {
      platform: "TWITCH",
    },
  });

  if (
    !twitchToken ||
    twitchToken.expiresAt < new Date(Date.now() + 30 * 60 * 1000)
  ) {
    console.log("[TWITCH] ".magenta + `🔁 Invalid bot token.`.red);
    await getTwitchToken();
  } else {
    console.log("[TWITCH] ".magenta + `🤖 Bot token is valid.`.green);
  }
}
