import type { AgentProvider, AgentRequest, AgentResponse } from "./types";
import type { AgentId } from "@shared/schema";

const agentRoles: Record<AgentId, string> = {
  coordinator: "Coordinator: You organize the team's approach and assign focus areas.",
  researcher: "Researcher: You gather facts, evidence, and data from reliable sources.",
  skeptic: "Skeptic: You challenge assumptions and identify weaknesses in reasoning.",
  coder: "Coder: You provide technical analysis, code examples, and implementation details.",
  writer: "Writer: You craft clear, well-structured prose from the findings.",
  summarizer: "Summarizer: You synthesize all contributions into a final best answer.",
};

export class N8nProvider implements AgentProvider {
  private webhookUrl: string;

  constructor(webhookUrl: string) {
    this.webhookUrl = webhookUrl;
  }

  async generateResponse(
    request: AgentRequest,
    onChunk?: (chunk: string) => void
  ): Promise<AgentResponse> {
    const role = agentRoles[request.agentId];

    let prompt = `You are the ${request.agentId} agent in a multi-agent discussion.\n${role}\n\n`;

    if (request.priorRoundSummaries.length > 0) {
      prompt += `Previous summaries:\n${request.priorRoundSummaries.slice(-2).join("\n---\n")}\n\n`;
    }

    if (request.roomHistory.length > 0) {
      prompt += `Recent discussion:\n${request.roomHistory.slice(-8).join("\n")}\n\n`;
    }

    prompt += `User Question: ${request.userMessage}\n\nRespond in your role as ${request.agentId}. Be specific and helpful.`;

    try {
      const sessionId = `${request.runId}-${request.agentId}-r${request.round}`;

      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 60000);

      const response = await fetch(this.webhookUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ chatInput: prompt, sessionId }),
        signal: controller.signal,
      });

      clearTimeout(timeout);

      if (!response.ok) {
        const errorText = await response.text();
        let errorMsg = `Service returned status ${response.status}`;
        try {
          const parsed = JSON.parse(errorText);
          if (parsed.content) errorMsg = parsed.content;
          else if (parsed.message) errorMsg = parsed.message;
        } catch {}
        throw new Error(errorMsg);
      }

      const responseText = await response.text();
      let content = this.extractContent(responseText);

      if (!content) {
        content = "";
      }

      if (content && onChunk) {
        const words = content.split(" ");
        for (let i = 0; i < words.length; i++) {
          const chunk = (i === 0 ? "" : " ") + words[i];
          onChunk(chunk);
          await new Promise((r) => setTimeout(r, 8));
        }
      }

      return { agentId: request.agentId, content };
    } catch (err: any) {
      const isTimeout = err.name === "AbortError";
      const errorContent = isTimeout
        ? `Request timed out after 60 seconds.`
        : `Error: ${err.message}`;

      console.error(`N8n error [${request.agentId}]:`, err.message);

      if (onChunk) onChunk(errorContent);

      return { agentId: request.agentId, content: errorContent };
    }
  }

  private extractContent(text: string): string {
    if (!text || text.trim().length === 0) return "";

    try {
      const parsed = JSON.parse(text);
      if (typeof parsed === "string") return parsed;
      if (parsed.output) return String(parsed.output);
      if (parsed.text) return String(parsed.text);
      if (parsed.response) return String(parsed.response);
      if (parsed.message) return String(parsed.message);
      if (parsed.content) return String(parsed.content);
      if (parsed.result) return String(parsed.result);
      if (parsed.answer) return String(parsed.answer);
      if (Array.isArray(parsed) && parsed.length > 0) {
        const first = parsed[0];
        return first.output || first.text || first.response || first.message || first.content || JSON.stringify(first);
      }
      return JSON.stringify(parsed);
    } catch {
      return text.trim();
    }
  }
}
