import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { startRun, stopRun, continueRun, getRunEmitter } from "./orchestrator";
import { seedDatabase } from "./seed";
import type { RunConfig } from "@shared/schema";

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {

  await seedDatabase();

  app.get("/api/users", async (_req, res) => {
    const users = await storage.getUsers();
    res.json(users);
  });

  app.post("/api/users", async (req, res) => {
    const { name, role } = req.body;
    if (!name) return res.status(400).json({ message: "Name is required" });
    const user = await storage.createUser({ name, role: role || "user", disabled: false });
    res.json(user);
  });

  app.patch("/api/users/:id", async (req, res) => {
    const user = await storage.updateUser(req.params.id, req.body);
    if (!user) return res.status(404).json({ message: "User not found" });
    res.json(user);
  });

  app.get("/api/rooms", async (_req, res) => {
    const rooms = await storage.getRooms();
    res.json(rooms);
  });

  app.post("/api/rooms", async (req, res) => {
    const { name } = req.body;
    if (!name) return res.status(400).json({ message: "Name is required" });
    const room = await storage.createRoom({ name, archived: false });
    res.json(room);
  });

  app.patch("/api/rooms/:id", async (req, res) => {
    const room = await storage.updateRoom(req.params.id, req.body);
    if (!room) return res.status(404).json({ message: "Room not found" });
    res.json(room);
  });

  app.get("/api/rooms/:id/messages", async (req, res) => {
    const messages = await storage.getMessagesByRoom(req.params.id);
    res.json(messages);
  });

  app.post("/api/run/start", async (req, res) => {
    const { roomId, userId, message, config } = req.body;
    if (!roomId || !userId || !message) {
      return res.status(400).json({ message: "roomId, userId, and message are required" });
    }
    try {
      const runConfig: RunConfig = config || {
        rounds: 3,
        alwaysLatest: true,
        citationsRequired: false,
        enabledAgents: ["coordinator", "researcher", "skeptic", "coder", "writer", "summarizer"],
      };
      const runId = await startRun(roomId, userId, message, runConfig);
      res.json({ runId });
    } catch (err: any) {
      res.status(500).json({ message: err.message });
    }
  });

  app.post("/api/run/stop", async (req, res) => {
    const { runId } = req.body;
    if (!runId) return res.status(400).json({ message: "runId is required" });
    await stopRun(runId);
    res.json({ ok: true });
  });

  app.post("/api/run/continue", async (req, res) => {
    const { runId } = req.body;
    if (!runId) return res.status(400).json({ message: "runId is required" });
    try {
      const newRunId = await continueRun(runId);
      res.json({ runId: newRunId });
    } catch (err: any) {
      res.status(500).json({ message: err.message });
    }
  });

  app.get("/api/run/stream", (req, res) => {
    const runId = req.query.runId as string;
    if (!runId) {
      res.status(400).json({ message: "runId query param required" });
      return;
    }

    res.writeHead(200, {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      "Connection": "keep-alive",
      "X-Accel-Buffering": "no",
    });

    res.write(":\n\n");

    const emitter = getRunEmitter(runId);
    const handler = (evt: { type: string; data: Record<string, unknown> }) => {
      res.write(`event: ${evt.type}\ndata: ${JSON.stringify(evt.data)}\n\n`);
    };

    emitter.on("sse", handler);

    req.on("close", () => {
      emitter.removeListener("sse", handler);
    });
  });

  app.get("/api/runs/:roomId/latest", async (req, res) => {
    const runs = await storage.getRunsByRoom(req.params.roomId);
    if (runs.length === 0) return res.json(null);
    const latest = runs[0];
    res.json(latest);
  });

  app.get("/api/prompts", async (_req, res) => {
    const prompts = await storage.getPrompts();
    res.json(prompts);
  });

  app.post("/api/prompts", async (req, res) => {
    const { scope, agentId, content, label } = req.body;
    if (!content) return res.status(400).json({ message: "Content is required" });
    const prompt = await storage.createPrompt({
      scope: scope || "global",
      agentId: agentId || null,
      content,
      label: label || "",
      version: 1,
    });
    res.json(prompt);
  });

  app.get("/api/triggers", async (_req, res) => {
    const triggers = await storage.getTriggers();
    res.json(triggers);
  });

  app.post("/api/triggers", async (req, res) => {
    const { name, configJson, promptOverridesJson } = req.body;
    if (!name) return res.status(400).json({ message: "Name is required" });
    const trigger = await storage.createTrigger({
      name,
      configJson: configJson || null,
      promptOverridesJson: promptOverridesJson || null,
    });
    res.json(trigger);
  });

  app.delete("/api/triggers/:id", async (req, res) => {
    await storage.deleteTrigger(req.params.id);
    res.json({ ok: true });
  });

  return httpServer;
}
