import { createId } from "@paralleldrive/cuid2";
import { boolean, pgTable, text, varchar } from "drizzle-orm/pg-core";

export const todo = pgTable("todo", {
  id: varchar("id", { length: 128 }).$defaultFn(() => createId()),
  text: text("text").notNull(),
  done: boolean("done").default(false).notNull(),
});
