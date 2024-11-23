CREATE TABLE IF NOT EXISTS "channel_link" (
	"id" text,
	"discord_server_id" text NOT NULL,
	"twitch_channel_id" text NOT NULL,
	"enabled" boolean DEFAULT true NOT NULL,
	"updated_at" timestamp NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "unique" UNIQUE("discord_server_id","twitch_channel_id")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "discord_server" (
	"id" text,
	"guild_id" text NOT NULL,
	"enabled" boolean DEFAULT true NOT NULL,
	"updated_at" timestamp NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "discord_server_guild_id_unique" UNIQUE("guild_id")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "twitch_channel" (
	"id" text,
	"user_name" text NOT NULL,
	"enabled" boolean DEFAULT true NOT NULL,
	"token_id" text NOT NULL,
	"updated_at" timestamp NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "twitch_channel_user_name_unique" UNIQUE("user_name")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "twitch_user_token" (
	"id" text,
	"user_id" text NOT NULL,
	"is_bot_token" boolean DEFAULT false NOT NULL,
	"access_token" text NOT NULL,
	"refresh_token" text,
	"expires_in" integer,
	"obtained_at" timestamp NOT NULL,
	"updated_at" timestamp NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "twitch_user_token_user_id_unique" UNIQUE("user_id")
);
