import { pgTable, text, timestamp, jsonb } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { nanoid } from "nanoid";
import { users } from "./auth";

export const chatSessions = pgTable("chat_session", {
  id: text("id").primaryKey().$defaultFn(() => nanoid()),
  userId: text("user_id").references(() => users.id),
  title: text("title"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const chatMessages = pgTable("chat_message", {
  id: text("id").primaryKey().$defaultFn(() => nanoid()),
  sessionId: text("session_id").references(() => chatSessions.id, { onDelete: "cascade" }),
  role: text("role", { enum: ["user", "assistant", "system"] }).notNull(),
  content: text("content").notNull(),
  metadata: jsonb("metadata"),
  createdAt: timestamp("created_at").defaultNow(),
});

// ── Relations ──────────────────────────────────────────────────
export const chatSessionsRelations = relations(chatSessions, ({ one, many }) => ({
  user: one(users, {
    fields: [chatSessions.userId],
    references: [users.id],
  }),
  messages: many(chatMessages),
}));

export const chatMessagesRelations = relations(chatMessages, ({ one }) => ({
  session: one(chatSessions, {
    fields: [chatMessages.sessionId],
    references: [chatSessions.id],
  }),
}));
