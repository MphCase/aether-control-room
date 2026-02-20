import type { AgentProvider, AgentRequest, AgentResponse } from "./types";
import type { AgentId } from "@shared/schema";

const agentSystemPrompts: Record<AgentId, string> = {
  coordinator: "You are the Coordinator agent. Your role is to organize the team's approach, assign focus areas to other agents, and set the direction for the discussion. Be concise and directive. Structure your response as a brief plan of attack.",
  researcher: "You are the Researcher agent. Your role is to gather facts, evidence, and data. Provide specific information, statistics, and references relevant to the question. Be thorough but focused.",
  skeptic: "You are the Skeptic agent. Your role is to challenge assumptions, identify weaknesses in reasoning, and point out potential issues or counterarguments. Be constructive but critical.",
  coder: "You are the Coder agent. Your role is to provide technical analysis, code examples, implementation details, and architectural considerations. Use code blocks when showing examples.",
  writer: "You are the Writer agent. Your role is to craft clear, well-structured prose from the discussion findings. Focus on readability and organization.",
  summarizer: "You are the Summarizer agent. Your role is to synthesize all contributions from other agents into a single, comprehensive best answer. Combine the key insights from each agent into a cohesive response.",
};

export class OllamaProvider implements AgentProvider {
  private baseUrl: string;
  private model: string;

  constructor(baseUrl: string, model: string = "llama3.2") {
    this.baseUrl = baseUrl.replace(/\/+$/, "");
    this.model = model;
  }

  async generateResponse(
    request: AgentRequest,
    onChunk?: (chunk: string) => void
  ): Promise<AgentResponse> {
    const systemPrompt = agentSystemPrompts[request.agentId];

    let userContent = "";

    if (request.priorRoundSummaries.length > 0) {
      userContent += `Previous round summaries:\n${request.priorRoundSummaries.slice(-2).join("\n---\n")}\n\n`;
    }

    if (request.roomHistory.length > 0) {
      userContent += `Discussion so far:\n${request.roomHistory.slice(-8).join("\n")}\n\n`;
    }

    userContent += `User Question: ${request.userMessage}\n\nRespond in your role. Be specific, helpful, and concise.`;

    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 120000);

      const response = await fetch(`${this.baseUrl}/api/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model: this.model,
          messages: [
            { role: "system", content: systemPrompt },
            { role: "user", content: userContent },
          ],
          stream: true,
        }),
        signal: controller.signal,
      });

      clearTimeout(timeout);

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Ollama returned ${response.status}: ${errorText}`);
      }

      let fullContent = "";
      const reader = response.body?.getReader();
      const decoder = new TextDecoder();

      if (reader) {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          const chunk = decoder.decode(value, { stream: true });
          const lines = chunk.split("\n").filter((l) => l.trim());

          for (const line of lines) {
            try {
              const parsed = JSON.parse(line);
              if (parsed.message?.content) {
                const text = parsed.message.content;
                fullContent += text;
                if (onChunk) onChunk(text);
              }
            } catch {}
          }
        }
      }

      return { agentId: request.agentId, content: fullContent };
    } catch (err: any) {
      const isTimeout = err.name === "AbortError";
      const errorContent = isTimeout
        ? "Request timed out after 120 seconds."
        : `Error connecting to Ollama: ${err.message}`;

      console.error(`Ollama error [${request.agentId}]:`, err.message);

      if (onChunk) onChunk(errorContent);

      return { agentId: request.agentId, content: errorContent };
    }
  }
}
