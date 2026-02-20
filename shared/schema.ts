import { sql } from "drizzle-orm";
import { pgTable, text, varchar, integer, boolean, timestamp, jsonb } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const AGENT_IDS = ["coordinator", "researcher", "skeptic", "coder", "writer", "summarizer"] as const;
export type AgentId = typeof AGENT_IDS[number];

export const RUN_STATUSES = ["idle", "running", "paused", "done", "error"] as const;
export type RunStatus = typeof RUN_STATUSES[number];

export const USER_ROLES = ["admin", "user", "viewer"] as const;
export type UserRole = typeof USER_ROLES[number];

export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  role: text("role").notNull().default("user"),
  disabled: boolean("disabled").notNull().default(false),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const rooms = pgTable("rooms", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  archived: boolean("archived").notNull().default(false),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const runs = pgTable("runs", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  roomId: varchar("room_id").notNull(),
  userId: varchar("user_id").notNull(),
  status: text("status").notNull().default("idle"),
  configJson: jsonb("config_json"),
  currentRound: integer("current_round").notNull().default(0),
  maxRounds: integer("max_rounds").notNull().default(3),
  bestAnswer: text("best_answer"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const messages = pgTable("messages", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  roomId: varchar("room_id").notNull(),
  runId: varchar("run_id"),
  round: integer("round"),
  agentId: text("agent_id"),
  role: text("role").notNull().default("agent"),
  content: text("content").notNull(),
  sourcesJson: jsonb("sources_json"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const prompts = pgTable("prompts", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  scope: text("scope").notNull().default("global"),
  agentId: text("agent_id"),
  version: integer("version").notNull().default(1),
  label: text("label").notNull().default(""),
  content: text("content").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const triggers = pgTable("triggers", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  configJson: jsonb("config_json"),
  promptOverridesJson: jsonb("prompt_overrides_json"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertUserSchema = createInsertSchema(users).omit({ id: true, createdAt: true });
export const insertRoomSchema = createInsertSchema(rooms).omit({ id: true, createdAt: true });
export const insertRunSchema = createInsertSchema(runs).omit({ id: true, createdAt: true, updatedAt: true });
export const insertMessageSchema = createInsertSchema(messages).omit({ id: true, createdAt: true });
export const insertPromptSchema = createInsertSchema(prompts).omit({ id: true, createdAt: true });
export const insertTriggerSchema = createInsertSchema(triggers).omit({ id: true, createdAt: true });

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;
export type InsertRoom = z.infer<typeof insertRoomSchema>;
export type Room = typeof rooms.$inferSelect;
export type InsertRun = z.infer<typeof insertRunSchema>;
export type Run = typeof runs.$inferSelect;
export type InsertMessage = z.infer<typeof insertMessageSchema>;
export type Message = typeof messages.$inferSelect;
export type InsertPrompt = z.infer<typeof insertPromptSchema>;
export type Prompt = typeof prompts.$inferSelect;
export type InsertTrigger = z.infer<typeof insertTriggerSchema>;
export type Trigger = typeof triggers.$inferSelect;

export interface RunConfig {
  rounds: number;
  alwaysLatest: boolean;
  citationsRequired: boolean;
  enabledAgents: AgentId[];
  triggerId?: string;
}

export interface AgentState {
  agentId: AgentId;
  status: RunStatus;
  lastOutput: string;
}

export interface SSEEvent {
  type: string;
  data: Record<string, unknown>;
}
