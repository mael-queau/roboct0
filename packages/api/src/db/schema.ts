import { createId } from "@paralleldrive/cuid2";
import { relations } from "drizzle-orm";
import {
  boolean,
  integer,
  pgTable,
  text,
  timestamp,
  unique,
} from "drizzle-orm/pg-core";

const _timestamps = {
  updatedAt: timestamp("updated_at", { mode: "string" })
    .$onUpdateFn(() => new Date().toISOString())
    .notNull(),
  createdAt: timestamp("created_at", { mode: "string" }).defaultNow().notNull(),
};

export const twitchUserToken = pgTable("twitch_user_token", {
  id: text().$defaultFn(() => createId()),
  userId: text("user_id").notNull().unique(),
  isBotToken: boolean("is_bot_token").default(false).notNull(),
  accessToken: text("access_token").notNull(),
  refreshToken: text("refresh_token"),
  expiresIn: integer("expires_in"),
  obtainedAt: timestamp("obtained_at", { mode: "string" }).notNull(),
  ..._timestamps,
});

export const twitchUserTokenRelations = relations(
  twitchUserToken,
  ({ one }) => ({
    twitchChannel: one(twitchChannel),
  })
);

export const twitchChannel = pgTable("twitch_channel", {
  id: text().$defaultFn(() => createId()),
  userName: text("user_name").notNull().unique(),
  enabled: boolean().default(true).notNull(),
  tokenId: text("token_id").notNull(),
  ..._timestamps,
});

export const twitchChannelRelations = relations(twitchChannel, ({ one }) => ({
  twitchUserToken: one(twitchUserToken, {
    fields: [twitchChannel.tokenId],
    references: [twitchUserToken.id],
  }),
  channelLink: one(channelLink, {
    fields: [twitchChannel.id],
    references: [channelLink.twitchChannelId],
  }),
}));

export const discordServer = pgTable("discord_server", {
  id: text().$defaultFn(() => createId()),
  guildId: text("guild_id").notNull().unique(),
  enabled: boolean().default(true).notNull(),
  ..._timestamps,
});

export const discordServerRelations = relations(discordServer, ({ one }) => ({
  channelLink: one(channelLink, {
    fields: [discordServer.id],
    references: [channelLink.discordServerId],
  }),
}));

export const channelLink = pgTable(
  "channel_link",
  {
    id: text().$defaultFn(() => createId()),
    discordServerId: text("discord_server_id").notNull(),
    twitchChannelId: text("twitch_channel_id").notNull(),
    enabled: boolean().default(true).notNull(),
    ..._timestamps,
  },
  (table) => [unique("unique").on(table.discordServerId, table.twitchChannelId)]
);
