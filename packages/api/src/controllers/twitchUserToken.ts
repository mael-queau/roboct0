import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export const listTwitchUserTokens = async (expiredOnly = false) => {
  const tokens = await prisma.twitchUserToken.findMany({
    where: { isBotToken: false },
  });

  return expiredOnly
    ? tokens.filter(
        (token) =>
          token.expiresIn &&
          token.obtainedAt.getTime() + token.expiresIn * 1000 < Date.now()
      )
    : tokens;
};

export const getTwitchUserToken = async (userId?: string) => {
  return userId
    ? prisma.twitchUserToken.findUnique({ where: { userId } })
    : prisma.twitchUserToken.findFirst({ where: { isBotToken: true } });
};

export const createTwitchUserToken = async (
  input: CreateTwitchUserTokenInput
) => {
  return prisma.twitchUserToken.create({
    data: {
      ...input,
      isBotToken: false,
    },
  });
};

interface CreateTwitchUserTokenInput {
  userId: string;
  accessToken: string;
  refreshToken: string;
  expiresIn: number | null;
  obtainedAt: Date;
}

export const updateTwitchUserToken = async (
  userId: string,
  input: UpdateTwitchUserTokenInput
) => {
  return prisma.twitchUserToken.update({
    where: { userId },
    data: input,
  });
};

interface UpdateTwitchUserTokenInput {
  accessToken?: string;
  refreshToken?: string;
  expiresIn?: number;
  obtainedAt?: Date;
}

export const deleteTwitchUserToken = async (userId: string) => {
  return prisma.twitchUserToken.delete({ where: { userId } });
};

export const deleteAllTwitchUserTokens = async () => {
  return prisma.twitchUserToken.deleteMany();
};
