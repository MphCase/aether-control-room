import type { AgentId, RunConfig } from "@shared/schema";

export const AGENT_INFO: Record<AgentId, { label: string; color: string; description: string }> = {
  coordinator: {
    label: "Coordinator",
    color: "#0070F3",
    description: "Plans tasks and assigns work to other agents",
  },
  researcher: {
    label: "Researcher",
    color: "#00C853",
    description: "Gathers information and finds evidence",
  },
  skeptic: {
    label: "Skeptic",
    color: "#FF6B00",
    description: "Challenges claims and identifies weaknesses",
  },
  coder: {
    label: "Coder",
    color: "#7928CA",
    description: "Writes and reviews code solutions",
  },
  writer: {
    label: "Writer",
    color: "#E91E90",
    description: "Crafts clear, polished written output",
  },
  summarizer: {
    label: "Summarizer",
    color: "#00B8D9",
    description: "Distills key findings into a best answer",
  },
};

export const DEFAULT_RUN_CONFIG: RunConfig = {
  rounds: 3,
  alwaysLatest: true,
  citationsRequired: false,
  enabledAgents: ["coordinator", "researcher", "skeptic", "coder", "writer", "summarizer"],
};

export const STATUS_COLORS: Record<string, string> = {
  idle: "hsl(var(--muted-foreground))",
  running: "#0070F3",
  paused: "#FF6B00",
  done: "#00C853",
  error: "hsl(var(--destructive))",
};
