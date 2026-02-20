import { storage } from "./storage";
import { OllamaProvider } from "./providers/ollamaProvider";
import type { AgentProvider, AgentRequest } from "./providers/types";
import type { AgentId, RunConfig } from "@shared/schema";
import { EventEmitter } from "events";

const ollamaUrl = process.env.OLLAMA_BASE_URL || "http://localhost:11434";
const ollamaModel = process.env.OLLAMA_MODEL || "llama3.2";
console.log(`Using Ollama at ${ollamaUrl} with model ${ollamaModel}`);
const provider: AgentProvider = new OllamaProvider(ollamaUrl, ollamaModel);

const runEmitters = new Map<string, EventEmitter>();
const runStopFlags = new Map<string, boolean>();

export function getRunEmitter(runId: string): EventEmitter {
  if (!runEmitters.has(runId)) {
    runEmitters.set(runId, new EventEmitter());
  }
  return runEmitters.get(runId)!;
}

function emit(runId: string, event: string, data: Record<string, unknown> = {}) {
  const emitter = getRunEmitter(runId);
  emitter.emit("sse", { type: event, data });
}

export async function startRun(
  roomId: string,
  userId: string,
  message: string,
  config: RunConfig,
): Promise<string> {
  const run = await storage.createRun({
    roomId,
    userId,
    status: "running",
    configJson: config,
    currentRound: 0,
    maxRounds: config.rounds,
  });

  await storage.createMessage({
    roomId,
    runId: run.id,
    round: 0,
    agentId: null,
    role: "user",
    content: message,
  });

  runStopFlags.set(run.id, false);

  runLoop(run.id, roomId, userId, message, config).catch((err) => {
    console.error("Run loop error:", err);
    emit(run.id, "run_error", { error: String(err) });
    storage.updateRun(run.id, { status: "error" });
  });

  return run.id;
}

export async function stopRun(runId: string) {
  runStopFlags.set(runId, true);
  await storage.updateRun(runId, { status: "done" });
}

export async function continueRun(runId: string): Promise<string> {
  const run = await storage.getRun(runId);
  if (!run) throw new Error("Run not found");

  const config = run.configJson as RunConfig;
  const msgs = await storage.getMessagesByRun(runId);
  const userMsg = msgs.find((m) => m.role === "user")?.content || "";

  const priorSummaries = msgs
    .filter((m) => m.agentId === "summarizer")
    .map((m) => m.content);

  const newRun = await storage.createRun({
    roomId: run.roomId,
    userId: run.userId,
    status: "running",
    configJson: { ...config, rounds: 1 },
    currentRound: run.currentRound,
    maxRounds: run.currentRound + 1,
    bestAnswer: run.bestAnswer,
  });

  runStopFlags.set(newRun.id, false);

  runLoop(
    newRun.id, run.roomId, run.userId, userMsg,
    { ...config, rounds: 1 },
    run.currentRound,
    priorSummaries
  ).catch((err) => {
    console.error("Continue run error:", err);
    emit(newRun.id, "run_error", { error: String(err) });
  });

  return newRun.id;
}

async function runLoop(
  runId: string,
  roomId: string,
  userId: string,
  userMessage: string,
  config: RunConfig,
  startRound: number = 0,
  existingSummaries: string[] = [],
) {
  emit(runId, "run_started");

  const enabledAgents = config.enabledAgents.filter((a) => a !== "coordinator");
  const summaries = [...existingSummaries];

  const roomMessages = await storage.getMessagesByRoom(roomId);
  const roomHistory = roomMessages.slice(-20).map((m) =>
    `[${m.agentId || "user"}]: ${m.content.slice(0, 200)}`
  );

  for (let round = startRound + 1; round <= startRound + config.rounds; round++) {
    if (runStopFlags.get(runId)) break;

    await storage.updateRun(runId, { currentRound: round, status: "running" });

    const roundResponses: string[] = [];

    const baseRequest: Omit<AgentRequest, "agentId"> = {
      roomId, userId, runId, round, userMessage,
      roomHistory,
      priorRoundSummaries: summaries,
      config,
    };

    emit(runId, "agent_started", { agentId: "coordinator", round });
    const coordResponse = await provider.generateResponse(
      { ...baseRequest, agentId: "coordinator" },
      (chunk) => emit(runId, "agent_output_chunk", { agentId: "coordinator", round, textChunk: chunk })
    );
    emit(runId, "agent_done", { agentId: "coordinator", round, content: coordResponse.content });

    if (coordResponse.content) {
      await storage.createMessage({
        roomId, runId, round,
        agentId: "coordinator",
        role: "agent",
        content: coordResponse.content,
      });
      roundResponses.push(`[Coordinator]: ${coordResponse.content}`);
      roomHistory.push(`[coordinator]: ${coordResponse.content.slice(0, 200)}`);
    }

    if (runStopFlags.get(runId)) break;

    const parallelAgents = enabledAgents.filter((a) => a !== "summarizer");

    for (const agentId of parallelAgents) {
      if (runStopFlags.get(runId)) break;

      const agentRequest: AgentRequest = {
        ...baseRequest,
        agentId,
        roomHistory: [...roomHistory, ...roundResponses],
        priorRoundSummaries: summaries,
      };

      emit(runId, "agent_started", { agentId, round });
      const response = await provider.generateResponse(
        agentRequest,
        (chunk) => emit(runId, "agent_output_chunk", { agentId, round, textChunk: chunk })
      );
      emit(runId, "agent_done", { agentId, round, content: response.content });

      if (response.content) {
        await storage.createMessage({
          roomId, runId, round,
          agentId,
          role: "agent",
          content: response.content,
          sourcesJson: response.sources,
        });
        roundResponses.push(`[${agentId}]: ${response.content}`);
        roomHistory.push(`[${agentId}]: ${response.content.slice(0, 200)}`);
      }
    }

    if (runStopFlags.get(runId)) break;

    if (enabledAgents.includes("summarizer")) {
      const summarizerRequest: AgentRequest = {
        ...baseRequest,
        agentId: "summarizer",
        roomHistory: [...roomHistory, ...roundResponses],
        priorRoundSummaries: summaries,
      };

      emit(runId, "agent_started", { agentId: "summarizer", round });
      const summaryResponse = await provider.generateResponse(
        summarizerRequest,
        (chunk) => emit(runId, "agent_output_chunk", { agentId: "summarizer", round, textChunk: chunk })
      );
      emit(runId, "agent_done", { agentId: "summarizer", round, content: summaryResponse.content });

      if (summaryResponse.content) {
        await storage.createMessage({
          roomId, runId, round,
          agentId: "summarizer",
          role: "agent",
          content: summaryResponse.content,
        });

        const bestAnswer = summaryResponse.content;
        const whatChanged = `Round ${round} complete with input from ${roundResponses.length + 1} agents.`;

        summaries.push(bestAnswer);
        await storage.updateRun(runId, { bestAnswer });

        emit(runId, "round_summary", { round, bestAnswer, whatChanged });
        emit(runId, "best_answer_updated", { bestAnswer });
      }
    }
  }

  await storage.updateRun(runId, { status: "done" });
  emit(runId, "run_done");

  setTimeout(() => {
    runEmitters.delete(runId);
    runStopFlags.delete(runId);
  }, 30000);
}
