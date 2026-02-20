import { useState, useCallback } from "react";
import type { AgentId, RunStatus, RunConfig, Room, User, Run, Message, Trigger } from "@shared/schema";
import { DEFAULT_RUN_CONFIG } from "@/lib/constants";

export interface AgentLiveState {
  agentId: AgentId;
  status: RunStatus;
  streamContent: string;
  fullContent: string;
}

const defaultAgentStates: Record<AgentId, AgentLiveState> = {
  coordinator: { agentId: "coordinator", status: "idle", streamContent: "", fullContent: "" },
  researcher: { agentId: "researcher", status: "idle", streamContent: "", fullContent: "" },
  skeptic: { agentId: "skeptic", status: "idle", streamContent: "", fullContent: "" },
  coder: { agentId: "coder", status: "idle", streamContent: "", fullContent: "" },
  writer: { agentId: "writer", status: "idle", streamContent: "", fullContent: "" },
  summarizer: { agentId: "summarizer", status: "idle", streamContent: "", fullContent: "" },
};

export function useAetherStore() {
  const [activeRoomId, setActiveRoomId] = useState<string | null>(null);
  const [activeUserId, setActiveUserId] = useState<string | null>(null);
  const [activeRunId, setActiveRunId] = useState<string | null>(null);
  const [runStatus, setRunStatus] = useState<RunStatus>("idle");
  const [currentRound, setCurrentRound] = useState(0);
  const [maxRounds, setMaxRounds] = useState(3);
  const [bestAnswer, setBestAnswer] = useState("");
  const [whatChanged, setWhatChanged] = useState("");
  const [runConfig, setRunConfig] = useState<RunConfig>(DEFAULT_RUN_CONFIG);
  const [agentStates, setAgentStates] = useState<Record<AgentId, AgentLiveState>>({ ...defaultAgentStates });
  const [promptDrawerOpen, setPromptDrawerOpen] = useState(false);
  const [threadDrawerAgent, setThreadDrawerAgent] = useState<AgentId | null>(null);

  const resetAgentStates = useCallback(() => {
    setAgentStates({ ...defaultAgentStates });
  }, []);

  const updateAgentStatus = useCallback((agentId: AgentId, status: RunStatus) => {
    setAgentStates((prev) => ({
      ...prev,
      [agentId]: { ...prev[agentId], status },
    }));
  }, []);

  const appendAgentChunk = useCallback((agentId: AgentId, chunk: string) => {
    setAgentStates((prev) => ({
      ...prev,
      [agentId]: {
        ...prev[agentId],
        streamContent: prev[agentId].streamContent + chunk,
      },
    }));
  }, []);

  const finalizeAgent = useCallback((agentId: AgentId, content: string) => {
    setAgentStates((prev) => ({
      ...prev,
      [agentId]: {
        ...prev[agentId],
        status: "done",
        fullContent: content,
        streamContent: content,
      },
    }));
  }, []);

  const clearAgentStreams = useCallback(() => {
    setAgentStates((prev) => {
      const next = { ...prev };
      for (const key of Object.keys(next) as AgentId[]) {
        next[key] = { ...next[key], streamContent: "", status: "idle" };
      }
      return next;
    });
  }, []);

  return {
    activeRoomId, setActiveRoomId,
    activeUserId, setActiveUserId,
    activeRunId, setActiveRunId,
    runStatus, setRunStatus,
    currentRound, setCurrentRound,
    maxRounds, setMaxRounds,
    bestAnswer, setBestAnswer,
    whatChanged, setWhatChanged,
    runConfig, setRunConfig,
    agentStates,
    promptDrawerOpen, setPromptDrawerOpen,
    threadDrawerAgent, setThreadDrawerAgent,
    resetAgentStates,
    updateAgentStatus,
    appendAgentChunk,
    finalizeAgent,
    clearAgentStreams,
  };
}
