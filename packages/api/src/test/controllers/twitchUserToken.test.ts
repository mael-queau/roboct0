// file deepcode ignore HardcodedNonCryptoSecret/test: Dummy secrets used for testing purposes

import type { TwitchUserToken } from "@prisma/client";
import { expect, test, vi } from "vitest";
import {
  createTwitchUserToken,
  deleteTwitchUserToken,
  getTwitchUserToken,
  listTwitchUserTokens,
  updateTwitchUserToken,
} from "../../controllers/twitchUserToken";
import prisma from "../../libs/__mocks__/prisma";

vi.mock("../../libs/prisma");

test("listTwitchUserTokens", async () => {
  const tokens = [
    {
      userId: "1",
      accessToken: "access-token-1",
      refreshToken: "refresh-token-1",
      isBotToken: false,
      obtainedAt: new Date(),
      expiresIn: 3600,
    },
    {
      userId: "2",
      accessToken: "access-token-2",
      refreshToken: "refresh-token-2",
      isBotToken: false,
      obtainedAt: new Date(Date.now() - 3600 * 1000), // 1 hour ago
      expiresIn: 0,
    },
  ];

  prisma.twitchUserToken.findMany.mockResolvedValue(
    tokens as TwitchUserToken[]
  );

  const result = await listTwitchUserTokens();
  const expiredResults = await listTwitchUserTokens(true);

  expect(result).toEqual(tokens);
  expect(expiredResults).toEqual([tokens[1]]);
});

test("createTwitchUserToken", async () => {
  const token = {
    userId: "1",
    accessToken: "access-token-1",
    refreshToken: "refresh-token-1",
    isBotToken: false,
    obtainedAt: new Date(),
    expiresIn: 3600,
  };

  prisma.twitchUserToken.create.mockResolvedValue(token as TwitchUserToken);

  const result = await createTwitchUserToken({
    userId: "1",
    accessToken: "access-token-1",
    refreshToken: "refresh-token-1",
    obtainedAt: new Date(),
    expiresIn: 3600,
  });

  expect(result).toEqual(token);
});

test("getTwitchUserToken", async () => {
  const token = {
    userId: "1",
    accessToken: "access-token-1",
    refreshToken: "refresh-token-1",
    isBotToken: false,
    obtainedAt: new Date(),
    expiresIn: 3600,
  };

  prisma.twitchUserToken.findUnique.mockResolvedValue(token as TwitchUserToken);

  const result = await getTwitchUserToken("1");

  expect(result).toEqual(token);
});

test("updateTwitchUserToken", async () => {
  const token = {
    userId: "1",
    accessToken: "access-token-1",
    refreshToken: "refresh-token-1",
    isBotToken: false,
    obtainedAt: new Date(),
    expiresIn: 3600,
  };

  const updatedToken = {
    accessToken: "new-access-token-1",
    refreshToken: "new-refresh-token-1",
    obtainedAt: new Date(Date.now() + 3600 * 1000), // 1 hour later
    expiresIn: 3600,
  };

  prisma.twitchUserToken.update.mockResolvedValue({
    ...token,
    ...updatedToken,
  } as TwitchUserToken);

  const result = await updateTwitchUserToken("1", {
    accessToken: updatedToken.accessToken,
    refreshToken: updatedToken.refreshToken,
    obtainedAt: updatedToken.obtainedAt,
    expiresIn: updatedToken.expiresIn,
  });

  expect(result).toEqual({
    ...token,
    ...updatedToken,
  });
});

test("deleteTwitchUserToken", async () => {
  const token = {
    userId: "1",
    accessToken: "access-token-1",
    refreshToken: "refresh-token-1",
    isBotToken: false,
    obtainedAt: new Date(),
    expiresIn: 3600,
  };

  prisma.twitchUserToken.delete.mockResolvedValue(token as TwitchUserToken);

  const result = await deleteTwitchUserToken("1");

  expect(result).toEqual(token);
});
