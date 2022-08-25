import { PrismaClient } from "@prisma/client";
import { PrismaClientKnownRequestError } from "@prisma/client/runtime";
import { FormattedError } from "../types/error";
import { verifyChannel } from "./channels";
import { getDiscordUserInfo, getTwitchUserInfo } from "./users";

const prisma = new PrismaClient();

interface UserInfo {
  twitchId?: string;
  discordId?: string;
}

/**
 * Increment a user's love counter in a specific channel.
 * @param user The user to increment the love counter for.
 * @param user.twitchId The user's Twitch ID.
 * @param user.discordId The user's Discord ID.
 * @param channelId The channel to increment the love counter in. If none is given, it increments the "other sources" counter.
 * @param force Whether to ignore disabled items.
 * @returns The user's updated love counter.
 */
export async function sendLove(
  { twitchId, discordId }: UserInfo,
  channelId?: string,
  force: boolean = false
) {
  try {
    if (!force && channelId !== undefined) {
      if ((await verifyChannel(channelId)) === false) {
        throw new FormattedError("This channel is disabled.", 403);
      }
    }

    if (twitchId === undefined && discordId === undefined) {
      throw new FormattedError(
        "Please provide a Twitch ID or Discord ID.",
        400
      );
    }

    const user =
      twitchId !== undefined
        ? await getTwitchUserInfo(twitchId, force)
        : await getDiscordUserInfo(discordId!, force);

    if (user === null) {
      throw new FormattedError("User not found.", 404);
    }

    if (user.optOut) {
      throw new FormattedError("This user has opted out.", 403);
    }

    const isChannelCounter = channelId !== undefined;

    const result = await prisma.user.update({
      data: {
        miscellaneousLoveCounter: !isChannelCounter
          ? {
              increment: 1,
            }
          : undefined,
        channelLoveCounters: isChannelCounter
          ? {
              upsert: {
                create: {
                  channelId: channelId,
                },
                update: {
                  counter: {
                    increment: 1,
                  },
                },
                where: {
                  channelId: channelId,
                },
              },
            }
          : undefined,
      },
      select: {
        miscellaneousLoveCounter: !isChannelCounter,
        channelLoveCounters: isChannelCounter
          ? {
              select: {
                counter: true,
              },
              where: {
                channelId: channelId,
              },
            }
          : undefined,
      },
      where: {
        twitchId: user.twitchId,
      },
    });

    if (isChannelCounter) {
      return result.channelLoveCounters[0].counter;
    } else {
      return result.miscellaneousLoveCounter;
    }
  } catch (e) {
    if (e instanceof FormattedError) throw e;
    if (e instanceof PrismaClientKnownRequestError) {
      switch (e.code) {
        case "P2025":
          throw new FormattedError("User not found.", 404);
        case "P2016":
          throw new FormattedError("Channel not found.", 404);
        default:
          break;
      }
    }
    console.error(e);
    throw new FormattedError();
  }
}

/**
 * Gets the user's love counter for a specific channel.
 * @param user The user to increment the love counter for.
 * @param user.twitchId The user's Twitch ID.
 * @param user.discordId The user's Discord ID.
 * @param channelId The channel to get the love counter for.
 * @param force Whether to ignore disabled items.
 * @returns The user's love counter.
 */
export async function getLoveCounter(
  { twitchId, discordId }: UserInfo,
  channelId: string,
  force: boolean = false
) {
  try {
    if (twitchId === undefined && discordId === undefined) {
      throw new FormattedError(
        "Please provide a Twitch ID or Discord ID.",
        400
      );
    }

    if (!force && (await verifyChannel(channelId)) === false) {
      throw new FormattedError("This channel is disabled.", 403);
    }

    const user =
      twitchId !== undefined
        ? await getTwitchUserInfo(twitchId, force)
        : await getDiscordUserInfo(discordId!, force);

    if (user === null) {
      throw new FormattedError("User not found.", 404);
    }

    if (user.optOut && !force) {
      throw new FormattedError("This user has opted out.", 403);
    }

    const result = await prisma.user.findUnique({
      where: {
        twitchId: user.twitchId,
      },
      select: {
        channelLoveCounters: {
          where: {
            channelId: channelId,
          },
        },
      },
    });

    if (result === null || result.channelLoveCounters.length === 0) {
      return 0;
    }

    return result.channelLoveCounters[0].counter;
  } catch (e) {
    if (e instanceof FormattedError) throw e;
    console.error(e);
    throw new FormattedError();
  }
}

/**
 * Gets the user's total love counter.
 * @param user The user to increment the love counter for.
 * @param user.twitchId The user's Twitch ID.
 * @param user.discordId The user's Discord ID.
 * @param force Whether to ignore disabled items.
 * @returns The user's total love counter.
 */
export async function getTotalLove(
  { twitchId, discordId }: UserInfo,
  force: boolean = false
) {
  try {
    if (twitchId === undefined && discordId === undefined) {
      throw new FormattedError(
        "Please provide a Twitch ID or Discord ID.",
        400
      );
    }

    const user =
      twitchId !== undefined
        ? await getTwitchUserInfo(twitchId, force)
        : await getDiscordUserInfo(discordId!, force);

    if (user === null) {
      throw new FormattedError("User not found.", 404);
    }

    if (user.optOut && !force) {
      throw new FormattedError("This user has opted out.", 403);
    }

    const result = await prisma.user.findUnique({
      where: {
        twitchId: user.twitchId,
      },
      select: {
        miscellaneousLoveCounter: true,
        channelLoveCounters: {
          select: {
            counter: true,
          },
        },
      },
    });

    if (result === null) {
      return 0;
    }

    return (
      result.miscellaneousLoveCounter +
      result.channelLoveCounters.reduce((acc, cur) => acc + cur.counter, 0)
    );
  } catch (e) {
    if (e instanceof FormattedError) throw e;
    console.error(e);
    throw new FormattedError();
  }
}
