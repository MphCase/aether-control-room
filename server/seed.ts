import { storage } from "./storage";
import { db } from "./db";
import { users, rooms, prompts, triggers } from "@shared/schema";

export async function seedDatabase() {
  const existingUsers = await storage.getUsers();
  if (existingUsers.length > 0) return;

  console.log("Seeding database...");

  await storage.createUser({ name: "Admin", role: "admin", disabled: false });
  await storage.createUser({ name: "Alice Chen", role: "user", disabled: false });
  await storage.createUser({ name: "Bob Martinez", role: "user", disabled: false });
  await storage.createUser({ name: "Observer", role: "viewer", disabled: false });

  await storage.createRoom({ name: "General Research", archived: false });
  await storage.createRoom({ name: "Code Review", archived: false });
  await storage.createRoom({ name: "Strategy Planning", archived: false });

  await storage.createPrompt({
    scope: "global",
    agentId: null,
    content: "You are part of a multi-agent system called Aether Control Room. Work collaboratively with other agents to provide the most accurate, thorough, and well-reasoned answer possible. Be concise but comprehensive. Always cite your reasoning.",
    label: "v1-default",
    version: 1,
  });

  await storage.createPrompt({
    scope: "agent",
    agentId: "researcher",
    content: "You are the Researcher agent. Your role is to gather evidence, find relevant information, and provide well-sourced data to support the team's analysis. Focus on accuracy and credibility.",
    label: "v1-default",
    version: 1,
  });

  await storage.createPrompt({
    scope: "agent",
    agentId: "skeptic",
    content: "You are the Skeptic agent. Your role is to critically evaluate claims, identify logical fallacies, challenge assumptions, and ensure intellectual rigor. Be constructively critical.",
    label: "v1-default",
    version: 1,
  });

  await storage.createTrigger({
    name: "Quick Analysis",
    configJson: {
      rounds: 1,
      alwaysLatest: true,
      citationsRequired: false,
      enabledAgents: ["coordinator", "researcher", "writer", "summarizer"],
    },
  });

  await storage.createTrigger({
    name: "Deep Research",
    configJson: {
      rounds: 5,
      alwaysLatest: true,
      citationsRequired: true,
      enabledAgents: ["coordinator", "researcher", "skeptic", "coder", "writer", "summarizer"],
    },
  });

  await storage.createTrigger({
    name: "Code Focus",
    configJson: {
      rounds: 3,
      alwaysLatest: true,
      citationsRequired: false,
      enabledAgents: ["coordinator", "coder", "skeptic", "summarizer"],
    },
  });

  console.log("Seeding complete.");
}
