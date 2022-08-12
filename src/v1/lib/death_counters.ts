import { PrismaClient } from "@prisma/client";
import { PrismaClientKnownRequestError } from "@prisma/client/runtime";
import { FormattedError } from "../types/error";
import { verifyChannel } from "./channels";

const prisma = new PrismaClient();

/**
 * Gets a game's ID from its name using the Twitch API.
 * @param gameName The game name.
 * @returns The game ID.
 */
export async function getGameId(gameName: string) {
  try {
    const twitchToken = await prisma.botToken.findUnique({
      where: {
        platform: "TWITCH",
      },
    });

    if (twitchToken === null) {
      console.error(
        `[BOT OAUTH ERROR] No Twitch bot token was found!`.bgYellow
      );
      throw new FormattedError();
    }

    const { accessToken } = twitchToken;

    const response = await fetch(
      `https://api.twitch.tv/helix/games?name=${gameName}`,
      {
        headers: {
          "Client-ID": process.env.TWITCH_ID!,
          "Authorization": `Bearer ${accessToken}`,
        },
      }
    );

    if (!response.ok) {
      console.error(
        `[BOT OAUTH ERROR] ${response.status} - ${response.statusText}`.bgYellow
      );
      throw new FormattedError();
    }

    const { data } = await response.json();

    if (data.length === 0) {
      throw new FormattedError("Game not found.", 404);
    }

    if (data.length > 1) {
      throw new FormattedError(
        "There was an issue processing your request.",
        500
      );
    }

    return data[0].id;
  } catch (e) {
    if (e instanceof FormattedError) throw e;

    console.error(e);
    throw new FormattedError();
  }
}

/**
 * Gets the top death counters for a channel.
 * @param channelId The channel ID.
 * @param limit The number of death counters to return.
 * @param offset The number of death counters to skip.
 * @param force Whether to bypass disabled items.
 * @returns The top death counters.
 */
export async function getTopDeathCounters(
  channelId: string,
  limit: number = 20,
  offset: number = 0,
  force: boolean = false
) {
  if (!force && (await verifyChannel(channelId)) === false) {
    throw new FormattedError("This channel is disabled.", 403);
  }

  if (limit < 1) {
    throw new FormattedError("Limit must be greater than 0.", 400);
  }

  if (offset < 0) {
    throw new FormattedError("Offset must be greater than or equal to 0.", 400);
  }

  try {
    const result = await prisma.deathCounter.findMany({
      select: {
        gameId: true,
        enabled: true,
        counter: true,
        lastDeath: true,
      },
      where: {
        channelId: channelId,
        enabled: true,
      },
      take: limit,
      skip: offset,
      orderBy: {
        counter: "desc",
      },
    });

    if (result.length === 0) {
      throw new FormattedError("No death counters found.", 404);
    }

    return result;
  } catch (e) {
    if (e instanceof FormattedError) throw e;

    console.error(e);
    throw new FormattedError();
  }
}

/**
 * Get a channel's death counter for a game.
 * @param channelId The channel ID.
 * @param gameId The game ID.
 * @param force Whether to bypass disabled items.
 * @returns The death counter.
 */
export async function getDeathCounter(
  channelId: string,
  gameId: string,
  force: boolean = false
) {
  if (!force && (await verifyChannel(channelId)) === false) {
    throw new FormattedError("This channel is disabled.", 403);
  }

  try {
    const result = await prisma.deathCounter.findUnique({
      select: {
        gameId: true,
        enabled: true,
        counter: true,
        lastDeath: true,
      },
      where: {
        channelId_gameId: {
          channelId,
          gameId,
        },
      },
    });

    if (result === null) {
      throw new FormattedError("No death counter found.", 404);
    }

    if (!force && !result.enabled) {
      throw new FormattedError("This counter is disabled.", 403);
    }

    return result;
  } catch (e) {
    if (e instanceof FormattedError) throw e;

    console.error(e);
    throw new FormattedError();
  }
}

/**
 * Increments (or decrements) a channel's death counter for a game.
 * @param channelId The channel ID.
 * @param gameId The game ID.
 * @param amount The amount to increment by.
 * @param force Whether to bypass disabled items.
 * @returns The new death counter.
 */
export async function incrementDeathCounter(
  channelId: string,
  gameId: string,
  amount: number,
  force: boolean = false
) {
  if (!force && (await verifyChannel(channelId)) === false) {
    throw new FormattedError("This channel is disabled.", 403);
  }

  if (amount === 0) {
    throw new FormattedError("Increment can't be 0.", 400);
  }

  try {
    const existing = await prisma.deathCounter.findUnique({
      where: {
        channelId_gameId: {
          channelId,
          gameId,
        },
      },
    });

    if (existing?.enabled === false)
      throw new FormattedError("This counter is disabled.", 403);

    if (existing && existing.counter + amount < 0)
      throw new FormattedError(
        `Counter can't become less than 0. The maximum cou can currently decrease the counter by is ${existing.counter}.`,
        400
      );

    const counter = await prisma.deathCounter.upsert({
      create: {
        gameId,
        channel: {
          connect: {
            channelId,
          },
        },
        counter: 1,
      },
      update: {
        counter: {
          increment: amount > 0 ? amount : undefined,
          decrement: amount < 0 ? Math.abs(amount) : undefined,
        },
        lastDeath: new Date(),
      },
      select: {
        gameId: true,
        enabled: true,
        counter: true,
        lastDeath: true,
      },
      where: {
        channelId_gameId: {
          channelId,
          gameId,
        },
      },
    });

    return counter;
  } catch (e) {
    if (e instanceof PrismaClientKnownRequestError) {
      switch (e.code) {
        case "P2016":
          throw new FormattedError(
            "The channel isn't registered with us.",
            404
          );
        default:
          break;
      }
    }
    if (e instanceof FormattedError) throw e;
    console.error(e);
    throw new FormattedError();
  }
}

/**
 * Set a channel's death counter for a game.
 * @param channelId The channel ID.
 * @param gameId The game ID.
 * @param value The new death counter.
 * @param force Whether to bypass disabled items.
 * @returns The new death counter.
 */
export async function setDeathCounter(
  channelId: string,
  gameId: string,
  value: number,
  force: boolean = false
) {
  if (!force && (await verifyChannel(channelId)) === false) {
    throw new FormattedError("This channel is disabled.", 403);
  }

  if (value < 0) {
    throw new FormattedError("Counter can't be less than 0.", 400);
  }

  try {
    const existing = await prisma.deathCounter.findUnique({
      where: {
        channelId_gameId: {
          channelId,
          gameId,
        },
      },
    });

    if (existing?.enabled === false)
      throw new FormattedError("This counter is disabled.", 403);

    const counter = await prisma.deathCounter.update({
      data: {
        counter: value,
      },
      select: {
        gameId: true,
        enabled: true,
        counter: true,
        lastDeath: true,
      },
      where: {
        channelId_gameId: {
          channelId,
          gameId,
        },
      },
    });

    return counter;
  } catch (e) {
    if (e instanceof PrismaClientKnownRequestError) {
      switch (e.code) {
        case "P2025":
          throw new FormattedError("This death counter doesn't exist.", 404);
        default:
          break;
      }
    }
    if (e instanceof FormattedError) throw e;
    console.error(e);
    throw new FormattedError();
  }
}

/**
 * Toggles a channel's death counter for a game.
 * @param channelId The channel ID.
 * @param gameId The game ID.
 * @param enabled Whether to enable or disable the counter.
 * @param force Whether to bypass disabled items.
 * @returns The new death counter.
 */
export async function toggleDeathCounter(
  channelId: string,
  gameId: string,
  enabled?: boolean,
  force: boolean = false
) {
  if (!force && (await verifyChannel(channelId)) === false) {
    throw new FormattedError("This channel is disabled.", 403);
  }

  try {
    const existing = await prisma.deathCounter.findUnique({
      select: {
        enabled: true,
      },
      where: {
        channelId_gameId: {
          channelId,
          gameId,
        },
      },
    });

    if (existing === null) {
      throw new FormattedError("This death counter doesn't exist.", 404);
    }

    const counter = await prisma.deathCounter.update({
      data: {
        enabled: enabled === undefined ? !existing.enabled : enabled,
      },
      select: {
        gameId: true,
        enabled: true,
        counter: true,
        lastDeath: true,
      },
      where: {
        channelId_gameId: {
          channelId,
          gameId,
        },
      },
    });

    return counter;
  } catch (e) {
    if (e instanceof PrismaClientKnownRequestError) {
      switch (e.code) {
        case "P2025":
          throw new FormattedError("This death counter doesn't exist.", 404);
        default:
          break;
      }
    }
    if (e instanceof FormattedError) throw e;
    console.error(e);
    throw new FormattedError();
  }
}

/**
 * Delete a channel's death counter for a game.
 * @param channelId The channel ID.
 * @param gameId The game ID.
 * @param force Whether to bypass disabled items.
 * @returns The deleted death counter.
 */
export async function deleteDeathCounter(
  channelId: string,
  gameId: string,
  force: boolean = false
) {
  if (!force && (await verifyChannel(channelId)) === false) {
    throw new FormattedError("This channel is disabled.", 403);
  }

  try {
    const counter = await prisma.deathCounter.delete({
      select: {
        gameId: true,
        enabled: true,
        counter: true,
        lastDeath: true,
      },
      where: {
        channelId_gameId: {
          channelId,
          gameId,
        },
      },
    });

    return counter;
  } catch (e) {
    if (e instanceof PrismaClientKnownRequestError) {
      switch (e.code) {
        case "P2025":
          throw new FormattedError("This death counter doesn't exist.", 404);
        default:
          break;
      }
    }
    if (e instanceof FormattedError) throw e;
    console.error(e);
    throw new FormattedError();
  }
}

/**
 * Delete all game counters for a channel.
 * @param channelId The channel ID.
 * @param force Whether to bypass disabled items.
 * @returns The deleted death counters.
 */
export async function deleteAllDeathCounters(
  channelId: string,
  force: boolean = false
) {
  if (!force && (await verifyChannel(channelId)) === false) {
    throw new FormattedError("This channel is disabled.", 403);
  }

  try {
    const counters = await prisma.deathCounter.deleteMany({
      where: {
        channelId,
      },
    });

    if (counters.count === 0) {
      throw new FormattedError("No death counters exist.", 404);
    }

    return counters.count;
  } catch (e) {
    if (e instanceof PrismaClientKnownRequestError) {
      switch (e.code) {
        case "P2025":
          throw new FormattedError("This death counter doesn't exist.", 404);
        default:
          break;
      }
    }
    if (e instanceof FormattedError) throw e;
    console.error(e);
    throw new FormattedError();
  }
}
