import {
  type User, type InsertUser,
  type Room, type InsertRoom,
  type Run, type InsertRun,
  type Message, type InsertMessage,
  type Prompt, type InsertPrompt,
  type Trigger, type InsertTrigger,
  users, rooms, runs, messages, prompts, triggers,
} from "@shared/schema";
import { db } from "./db";
import { eq, and, desc, sql } from "drizzle-orm";

export interface IStorage {
  getUser(id: string): Promise<User | undefined>;
  getUsers(): Promise<User[]>;
  createUser(user: InsertUser): Promise<User>;
  updateUser(id: string, data: Partial<InsertUser & { disabled: boolean }>): Promise<User | undefined>;

  getRoom(id: string): Promise<Room | undefined>;
  getRooms(): Promise<Room[]>;
  createRoom(room: InsertRoom): Promise<Room>;
  updateRoom(id: string, data: Partial<InsertRoom>): Promise<Room | undefined>;

  getRun(id: string): Promise<Run | undefined>;
  getRunsByRoom(roomId: string): Promise<Run[]>;
  createRun(run: InsertRun): Promise<Run>;
  updateRun(id: string, data: Record<string, unknown>): Promise<Run | undefined>;

  getMessagesByRoom(roomId: string): Promise<Message[]>;
  getMessagesByRun(runId: string): Promise<Message[]>;
  createMessage(msg: InsertMessage): Promise<Message>;

  getPrompts(): Promise<Prompt[]>;
  createPrompt(prompt: InsertPrompt): Promise<Prompt>;
  getLatestPrompt(scope: string, agentId?: string): Promise<Prompt | undefined>;

  getTriggers(): Promise<Trigger[]>;
  getTrigger(id: string): Promise<Trigger | undefined>;
  createTrigger(trigger: InsertTrigger): Promise<Trigger>;
  deleteTrigger(id: string): Promise<void>;
}

export class DatabaseStorage implements IStorage {
  async getUser(id: string) {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async getUsers() {
    return db.select().from(users);
  }

  async createUser(user: InsertUser) {
    const [created] = await db.insert(users).values(user).returning();
    return created;
  }

  async updateUser(id: string, data: Partial<InsertUser & { disabled: boolean }>) {
    const [updated] = await db.update(users).set(data).where(eq(users.id, id)).returning();
    return updated;
  }

  async getRoom(id: string) {
    const [room] = await db.select().from(rooms).where(eq(rooms.id, id));
    return room;
  }

  async getRooms() {
    return db.select().from(rooms).orderBy(desc(rooms.createdAt));
  }

  async createRoom(room: InsertRoom) {
    const [created] = await db.insert(rooms).values(room).returning();
    return created;
  }

  async updateRoom(id: string, data: Partial<InsertRoom>) {
    const [updated] = await db.update(rooms).set(data).where(eq(rooms.id, id)).returning();
    return updated;
  }

  async getRun(id: string) {
    const [run] = await db.select().from(runs).where(eq(runs.id, id));
    return run;
  }

  async getRunsByRoom(roomId: string) {
    return db.select().from(runs).where(eq(runs.roomId, roomId)).orderBy(desc(runs.createdAt));
  }

  async createRun(run: InsertRun) {
    const [created] = await db.insert(runs).values(run).returning();
    return created;
  }

  async updateRun(id: string, data: Record<string, unknown>) {
    const [updated] = await db.update(runs).set({ ...data, updatedAt: new Date() }).where(eq(runs.id, id)).returning();
    return updated;
  }

  async getMessagesByRoom(roomId: string) {
    return db.select().from(messages).where(eq(messages.roomId, roomId)).orderBy(messages.createdAt);
  }

  async getMessagesByRun(runId: string) {
    return db.select().from(messages).where(eq(messages.runId, runId)).orderBy(messages.createdAt);
  }

  async createMessage(msg: InsertMessage) {
    const [created] = await db.insert(messages).values(msg).returning();
    return created;
  }

  async getPrompts() {
    return db.select().from(prompts).orderBy(desc(prompts.version));
  }

  async createPrompt(prompt: InsertPrompt) {
    const existing = await db
      .select()
      .from(prompts)
      .where(
        prompt.agentId
          ? and(eq(prompts.scope, prompt.scope || "agent"), eq(prompts.agentId, prompt.agentId))
          : eq(prompts.scope, prompt.scope || "global")
      )
      .orderBy(desc(prompts.version));

    const nextVersion = existing.length > 0 ? existing[0].version + 1 : 1;

    const [created] = await db.insert(prompts).values({
      ...prompt,
      version: nextVersion,
    }).returning();
    return created;
  }

  async getLatestPrompt(scope: string, agentId?: string) {
    const conditions = agentId
      ? and(eq(prompts.scope, scope), eq(prompts.agentId, agentId))
      : eq(prompts.scope, scope);

    const [latest] = await db.select().from(prompts).where(conditions).orderBy(desc(prompts.version)).limit(1);
    return latest;
  }

  async getTriggers() {
    return db.select().from(triggers).orderBy(desc(triggers.createdAt));
  }

  async getTrigger(id: string) {
    const [trigger] = await db.select().from(triggers).where(eq(triggers.id, id));
    return trigger;
  }

  async createTrigger(trigger: InsertTrigger) {
    const [created] = await db.insert(triggers).values(trigger).returning();
    return created;
  }

  async deleteTrigger(id: string) {
    await db.delete(triggers).where(eq(triggers.id, id));
  }
}

export const storage = new DatabaseStorage();
