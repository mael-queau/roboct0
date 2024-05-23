import { z } from "zod";
import {
  createTwitchUserToken,
  deleteTwitchUserToken,
  getTwitchUserToken,
  listTwitchUserTokens,
  updateTwitchUserToken,
} from "../../controllers/twitchUserToken";
import { publicProcedure, router } from "../../trpc";

export const twitchTokenRouter = router({
  listTokens: publicProcedure.query(async () => {
    return listTwitchUserTokens();
  }),
  getBotToken: publicProcedure.query(async () => {
    return getTwitchUserToken();
  }),
  getToken: publicProcedure
    .input(z.object({ userId: z.string() }))
    .query(async (opts) => {
      const { userId } = opts.input;

      return getTwitchUserToken(userId);
    }),
  createToken: publicProcedure
    .input(
      z.object({
        userId: z.string(),
        accessToken: z.string(),
        refreshToken: z.string().nullable(),
        expiresIn: z.number().nullable(),
        obtainedAt: z.date(),
      })
    )
    .mutation(async (opts) => {
      const { userId, accessToken, refreshToken, expiresIn, obtainedAt } =
        opts.input;

      return createTwitchUserToken({
        userId,
        accessToken,
        refreshToken,
        expiresIn,
        obtainedAt,
      });
    }),
  updateToken: publicProcedure
    .input(
      z.object({
        userId: z.string(),
        accessToken: z.string(),
        refreshToken: z.string().nullable(),
        expiresIn: z.number().nullable(),
        obtainedAt: z.date(),
      })
    )
    .mutation(async (opts) => {
      const { userId, accessToken, refreshToken, expiresIn, obtainedAt } =
        opts.input;

      return updateTwitchUserToken(userId, {
        accessToken,
        refreshToken,
        expiresIn,
        obtainedAt,
      });
    }),
  deleteToken: publicProcedure
    .input(z.object({ userId: z.string() }))
    .mutation(async (opts) => {
      const { userId } = opts.input;

      return deleteTwitchUserToken(userId);
    }),
});
