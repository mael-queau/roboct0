import crypto from "crypto";
import { PrismaClient } from "@prisma/client";
import { PrismaClientKnownRequestError } from "@prisma/client/runtime";
import { FormattedError } from "../types/error";
import { verifyChannel } from "./channels";

const prisma = new PrismaClient();

/**
 * Get a guild by its ID.
 * @param guildId The guild ID.
 * @param force Whether to bypass disabled items.
 * @returns The guild.
 */
export async function getGuild(guildId: string, force: boolean = false) {
  try {
    const guild = await prisma.guild.findUnique({
      select: {
        guildId: true,
        enabled: true,
        registeredAt: true,
        _count: {
          select: {
            channels: true,
          },
        },
      },
      where: {
        guildId,
      },
    });

    if (guild === null) {
      throw new FormattedError("This guild isn't registered with us.", 404);
    }

    if (!guild.enabled && !force) {
      throw new FormattedError("This guild is disabled.", 403);
    }

    return {
      guildId: guild.guildId,
      registeredAt: guild.registeredAt,
      enabled: guild.enabled,
      ...guild._count,
    };
  } catch (e) {
    if (e instanceof FormattedError) throw e;

    console.error(e);
    throw new FormattedError();
  }
}

/**
 * Toggles a guild's enabled status.
 * @param guildId The guild ID.
 * @param enabled Whether to enable or disable the guild.
 * @returns The guild information.
 */
export async function toggleGuild(guildId: string, enabled?: boolean) {
  try {
    const existing = await prisma.guild.findUnique({
      select: {
        enabled: true,
      },
      where: {
        guildId: guildId,
      },
    });

    if (existing === null) {
      throw new FormattedError("This guild isn't registered with us.", 404);
    }

    const result = await prisma.guild.update({
      data: {
        enabled: enabled === undefined ? !existing.enabled : enabled,
      },
      select: {
        guildId: true,
        registeredAt: true,
        enabled: true,
        _count: {
          select: {
            channels: true,
          },
        },
      },
      where: {
        guildId: guildId,
      },
    });

    return {
      guildId: result.guildId,
      registeredAt: result.registeredAt,
      enabled: result.enabled,
      ...result._count,
    };
  } catch (e) {
    if (e instanceof FormattedError) throw e;
    console.error(e);
    throw new FormattedError();
  }
}

/**
 * Completely delete a guild.
 * @param guildId The guild ID.
 * @returns The guild information.
 */
export async function deleteGuild(guildId: string) {
  try {
    const result = await prisma.guild.delete({
      select: {
        guildId: true,
        registeredAt: true,
        enabled: true,
        _count: true,
      },
      where: {
        guildId: guildId,
      },
    });

    return {
      guildId: result.guildId,
      registeredAt: result.registeredAt,
      enabled: result.enabled,
      ...result._count,
    };
  } catch (e) {
    if (e instanceof PrismaClientKnownRequestError && e.code === "P2025") {
      throw new FormattedError("This guild isn't registered with us.", 404);
    }
    console.error(e);
    throw new FormattedError();
  }
}

/**
 * Get a guild's added channels
 * @param guildId The guild ID.
 * @param force Whether to bypass disabled items.
 * @returns The guild's added channels.
 */
export async function searchGuildChannels(
  guildId: string,
  query: string,
  limit: number = 100,
  offset: number = 0,
  force: boolean = false
) {
  if (limit < 1) {
    throw new FormattedError("Limit must be a positive integer.", 400);
  }

  if (offset < 0) {
    throw new FormattedError("Limit must be a positive integer.", 400);
  }

  try {
    const result = await prisma.guild.findUnique({
      select: {
        guildId: true,
        enabled: true,
        channels: {
          select: {
            channelId: true,
            username: true,
          },
          where: {
            enabled: force ? undefined : true,
            username: {
              contains: query,
            },
          },
          orderBy: {
            guilds: {
              _count: "desc",
            },
          },
        },
      },
      where: {
        guildId: guildId,
      },
    });

    if (result === null) {
      throw new FormattedError("This guild isn't registered with us.", 404);
    }

    if (!result.enabled && !force) {
      throw new FormattedError("This guild is disabled.", 403);
    }

    return result.channels.map((channel) => ({
      channelId: channel.channelId,
      username: channel.username,
      _link: `/channels/${channel.channelId}`,
    }));
  } catch (e) {
    if (e instanceof FormattedError) throw e;
    console.error(e);
    throw new FormattedError();
  }
}

/**
 * Add a channel to a guild.
 * @param guildId The guild ID.
 * @param channelId The channel ID.
 * @param force Whether to bypass disabled items.
 * @returns The channel information.
 */
export async function addChannelToGuild(
  guildId: string,
  channelId: string,
  force: boolean = false
) {
  if (!force) {
    if ((await verifyGuild(guildId)) === false) {
      throw new FormattedError("This guild is disabled.", 403);
    }
    if ((await verifyChannel(channelId)) === false) {
      throw new FormattedError("This channel is disabled.", 403);
    }
  }

  try {
    const result = await prisma.guild.update({
      data: {
        channels: {
          connect: {
            channelId: channelId,
          },
        },
      },
      select: {
        guildId: true,
        enabled: true,
        _count: {
          select: {
            channels: true,
          },
        },
      },
      where: {
        guildId: guildId,
      },
    });

    return result;
  } catch (e) {
    if (e instanceof PrismaClientKnownRequestError) {
      if (e.code === "P2025")
        throw new FormattedError("This channel isn't registered with us", 404);
      else if (e.code === "P2016")
        throw new FormattedError("This guild isn't registered with us", 404);
    }

    console.error(e);
    throw new FormattedError();
  }
}

/**
 * Remove a channel from a guild.
 * @param guildId The guild ID.
 * @param channelId The channel ID.
 * @param force Whether to bypass disabled items.
 * @returns The channel information.
 */
export async function removeChannelFromGuild(
  guildId: string,
  channelId: string,
  force: boolean = false
) {
  if (!force) {
    if ((await verifyGuild(guildId)) === false) {
      throw new FormattedError("This guild is disabled.", 403);
    }
  }

  try {
    const result = await prisma.guild.update({
      data: {
        channels: {
          disconnect: {
            channelId: channelId,
          },
        },
      },
      select: {
        guildId: true,
        enabled: true,
        _count: {
          select: {
            channels: true,
          },
        },
      },
      where: {
        guildId: guildId,
      },
    });

    return result;
  } catch (e) {
    if (e instanceof PrismaClientKnownRequestError) {
      if (e.code === "P2016")
        throw new FormattedError("This guild isn't registered with us", 404);
    }

    console.error(e);
    throw new FormattedError();
  }
}

/**
 * Returns a random quote from one of the guild's channels.
 * @param guildId The guild ID.
 * @param force Whether to bypass disabled items.
 * @returns The quote.
 */
export async function getRandomQuote(guildId: string, force: boolean = false) {
  if (!force) {
    if ((await verifyGuild(guildId)) === false) {
      throw new FormattedError("This guild is disabled.", 403);
    }
  }

  try {
    const result = await prisma.guild.findUnique({
      select: {
        enabled: true,
        channels: {
          select: {
            quotes: true,
          },
        },
      },
      where: {
        guildId: guildId,
      },
    });

    if (result === null) {
      throw new FormattedError("This guild isn't registered with us.", 404);
    }

    if (!result.enabled && !force) {
      throw new FormattedError("This guild is disabled.", 403);
    }

    const quotes = result.channels.flatMap((channel) => channel.quotes);

    if (quotes.length === 0) {
      throw new FormattedError(
        "None of this guild's added channels have any quotes.",
        404
      );
    }

    return quotes[crypto.randomInt(0, quotes.length)];
  } catch (e) {
    if (e instanceof FormattedError) throw e;
    console.error(e);
    throw new FormattedError();
  }
}

/**
 * Get a guild's access token.
 * @param guildId The guild ID.
 * @param force Whether to bypass disabled items.
 * @returns The guild's access token.
 */
export async function getGuildToken(guildId: string, force: boolean = false) {
  if (!force) {
    if ((await verifyGuild(guildId)) === false) {
      throw new FormattedError("This guild is disabled.", 403);
    }
  }

  try {
    const result = await prisma.guild.findUnique({
      select: {
        guildId: true,
        token: true,
        expiresAt: true,
      },
      where: {
        guildId: guildId,
      },
    });

    if (result === null) {
      throw new FormattedError("This guild isn't registered with us.", 404);
    }

    return result;
  } catch (e) {
    if (e instanceof FormattedError) throw e;
    console.error(e);
    throw new FormattedError();
  }
}

/**
 * Checks if a guild is enabled
 * @param id The guild ID.
 * @returns Whether the guild is enabled.
 */
export async function verifyGuild(id: string) {
  try {
    const result = await prisma.guild.findUnique({
      select: {
        enabled: true,
      },
      where: {
        guildId: id,
      },
    });

    if (result === null) {
      throw new FormattedError("This guild isn't registered with us.", 404);
    }

    return result.enabled;
  } catch (e) {
    if (e instanceof FormattedError) throw e;

    console.error(e);
    throw new FormattedError();
  }
}
