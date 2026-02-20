import type { AgentId } from "@shared/schema";

export interface SSECallbacks {
  onRunStarted?: () => void;
  onAgentStarted?: (agentId: AgentId, round: number) => void;
  onAgentChunk?: (agentId: AgentId, round: number, chunk: string) => void;
  onAgentDone?: (agentId: AgentId, round: number, content: string) => void;
  onRoundSummary?: (round: number, bestAnswer: string, whatChanged: string) => void;
  onBestAnswerUpdated?: (bestAnswer: string) => void;
  onRunDone?: () => void;
  onRunError?: (error: string) => void;
}

export function connectSSE(runId: string, callbacks: SSECallbacks): () => void {
  const es = new EventSource(`/api/run/stream?runId=${runId}`);

  es.addEventListener("run_started", () => callbacks.onRunStarted?.());

  es.addEventListener("agent_started", (e) => {
    const d = JSON.parse(e.data);
    callbacks.onAgentStarted?.(d.agentId, d.round);
  });

  es.addEventListener("agent_output_chunk", (e) => {
    const d = JSON.parse(e.data);
    callbacks.onAgentChunk?.(d.agentId, d.round, d.textChunk);
  });

  es.addEventListener("agent_done", (e) => {
    const d = JSON.parse(e.data);
    callbacks.onAgentDone?.(d.agentId, d.round, d.content);
  });

  es.addEventListener("round_summary", (e) => {
    const d = JSON.parse(e.data);
    callbacks.onRoundSummary?.(d.round, d.bestAnswer, d.whatChanged);
  });

  es.addEventListener("best_answer_updated", (e) => {
    const d = JSON.parse(e.data);
    callbacks.onBestAnswerUpdated?.(d.bestAnswer);
  });

  es.addEventListener("run_done", () => {
    callbacks.onRunDone?.();
    es.close();
  });

  es.addEventListener("run_error", (e) => {
    const d = JSON.parse(e.data);
    callbacks.onRunError?.(d.error);
    es.close();
  });

  es.onerror = () => {
    callbacks.onRunError?.("Connection lost");
    es.close();
  };

  return () => es.close();
}
