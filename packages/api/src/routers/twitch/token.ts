import { z } from "zod";
import { getTwitchUserToken } from "../../controllers/twitchUserToken";
import { publicProcedure, router } from "../../trpc";

const twitchTokenRouter = router({
  getToken: publicProcedure
    .input(z.object({ userId: z.string() }))
    .query(async ({ input }) => {
      return getTwitchUserToken(input.userId);
    }),
});
