import { Router } from "express";
import { Guild, PrismaClient } from "@prisma/client";
import { z, ZodError } from "zod";
import { createState, deleteState, isValidState } from "./helper";

export const router = Router();
const prisma = new PrismaClient();

router.get("/discord", async (_req, res) => {
  // Create a state token to prevent CSRF.
  const state = await createState();

  // Discord bot permissions
  const permissions = "309237902400";
  const scopes = ["identify", "bot", "applications.commands"];

  let redirectUrl = `https://discord.com/api/oauth2/authorize`;
  redirectUrl += `?client_id=${process.env.DISCORD_ID}`;
  redirectUrl += `&permissions=${permissions}`;
  redirectUrl += `&redirect_uri=${process.env.API_URL}/discord/callback`;
  redirectUrl += `&response_type=code`;
  redirectUrl += `&scope=${encodeURI(scopes.join(" "))}`;
  redirectUrl += `&state=${state}`;

  res.redirect(redirectUrl);
});

router.get("/discord/callback", async (req, res) => {
  try {
    const queryValidator = z.object({
      code: z.string(),
      guild_id: z.string(),
      state: z.string(),
    });
    const parsedQuery = queryValidator.parse(req.query);

    if (!(await isValidState(parsedQuery.state))) {
      // State token is invalid.
      res.status(401).json({
        success: false,
        message: "The 'state' query parameter is invalid.",
      });
    } else {
      // Exchange the grant code for an access token.
      const { access_token, refresh_token, expires_in } = await getAccessToken(
        parsedQuery.code
      );

      // Create a new guild in the database.
      // If the guild is already registered, update its access token and activate it.
      await prisma.guild.upsert({
        create: {
          guildId: parsedQuery.guild_id,
          token: access_token,
          refreshToken: refresh_token,
          expiresAt: new Date(Date.now() + expires_in * 1000),
        },
        update: {
          enabled: true,
          token: access_token,
          refreshToken: refresh_token,
        },
        where: {
          guildId: parsedQuery.guild_id,
        },
      });

      // Delete the state token.
      await deleteState(parsedQuery.state);

      console.log(
        "[DISCORD] ".blue +
          `🎉 The guild ${parsedQuery.guild_id} has been registered.`.blue
      );

      res.status(201).json({
        success: true,
        message: "The guild was successfully registered.",
      });
    }
  } catch (e) {
    if (e instanceof ZodError) {
      if (req.query.error) {
        // There was an error from Discord instead of a code.
        res.status(401).json({
          success: false,
          message: req.query.error_description,
        });
      } else {
        // There was some other error with the query parameters.
        res.status(400).json({
          success: false,
          message: "The query parameters are invalid.",
        });
      }
    } else {
      // There was some unknown error.
      // Log it and send a generic error message.
      console.error(e);
      res.status(500).json({
        success: false,
        message: "Internal server error.",
      });
    }
  }
});

/**
 * Retrieves an access refresh tokens from the Discord API.
 * @param code The grant code to exchange for an access token.
 * @returns The access and refresh tokens.
 */
async function getAccessToken(code: string) {
  const params = new URLSearchParams();
  params.append("client_id", process.env.DISCORD_ID!);
  params.append("client_secret", process.env.DISCORD_SECRET!);
  params.append("grant_type", "authorization_code");
  params.append("code", code);
  params.append("redirect_uri", `${process.env.API_URL}/discord/callback`);

  const response = await fetch(`https://discord.com/api/v10/oauth2/token`, {
    method: "POST",
    body: params,
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
    },
  });

  if (!response.ok) {
    throw new Error(response.statusText);
  } else {
    const validator = z.object({
      access_token: z.string(),
      refresh_token: z.string(),
      expires_in: z.number(),
    });

    return validator.parse(await response.json());
  }
}

/**
 * Refreshes a Discord access token.
 * @description In the context of the Discord API's OAuth2 integration, we need to regularly refresh access tokens. This automates that process.
 * @param guild A Prisma Guild object (containing token information for a specific user)
 * @returns An updated version of that Prisma Channel object, with the updated token information
 */
export async function refreshToken(guild: Guild) {
  const parameters = new URLSearchParams();
  parameters.append("client_id", process.env.DISCORD_ID!);
  parameters.append("client_secret", process.env.DISCORD_SECRET!);
  parameters.append("grant_type", "refresh_token");
  parameters.append("refresh_token", guild.refreshToken);

  try {
    const response = await fetch(`https://discord.com/api/v10/oauth2/token`, {
      method: "POST",
      body: parameters,
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
    });

    const data = await response.json();

    const dataValidator = z.object({
      access_token: z.string(),
      refresh_token: z.string(),
      expires_in: z.number(),
    });

    const { access_token, refresh_token, expires_in } =
      dataValidator.parse(data);

    // Update the guild's access token and refresh token.
    const result = await prisma.guild.update({
      data: {
        lastRefresh: new Date(),
        token: access_token,
        refreshToken: refresh_token,
        expiresAt: new Date(Date.now() + expires_in * 1000),
      },
      where: {
        id: guild.id,
      },
    });
    console.log(
      "[DISCORD] ".blue +
        `✅ Successfully refreshed token for guild ${guild.guildId}`.green
    );
    return result;
  } catch (e) {
    console.log(
      "[DISCORD] ".blue +
        `❌ Failed to refresh token for guild ${guild.guildId}. It has been disabled.`
          .red
    );
    // There was an error refreshing the token.
    // We need to disable the guild.
    // Don't actually disable the guild if node is in development mode.
    if (process.env.NODE_ENV !== "development") {
      // Disable the guild.
      const newGuild = await prisma.guild.update({
        where: {
          id: guild.id,
        },
        data: {
          enabled: false,
        },
      });
      return newGuild;
    } else return guild;
  }
}

/**
 * Refreshes a Discord guild's access token.
 * @param guildId The ID of the guild to refresh.
 * @returns The updated guild object.
 */
export async function refreshTokenByGuildId(guildId: string) {
  const guild = await prisma.guild.findUnique({
    where: {
      guildId,
    },
  });

  if (!guild) {
    throw new Error("Guild not found.");
  }

  return refreshToken(guild);
}

/**
 * Verify all the active tokens from the database and returns a list of guilds that need to be refreshed.
 * @returns A list of guilds that need to be refreshed.
 */
export async function verifyAllTokens(): Promise<Guild[]> {
  // Get all the enabled guilds' tokens from the database.
  const guilds = await prisma.guild.findMany({
    where: { enabled: true },
  });

  console.log(
    "[DISCORD] ".blue + `⌛ Verifying ${guilds.length} enabled guilds...`
  );

  const invalidTokens: Guild[] = [];

  for (const guild of guilds) {
    try {
      let { token } = guild;

      const response = await fetch(`https://discord.com/api/v10/users/@me`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        // The token is invalid.
        // Add the guild to the list of invalid tokens.
        invalidTokens.push(guild);
      } else {
        if (guild.expiresAt < new Date(Date.now() + 30 * 60 * 1000)) {
          // The access token will expire within the next 30 minutes.
          // Add the channel to the list of channels that need to be refreshed.
          invalidTokens.push(guild);
        }
      }
    } catch (e) {
      console.error(e);
    }
  }

  console.log(
    "[DISCORD] ".blue +
      `🔁 ${invalidTokens.length} guilds need to be refreshed.`
  );

  return invalidTokens;
}

/**
 * Validates a Discord access token using the Discord API.
 * @param guildId The guild to validate the token for.
 * @returns Whether the token is valid.
 */
export async function verifyToken(guildId: string) {
  const guild = await prisma.guild.findUnique({
    select: {
      token: true,
      lastRefresh: true,
      expiresAt: true,
    },
    where: {
      guildId,
    },
  });

  if (guild === null) {
    throw new Error("Guild not found.");
  }

  if (guild.expiresAt < new Date(Date.now() + 60 * 60 * 1000)) {
    console.log(
      "[DISCORD] ".blue +
        `⌛ Guild ${guildId}'s token needs to be refreshed...`.dim
    );
    return false;
  }

  const response = await fetch(`https://discord.com/api/v10/users/@me`, {
    headers: {
      Authorization: `Bearer ${guild.token}`,
    },
  });

  if (!response.ok)
    console.log(
      "[DISCORD] ".blue +
        `⌛ Guild ${guildId}'s token needs to be refreshed...`.dim
    );

  return response.ok;
}
