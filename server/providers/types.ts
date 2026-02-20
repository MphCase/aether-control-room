import type { AgentId, RunConfig } from "@shared/schema";

export interface AgentRequest {
  roomId: string;
  userId: string;
  runId: string;
  round: number;
  agentId: AgentId;
  userMessage: string;
  roomHistory: string[];
  priorRoundSummaries: string[];
  config: RunConfig;
}

export interface AgentResponse {
  agentId: AgentId;
  content: string;
  sources?: string[];
}

export interface AgentProvider {
  generateResponse(
    request: AgentRequest,
    onChunk?: (chunk: string) => void
  ): Promise<AgentResponse>;
}
