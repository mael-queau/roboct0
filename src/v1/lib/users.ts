import { PrismaClient } from "@prisma/client";
import { PrismaClientKnownRequestError } from "@prisma/client/runtime";
import { createState, isValidState } from "../../oauth/helper";
import { FormattedError } from "../types/error";
import { verifyChannel } from "./channels";

const prisma = new PrismaClient();

/**
 * Upsert a list of Twitch users into the database.
 * @description This takes a list of Twitch logins, converts them to Twitch IDs using the Twitch API, and then upserts them into the database.
 * @param users A list of Twitch logins.
 * @param channelId An optional Twitch channel ID to associate the users with.
 * @param force Whether to ignore disabled items.
 */
export async function upsertTwitchUsers(
  users: string[],
  channelId?: string,
  force: boolean = false
) {
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

    const batches = [];
    for (let i = 0; i < users.length; i += 100) {
      batches.push(users.slice(i, i + 100));
    }

    const twitchIds = [];
    for (const batch of batches) {
      const response = await fetch(
        `https://api.twitch.tv/helix/users?login=${batch.join("&login=")}`,
        {
          headers: {
            "Client-ID": process.env.TWITCH_ID!,
            "Authorization": `Bearer ${accessToken}`,
          },
        }
      );

      if (!response.ok) {
        console.error(`[BOT OAUTH ERROR] ${response.status}`.bgYellow);
        throw new FormattedError();
      }

      const { data } = await response.json();
      twitchIds.push(
        ...data.map(
          (user: { id: string; [key: string]: string | number }) => user.id
        )
      );
    }

    if (channelId) {
      if (!force) {
        if ((await verifyChannel(channelId)) === false) {
          throw new FormattedError("This channel is disabled.", 403);
        }
      }

      await prisma.channel.update({
        data: {
          users: {
            connectOrCreate: twitchIds.map((twitchId) => ({
              create: {
                twitchId,
              },
              where: {
                twitchId,
              },
            })),
          },
        },
        where: {
          channelId,
        },
      });
    } else {
      await Promise.all(
        twitchIds.map((twitchId) => {
          return prisma.user.upsert({
            create: {
              twitchId,
            },
            update: {
              twitchId,
            },
            where: {
              twitchId,
            },
          });
        })
      );
    }
  } catch (e) {
    if (e instanceof FormattedError) throw e;
    if (e instanceof PrismaClientKnownRequestError) {
      switch (e.code) {
        case "P2025":
          throw new FormattedError("User not found.", 404);
        case "P2002":
          throw new FormattedError("User already exists.", 409);
        default:
          break;
      }
    }
    console.error(e);
    throw new FormattedError();
  }
}

/**
 * Generate a Twitch OAuth URL to link a user's accounts
 * @param userId The Discord user ID that issued the request to link.
 * @returns The URL.
 */
export async function generateLinkUrl(userId: string) {
  try {
    const user = await prisma.user.findUnique({
      where: {
        discordId: userId,
      },
    });

    if (user !== null) {
      throw new FormattedError(
        "This user is already linked to a Twitch account.",
        409
      );
    }

    const state = await createState();

    await prisma.pendingAccountLink.deleteMany({
      where: {
        discordId: userId,
      },
    });

    await prisma.pendingAccountLink.create({
      data: {
        discordId: userId,
        state: {
          connect: {
            value: state,
          },
        },
      },
    });

    let url = `https://id.twitch.tv/oauth2/authorize`;
    url += `?client_id=${process.env.TWITCH_ID}`;
    url += `&force_verify=true`;
    url += `&redirect_uri=${process.env.API_URL}/oauth/v1/users/callback`;
    url += `&response_type=code`;
    url += `&state=${state}`;

    return url;
  } catch (e) {
    if (e instanceof FormattedError) throw e;
    if (e instanceof PrismaClientKnownRequestError) {
      switch (e.code) {
        case "P2002":
          throw new FormattedError(
            "There was an error trying to initiate account linking procedure.",
            409
          );
        default:
          break;
      }
    }
    console.error(e);
    throw new FormattedError();
  }
}

/**
 * Returns the information associated with a Twitch user.
 * @param twitchId The Twitch ID.
 * @param force Whether to ignore disabled items.
 * @returns The user's information.
 */
export async function getTwitchUserInfo(
  twitchId: string,
  force: boolean = false
) {
  try {
    const user = await prisma.user.findUnique({
      select: {
        discordId: true,
        linkedAt: true,
        optOut: true,
        twitchId: true,
        registeredAt: true,
      },
      where: {
        twitchId,
      },
    });

    if (user === null) {
      throw new FormattedError("User not found.", 404);
    }

    if (!force && user.optOut) {
      throw new FormattedError("This user has opted out.", 403);
    }

    return user;
  } catch (e) {
    if (e instanceof FormattedError) throw e;
    console.error(e);
    throw new FormattedError();
  }
}

/**
 * Returns the information associated with a Discord user.
 * @param discordId The Discord ID.
 * @param force Whether to ignore disabled items.
 * @returns The user's information.
 */
export async function getDiscordUserInfo(
  discordId: string,
  force: boolean = false
) {
  try {
    const user = await prisma.user.findUnique({
      where: {
        discordId,
      },
    });

    if (user === null) {
      throw new FormattedError(
        "This accoun't isn't linked with any Twitch account.",
        404
      );
    }

    if (!force && user.optOut) {
      throw new FormattedError("This user has opted out.", 403);
    }

    return user;
  } catch (e) {
    if (e instanceof FormattedError) throw e;
    console.error(e);
    throw new FormattedError();
  }
}

/**
 * Link an Twitch account to a Discord account.
 * @description This takes a Twitch user ID and a State parameter (used to create the OAuth request) and links the two accounts, if the conditions are met.
 * @param twitchId The Twitch user ID.
 * @param stateString The State parameter.
 * @returns An object containing the Discord user ID and the Twitch user ID.
 */
export async function linkAccount(twitchId: string, stateString: string) {
  try {
    if ((await isValidState(stateString)) === false) {
      throw new FormattedError("Invalid state.", 401);
    }

    const state = await prisma.state.findUnique({
      where: {
        value: stateString,
      },
    });

    if (state === null) {
      throw new FormattedError("Invalid state.", 401);
    }

    const pendingAccountLink = await prisma.pendingAccountLink.findUnique({
      where: {
        stateId: state.id,
      },
    });

    if (pendingAccountLink === null) {
      throw new FormattedError(
        "This attempt to link accounts has failed. Please try again.",
        400
      );
    }

    const { discordId } = pendingAccountLink;

    await prisma.pendingAccountLink.deleteMany({
      where: {
        discordId,
      },
    });

    await prisma.user.upsert({
      create: {
        discordId,
        twitchId,
        linkedAt: new Date(),
      },
      update: {
        discordId,
        linkedAt: new Date(),
      },
      where: {
        twitchId,
      },
    });

    return { discordId, twitchId };
  } catch (e) {
    if (e instanceof FormattedError) throw e;
    if (e instanceof PrismaClientKnownRequestError) {
      switch (e.code) {
        case "P2025":
          throw new FormattedError("User not found.", 404);
        default:
          break;
      }
    }
    console.error(e);
    throw new FormattedError();
  }
}

/**
 * Argument for the unlinkAccount function.
 */
interface userIds {
  discordId?: string;
  twitchId?: string;
}

/**
 * Unlink a Twitch account from a Discord account.
 * @param userIds The Discord user ID and Twitch user ID.
 * @param userIds.discordId The Discord user ID.
 * @param userIds.twitchId The Twitch user ID.
 */
export async function unlinkAccount({ discordId, twitchId }: userIds) {
  if (discordId === undefined && twitchId === undefined)
    throw new FormattedError("No Discord or Twitch ID was provided.", 400);

  try {
    const result = await prisma.user.update({
      data: {
        discordId: null,
        linkedAt: null,
      },
      where: {
        discordId,
        twitchId,
      },
    });

    return result;
  } catch (e) {
    if (e instanceof PrismaClientKnownRequestError) {
      if (e.code === "P2025")
        throw new FormattedError(
          "This account isn't linked to any other.",
          404
        );
    }
    console.error(e);
    throw new FormattedError();
  }
}

/**
 * Opts an user in or out of RobOct0's features.
 * @param userId The Twitch user ID.
 */
export async function optInOut(userId: string, toggle?: boolean) {
  try {
    const existing = await prisma.user.findUnique({
      select: {
        discordId: true,
        linkedAt: true,
        optOut: true,
        twitchId: true,
        registeredAt: true,
      },
      where: {
        twitchId: userId,
      },
    });

    if (existing === null) {
      throw new FormattedError("User not found.", 404);
    }

    const result = await prisma.user.update({
      data: {
        optOut: toggle ?? !existing.optOut,
      },
      select: {
        discordId: true,
        linkedAt: true,
        optOut: true,
        twitchId: true,
        registeredAt: true,
      },
      where: {
        twitchId: userId,
      },
    });

    return result;
  } catch (e) {
    if (e instanceof PrismaClientKnownRequestError) {
      if (e.code === "P2025")
        throw new FormattedError("Couldn't find the specified account.", 404);
    }
    console.error(e);
    throw new FormattedError();
  }
}
