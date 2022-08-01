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
 * Get a list of suggestions.
 * @param channelId The channel to get them from.
 * @param limit The maximum number of results to return.
 * @param offset The number of results to skip.
 * @param force Whether to bypass disabled items.
 * @returns A list of quotes.
 */
export async function getChannelSuggestions(
  channelId: string,
  limit: number = 20,
  offset: number = 0,
  force: boolean = false
) {
  if (!force) {
    if ((await verifyChannel(channelId)) === false) {
      throw new FormattedError("This channel is disabled.", 403);
    }
  }

  if (limit < 1) {
    throw new FormattedError("Limit must be a positive integer.", 400);
  }

  if (offset < 0) {
    throw new FormattedError("Offset must be a positive integer.", 400);
  }

  try {
    const results = await prisma.suggestion.findMany({
      select: {
        suggestionId: true,
        content: true,
        date: true,
        channelId: true,
        user: {
          select: {
            twitchId: true,
            discordId: true,
          },
        },
      },
      where: {
        channelId: channelId,
      },
      orderBy: {
        date: "desc",
      },
      take: limit,
      skip: offset,
    });

    if (results.length === 0) {
      throw new FormattedError("No suggestions found.", 404);
    }

    return results;
  } catch (e) {
    if (e instanceof FormattedError) throw e;

    console.error(e);
    throw new FormattedError();
  }
}

/**
 * Register a suggestion.
 * @param content The content of the suggestion.
 * @param user The user who made the suggestion.
 * @param user.twitchId The user's Twitch ID.
 * @param user.discordId The user's Discord ID.
 * @param channelId The channel the suggestion was made to.
 * @param force Whether to ignore disabled items.
 */
export async function registerSuggestion(
  content: string,
  { twitchId, discordId }: UserInfo,
  channelId: string,
  force: boolean = false
) {
  try {
    if (!force && (await verifyChannel(channelId)) === false) {
      throw new FormattedError("This channel is disabled.", 403);
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

    const channel = await prisma.channel.update({
      data: {
        suggestionIndex: {
          increment: 1,
        },
      },
      where: {
        channelId,
      },
    });

    if (channel === null) {
      throw new FormattedError("Channel not found.", 404);
    }

    const result = await prisma.suggestion.create({
      data: {
        content,
        suggestionId: channel.suggestionIndex,
        channelId,
        userId: user.twitchId,
      },
      select: {
        suggestionId: true,
        content: true,
        date: true,
        channelId: true,
        user: {
          select: {
            twitchId: true,
            discordId: true,
          },
        },
      },
    });

    return result;
  } catch (e) {
    if (e instanceof FormattedError) throw e;
    if (e instanceof PrismaClientKnownRequestError) {
      if (e.code === "P2002") {
        throw new FormattedError("Suggestion already exists.", 409);
      }
    }

    console.error(e);
    throw new FormattedError();
  }
}

/**
 * Undo a certain amount of suggestions from a certain user.
 * @param channelId The channel to undo them from.
 * @param user The user whose suggestions to undo.
 * @param user.twitchId The user's Twitch ID.
 * @param user.discordId The user's Discord ID.
 * @param amount The amount of suggestions to undo.
 * @param force Whether to bypass disabled items.
 * @returns The list of undone suggestions.
 */
export async function undoSuggestions(
  channelId: string,
  { twitchId, discordId }: UserInfo,
  amount: number = 1,
  force: boolean = false
) {
  if (!force) {
    if ((await verifyChannel(channelId)) === false) {
      throw new FormattedError("This channel is disabled.", 403);
    }
  }

  if (amount < 1) {
    throw new FormattedError("Amount must be a positive integer.", 400);
  }

  if (twitchId === undefined && discordId === undefined) {
    throw new FormattedError("Please provide a Twitch ID or Discord ID.", 400);
  }

  try {
    const user =
      twitchId !== undefined
        ? await getTwitchUserInfo(twitchId, force)
        : await getDiscordUserInfo(discordId!, force);

    if (user === null) {
      throw new FormattedError("User not found.", 404);
    }

    const suggestions = await prisma.suggestion.findMany({
      select: {
        id: true,
      },
      where: {
        channelId,
        userId: user.twitchId,
      },
      orderBy: {
        suggestionId: "desc",
      },
      take: amount,
    });

    const results = await Promise.all(
      suggestions.map((suggestion) =>
        prisma.suggestion.delete({
          where: {
            id: suggestion.id,
          },
          select: {
            suggestionId: true,
            content: true,
            date: true,
            channelId: true,
            user: {
              select: {
                twitchId: true,
                discordId: true,
              },
            },
          },
        })
      )
    );

    if (results.length === 0) {
      throw new FormattedError("No suggestions found.", 404);
    }

    return results;
  } catch (e) {
    if (e instanceof FormattedError) throw e;

    console.error(e);
    throw new FormattedError();
  }
}

/**
 * Deletes a suggestion by its ID and channel ID.
 * @param suggestionId The ID of the suggestion to delete.
 * @param channelId The channel the suggestion was made to.
 * @param force Whether to bypass disabled items.
 * @returns The deleted suggestion.
 */
export async function deleteSuggestion(
  suggestionId: number,
  channelId: string,
  force: boolean = false
) {
  if (!force) {
    if ((await verifyChannel(channelId)) === false) {
      throw new FormattedError("This channel is disabled.", 403);
    }
  }

  try {
    const suggestion = await prisma.suggestion.delete({
      where: {
        channelId_suggestionId: {
          channelId,
          suggestionId,
        },
      },
      select: {
        suggestionId: true,
        content: true,
        date: true,
        channelId: true,
        user: {
          select: {
            twitchId: true,
            discordId: true,
          },
        },
      },
    });

    return suggestion;
  } catch (e) {
    if (e instanceof FormattedError) throw e;
    if (e instanceof PrismaClientKnownRequestError) {
      if (e.code === "P2025") {
        throw new FormattedError("Suggestion not found.", 404);
      }
    }

    console.error(e);
    throw new FormattedError();
  }
}

/**
 * Clears a channel's suggestions.
 * @param channelId The channel to clear.
 * @param user An optional user to clear the suggestions of.
 * @param user.twitchId The user's Twitch ID.
 * @param user.discordId The user's Discord ID.
 * @param force Whether to bypass disabled items.
 * @returns The list of deleted suggestions.
 */
export async function clearSuggestions(
  channelId: string,
  force: boolean = false
) {
  if (!force) {
    if ((await verifyChannel(channelId)) === false) {
      throw new FormattedError("This channel is disabled.", 403);
    }
  }

  try {
    const results = await prisma.suggestion.deleteMany({
      where: {
        channelId,
      },
    });

    await prisma.channel.update({
      data: {
        suggestionIndex: 0,
      },
      where: {
        channelId,
      },
    });

    if (results.count === 0) {
      throw new FormattedError("No suggestions found.", 404);
    }

    return results.count;
  } catch (e) {
    if (e instanceof FormattedError) throw e;

    console.error(e);
    throw new FormattedError();
  }
}

/**
 * Clear all of a user's suggestions for a channel.
 * @param channelId The channel to clear.
 * @param user The user to clear the suggestions of.
 * @param user.twitchId The user's Twitch ID.
 * @param user.discordId The user's Discord ID.
 * @param force Whether to bypass disabled items.
 * @returns The list of deleted suggestions.
 */
export async function clearUserSuggestions(
  channelId: string,
  { twitchId, discordId }: UserInfo,
  force: boolean = false
) {
  if (!force) {
    if ((await verifyChannel(channelId)) === false) {
      throw new FormattedError("This channel is disabled.", 403);
    }
  }

  if (twitchId === undefined && discordId === undefined) {
    throw new FormattedError("Please provide a Twitch ID or Discord ID.", 400);
  }

  try {
    const user =
      twitchId !== undefined
        ? await getTwitchUserInfo(twitchId, force)
        : await getDiscordUserInfo(discordId!, force);

    if (user === null) {
      throw new FormattedError("User not found.", 404);
    }

    const results = await prisma.suggestion.deleteMany({
      where: {
        channelId,
        userId: user.twitchId,
      },
    });

    if (results.count === 0) {
      throw new FormattedError("No suggestions found.", 404);
    }

    return results.count;
  } catch (e) {
    if (e instanceof FormattedError) throw e;

    console.error(e);
    throw new FormattedError();
  }
}

/**
 * Get a list of a user's suggestions.
 * @param twitchId The user's Twitch ID.
 * @param channelId An optional channel to filter by.
 * @param limit The maximum amount of suggestions to return.
 * @param offset The amount of suggestions to skip.
 * @param force Whether to bypass disabled items.
 * @returns The list of suggestions.
 */
export async function getUserSuggestions(
  twitchId: string,
  channelId?: string,
  limit: number = 20,
  offset: number = 0,
  force: boolean = false
) {
  if (!force && channelId !== undefined) {
    if ((await verifyChannel(channelId)) === false) {
      throw new FormattedError("This channel is disabled.", 403);
    }
  }

  try {
    const user = await getTwitchUserInfo(twitchId, force);

    if (user === null) {
      throw new FormattedError("User not found.", 404);
    }

    const suggestions = await prisma.suggestion.findMany({
      select: {
        suggestionId: true,
        content: true,
        date: true,
        channelId: true,
        user: {
          select: {
            twitchId: true,
            discordId: true,
          },
        },
      },
      where: {
        userId: user.twitchId,
        channelId: channelId ? channelId : undefined,
      },
      orderBy: {
        suggestionId: "desc",
      },
      skip: offset,
      take: limit,
    });

    if (suggestions.length === 0) {
      throw new FormattedError("No suggestions found.", 404);
    }

    return suggestions;
  } catch (e) {
    if (e instanceof FormattedError) throw e;

    console.error(e);
    throw new FormattedError();
  }
}
