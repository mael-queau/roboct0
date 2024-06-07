import prisma from "../libs/prisma";

export const listTwitchChannels = async (skip = 0, take = 10) => {
  const channels = await prisma.twitchChannel.findMany({
    select: {
      id: true,
      userName: true,
    },
    skip,
    take,
  });

  return channels;
};

export const getTwitchChannel = async (id: string) => {
  return prisma.twitchChannel.findUnique({
    select: {
      id: true,
      userName: true,
    },
    where: { id },
  });
};

export const getTwitchChannelForUserId = async (userId: string) => {
  return prisma.twitchChannel.findFirst({
    select: {
      id: true,
      userName: true,
    },
    where: {
      token: {
        userId,
      },
    },
  });
};

export const createTwitchChannelForUserId = async (
  userId: string,
  input: CreateTwitchChannelInput
) => {
  return prisma.twitchChannel.upsert({
    where: {
      userName: input.userName,
    },
    create: {
      ...input,
      token: {
        connect: {
          userId,
        },
      },
    },
    update: {
      ...input,
    },
    select: {
      id: true,
      userName: true,
    },
  });
};

interface CreateTwitchChannelInput {
  userName: string;
}

export const updateTwitchChannel = async (
  id: string,
  input: UpdateTwitchChannelInput
) => {
  return prisma.twitchChannel.update({
    where: { id },
    data: input,
    select: {
      id: true,
      userName: true,
    },
  });
};

interface UpdateTwitchChannelInput {
  userName: string;
}
