import { z } from "zod";
import {
  listTwitchChannels,
  searchTwitchChannels,
} from "../../controllers/twitchChannel";
import { publicProcedure, router } from "../../trpc";

export const twitchChannelRouter = router({
  listChannels: publicProcedure
    .input(
      z.object({ skip: z.number().optional(), take: z.number().optional() })
    )
    .query(async (opts) => {
      const { skip, take } = opts.input;

      return listTwitchChannels(skip, take);
    }),
  searchChannels: publicProcedure
    .input(
      z.object({
        query: z.string(),
        skip: z.number().optional(),
        take: z.number().optional(),
      })
    )
    .query(async (opts) => {
      const { query, skip, take } = opts.input;

      return searchTwitchChannels(query, skip, take);
    }),
});
