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
 * Adds a Discord role as moderator of a guild.
 * @param guildId The guild ID.
 * @param roleId The role ID.
 * @param force Whether to bypass disabled items.
 * @returns The added role's information.
 */
export async function addModRole(
  guildId: string,
  roleId: string,
  force: boolean = false
) {
  if (!force) {
    if ((await verifyGuild(guildId)) === false) {
      throw new FormattedError("This guild is disabled.", 403);
    }
  }

  try {
    const result = await prisma.modRole.create({
      data: {
        guildId: guildId,
        roleId: roleId,
      },
      select: {
        guildId: true,
        roleId: true,
      },
    });

    return result;
  } catch (e) {
    if (e instanceof PrismaClientKnownRequestError && e.code === "P2002") {
      throw new FormattedError(
        "This role is already a moderator of this guild.",
        409
      );
    }
    console.error(e);
    throw new FormattedError();
  }
}

/**
 * Gets a list of moderator roles for a guild.
 * @param guildId The guild ID.
 * @param force Whether to bypass disabled items.
 * @returns The list of moderator roles.
 */
export async function listModRoles(guildId: string, force: boolean = false) {
  if (!force) {
    if ((await verifyGuild(guildId)) === false) {
      throw new FormattedError("This guild is disabled.", 403);
    }
  }

  try {
    const result = await prisma.modRole.findMany({
      select: {
        roleId: true,
      },
      where: {
        guildId: guildId,
      },
    });

    return result.map((r) => r.roleId);
  } catch (e) {
    if (e instanceof FormattedError) throw e;
    console.error(e);
    throw new FormattedError();
  }
}

/**
 * Checks if a Discord role is a moderator of a guild.
 * @param guildId The guild ID.
 * @param roleId The role ID.
 * @param force Whether to bypass disabled items.
 * @returns The role's information.
 */
export async function getModRole(
  guildId: string,
  roleId: string,
  force: boolean = false
) {
  if (!force) {
    if ((await verifyGuild(guildId)) === false) {
      throw new FormattedError("This guild is disabled.", 403);
    }
  }

  try {
    const result = await prisma.modRole.findUnique({
      select: {
        guildId: true,
        roleId: true,
      },
      where: {
        guildId_roleId: {
          guildId: guildId,
          roleId: roleId,
        },
      },
    });

    if (result === null) {
      throw new FormattedError(
        "This role isn't a moderator for this guild.",
        404
      );
    }

    return result;
  } catch (e) {
    if (e instanceof FormattedError) throw e;
    console.error(e);
    throw new FormattedError();
  }
}

/**
 * Removes a moderator role from a guild.
 * @param guildId The guild ID.
 * @param roleId The role ID.
 * @param force Whether to bypass disabled items.
 * @returns The removed role's information.
 */
export async function removeModRole(
  guildId: string,
  roleId: string,
  force: boolean = false
) {
  if (!force) {
    if ((await verifyGuild(guildId)) === false) {
      throw new FormattedError("This guild is disabled.", 403);
    }
  }

  try {
    const result = await prisma.modRole.delete({
      select: {
        guildId: true,
        roleId: true,
      },
      where: {
        guildId_roleId: {
          guildId: guildId,
          roleId: roleId,
        },
      },
    });

    return result;
  } catch (e) {
    if (e instanceof PrismaClientKnownRequestError && e.code === "P2025") {
      throw new FormattedError(
        "This role isn't a moderator of this guild.",
        404
      );
    }
    console.error(e);
    throw new FormattedError();
  }
}

/**
 * Add a text channel to the list of bot-enabled channels.
 * @param guildId The guild ID.
 * @param textChannelId The text channel ID.
 * @param force Whether to bypass disabled items.
 * @returns The added text channel's information.
 */
export async function addBotTextChannel(
  guildId: string,
  textChannelId: string,

  force: boolean = false
) {
  if (!force) {
    if ((await verifyGuild(guildId)) === false) {
      throw new FormattedError("This guild is disabled.", 403);
    }
  }

  try {
    const result = await prisma.botTextChannel.create({
      data: {
        guildId: guildId,
        textChannelId: textChannelId,
      },
      select: {
        guildId: true,
        textChannelId: true,
      },
    });

    return result;
  } catch (e) {
    if (e instanceof PrismaClientKnownRequestError && e.code === "P2002") {
      throw new FormattedError(
        "This text channel is already a bot-enabled channel.",
        409
      );
    }
    console.error(e);
    throw new FormattedError();
  }
}

/**
 * Gets a list of bot-enabled text channels for a guild.
 * @param guildId The guild ID.
 * @param force Whether to bypass disabled items.
 * @returns The list of bot-enabled text channels.
 */
export async function listBotTextChannels(
  guildId: string,
  force: boolean = false
) {
  if (!force) {
    if ((await verifyGuild(guildId)) === false) {
      throw new FormattedError("This guild is disabled.", 403);
    }
  }

  try {
    const result = await prisma.botTextChannel.findMany({
      select: {
        textChannelId: true,
      },
      where: {
        guildId: guildId,
      },
    });

    return result.map((r) => r.textChannelId);
  } catch (e) {
    if (e instanceof FormattedError) throw e;
    console.error(e);
    throw new FormattedError();
  }
}

/**
 * Checks if a Discord text channel is a bot-enabled channel.
 * @param guildId The guild ID.
 * @param textChannelId The text channel ID.
 * @param force Whether to bypass disabled items.
 * @returns The text channel's information.
 */
export async function getBotTextChannel(
  guildId: string,
  textChannelId: string,
  force: boolean = false
) {
  if (!force) {
    if ((await verifyGuild(guildId)) === false) {
      throw new FormattedError("This guild is disabled.", 403);
    }
  }

  try {
    const result = await prisma.botTextChannel.findUnique({
      select: {
        guildId: true,
        textChannelId: true,
      },
      where: {
        guildId_textChannelId: {
          guildId: guildId,
          textChannelId: textChannelId,
        },
      },
    });

    if (result === null) {
      throw new FormattedError(
        "This text channel isn't a bot-enabled channel.",
        404
      );
    }

    return result;
  } catch (e) {
    if (e instanceof FormattedError) throw e;
    console.error(e);
    throw new FormattedError();
  }
}

/**
 * Removes a bot-enabled text channel from a guild.
 * @param guildId The guild ID.
 * @param textChannelId The text channel ID.
 * @param force Whether to bypass disabled items.
 * @returns The removed text channel's information.
 */
export async function removeBotTextChannel(
  guildId: string,
  textChannelId: string,
  force: boolean = false
) {
  if (!force) {
    if ((await verifyGuild(guildId)) === false) {
      throw new FormattedError("This guild is disabled.", 403);
    }
  }

  try {
    const result = await prisma.botTextChannel.delete({
      select: {
        guildId: true,
        textChannelId: true,
      },
      where: {
        guildId_textChannelId: {
          guildId: guildId,
          textChannelId: textChannelId,
        },
      },
    });

    return result;
  } catch (e) {
    if (e instanceof PrismaClientKnownRequestError && e.code === "P2025") {
      throw new FormattedError(
        "This text channel isn't a bot-enabled channel.",
        404
      );
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
  limit: number = 20,
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
    const existing = await prisma.guild.findUnique({
      select: {
        channels: {
          select: {
            channelId: true,
          },
        },
      },
      where: {
        guildId,
      },
    });

    if (existing === null) {
      throw new FormattedError("This guild isn't registered with us.", 404);
    }

    if (existing.channels.some((c) => c.channelId === channelId)) {
      throw new FormattedError("This channel is already added.", 409);
    }

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
    if (e instanceof FormattedError) throw e;
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
            quotes: {
              select: {
                channelId: true,
                content: true,
                date: true,
                enabled: true,
                quoteId: true,
              },
              where: {
                enabled: force ? undefined : true,
              },
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
