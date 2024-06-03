import prisma from "../libs/prisma";

export const listTwitchUserTokens = async (expiredOnly = false) => {
  const tokens = await prisma.twitchUserToken.findMany({
    select: {
      userId: true,
      accessToken: true,
      refreshToken: true,
      isBotToken: true,
      obtainedAt: true,
      expiresIn: true,
    },
    where: { isBotToken: false },
  });

  return expiredOnly
    ? tokens.filter(
        (token) =>
          token.expiresIn !== null &&
          token.obtainedAt !== null &&
          token.obtainedAt.getTime() + token.expiresIn * 1000 < Date.now()
      )
    : tokens;
};

export const getTwitchUserToken = async (userId?: string) => {
  return userId
    ? prisma.twitchUserToken.findUnique({
        select: {
          userId: true,
          accessToken: true,
          refreshToken: true,
          isBotToken: true,
          obtainedAt: true,
          expiresIn: true,
        },
        where: { userId },
      })
    : prisma.twitchUserToken.findFirst({
        select: {
          userId: true,
          accessToken: true,
          refreshToken: true,
          isBotToken: true,
          obtainedAt: true,
          expiresIn: true,
        },
        where: { isBotToken: true },
      });
};

export const createTwitchUserToken = async (
  input: CreateTwitchUserTokenInput
) => {
  return prisma.twitchUserToken.upsert({
    where: { userId: input.userId },
    create: {
      ...input,
      isBotToken: false,
    },
    update: {
      ...input,
      isBotToken: false,
    },
    select: {
      userId: true,
      accessToken: true,
      refreshToken: true,
      isBotToken: true,
      obtainedAt: true,
      expiresIn: true,
    },
  });
};

interface CreateTwitchUserTokenInput {
  userId: string;
  accessToken: string;
  refreshToken: string | null;
  expiresIn: number | null;
  obtainedAt: Date;
}

export const updateTwitchUserToken = async (
  userId: string,
  input: UpdateTwitchUserTokenInput
) => {
  return prisma.twitchUserToken.update({
    select: {
      userId: true,
      accessToken: true,
      refreshToken: true,
      isBotToken: true,
      obtainedAt: true,
      expiresIn: true,
    },
    where: { userId },
    data: input,
  });
};

interface UpdateTwitchUserTokenInput {
  accessToken: string;
  refreshToken: string | null;
  expiresIn: number | null;
  obtainedAt: Date;
}

export const deleteTwitchUserToken = async (userId: string) => {
  return prisma.twitchUserToken.delete({
    select: {
      userId: true,
      accessToken: true,
      refreshToken: true,
      isBotToken: true,
      obtainedAt: true,
      expiresIn: true,
    },
    where: { userId },
  });
};
