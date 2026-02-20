import type { AgentProvider, AgentRequest, AgentResponse } from "./types";
import type { AgentId } from "@shared/schema";

const agentPersonalities: Record<AgentId, { style: string; templates: string[] }> = {
  coordinator: {
    style: "systematic and organized",
    templates: [
      "I'll coordinate our approach to this question. Here's the plan:\n\n1. Researcher will gather relevant information and evidence\n2. Skeptic will evaluate claims and identify potential issues\n3. Coder will provide technical implementation if needed\n4. Writer will craft a clear, well-structured response\n5. Summarizer will distill our findings into a best answer\n\nLet's work through this methodically.",
      "Breaking down the task for our team:\n\nPrimary objective: Address the user's question comprehensively\nResearch focus: Find authoritative sources and data\nCritical review: Identify assumptions and gaps\nOutput goal: Clear, actionable answer\n\nTeam, let's begin our analysis.",
    ],
  },
  researcher: {
    style: "thorough and evidence-based",
    templates: [
      "Based on my research, here are the key findings:\n\n**Key Evidence:**\n- Multiple authoritative sources confirm the core premise\n- Recent studies show significant developments in this area\n- There are several important nuances to consider\n\n**Supporting Data:**\n- Industry benchmarks suggest a strong trend in this direction\n- Expert consensus aligns with the initial hypothesis\n- Historical patterns provide additional context\n\nI recommend we consider these factors in our final answer.",
      "My investigation reveals several important insights:\n\n1. **Primary Finding:** The evidence strongly supports a comprehensive approach\n2. **Secondary Insight:** There are established best practices we should reference\n3. **Context:** The landscape has evolved significantly in recent years\n\n**Sources consulted:** Academic papers, industry reports, expert analyses\n\nThis forms a solid foundation for our response.",
    ],
  },
  skeptic: {
    style: "critical and questioning",
    templates: [
      "I want to challenge a few assumptions here:\n\n**Potential Issues:**\n- Are we making unverified claims? Some of these need more evidence\n- The scope might be too narrow - there are edge cases to consider\n- Counter-arguments exist that we should acknowledge\n\n**Weaknesses Identified:**\n- The reasoning could be stronger with more concrete examples\n- We should consider alternative perspectives\n- Some conclusions may be premature without more data\n\nLet's strengthen the answer by addressing these points.",
      "Hold on - let me play devil's advocate:\n\n1. **Assumption check:** Not all premises are equally supported\n2. **Bias risk:** We may be favoring one interpretation over valid alternatives\n3. **Completeness:** Several important considerations are being overlooked\n\n**My recommendation:** Acknowledge limitations and present a more balanced view. The strongest answers address counterarguments head-on.",
    ],
  },
  coder: {
    style: "technical and precise",
    templates: [
      "From a technical perspective, here's what I'd suggest:\n\n```\n// Example implementation approach\nfunction processQuery(input) {\n  // Validate input parameters\n  const validated = validate(input);\n  \n  // Apply core logic\n  const result = analyze(validated);\n  \n  // Return structured output\n  return format(result);\n}\n```\n\n**Technical Notes:**\n- Consider edge cases in implementation\n- Performance should be acceptable for typical use cases\n- The architecture supports future extensibility",
      "Here's the technical breakdown:\n\n**Architecture:**\n- Input processing and validation layer\n- Core business logic implementation\n- Output formatting and delivery\n\n**Implementation considerations:**\n- Error handling should cover common failure modes\n- The solution should be modular and testable\n- Documentation is important for maintainability\n\nThis approach provides a solid technical foundation.",
    ],
  },
  writer: {
    style: "clear and eloquent",
    templates: [
      "Let me craft this into a polished response:\n\nThe question at hand deserves a thoughtful, comprehensive answer. Drawing from our team's analysis, several key themes emerge that help illuminate the path forward.\n\nFirst, the evidence supports a nuanced understanding rather than a simple yes-or-no answer. The reality is more layered, requiring us to consider multiple perspectives and their implications.\n\nSecond, practical applications matter. Theory without practice leaves us incomplete, so we should ground our answer in real-world applicability.\n\nFinally, acknowledging what we don't know strengthens, rather than weakens, our credibility.",
      "Here's the refined version of our collective insights:\n\nAt its core, this question touches on fundamental principles that are worth examining carefully. Our analysis reveals both expected patterns and surprising nuances.\n\nThe strength of our answer lies in its balance: we've gathered evidence, challenged assumptions, and synthesized findings into actionable guidance. This isn't just theory - it's grounded in practical reality.\n\nThe key takeaway is that thoughtful analysis, combined with healthy skepticism, produces the most reliable conclusions.",
    ],
  },
  summarizer: {
    style: "concise and synthetic",
    templates: [
      "**Best Answer:**\n\nAfter synthesizing input from all agents, here is the refined answer:\n\nThe question has been analyzed from multiple angles - research evidence, critical review, technical feasibility, and clear communication. The consensus points to a comprehensive understanding that balances depth with clarity.\n\n**Key Points:**\n1. The evidence supports a well-reasoned approach\n2. Important caveats and limitations have been identified\n3. Practical implications have been considered\n4. The answer is grounded in verifiable information\n\n**What Changed This Round:**\nThe team refined the initial response by incorporating critical feedback and additional evidence, resulting in a more balanced and thorough answer.",
      "**Summary of Findings:**\n\nOur multi-agent analysis has produced a well-rounded answer that considers:\n\n- **Evidence base:** Strong supporting research and data\n- **Critical review:** Assumptions tested, weaknesses addressed\n- **Technical feasibility:** Practical implementation verified\n- **Communication:** Clear, accessible presentation\n\n**Best Answer:** The combined insights from our team provide a reliable, nuanced response that addresses the question comprehensively while acknowledging appropriate limitations.\n\n**What Changed This Round:**\nIncorporated skeptic feedback to strengthen claims and added technical validation from the coder's analysis.",
    ],
  },
};

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export class MockProvider implements AgentProvider {
  async generateResponse(
    request: AgentRequest,
    onChunk?: (chunk: string) => void
  ): Promise<AgentResponse> {
    const personality = agentPersonalities[request.agentId];
    const templateIndex = (request.round - 1) % personality.templates.length;
    let content = personality.templates[templateIndex];

    content = content.replace(
      "this question",
      `"${request.userMessage.slice(0, 50)}${request.userMessage.length > 50 ? "..." : ""}"`
    );

    if (request.round > 1) {
      content += `\n\n[Round ${request.round} refinement: Building on previous round's insights to strengthen this response.]`;
    }

    const words = content.split(" ");
    let accumulated = "";

    for (let i = 0; i < words.length; i++) {
      const chunk = (i === 0 ? "" : " ") + words[i];
      accumulated += chunk;
      onChunk?.(chunk);
      await sleep(15 + Math.random() * 25);
    }

    const sources = request.agentId === "researcher"
      ? ["research-paper-2024.pdf", "industry-report.org", "expert-analysis.com"]
      : undefined;

    return {
      agentId: request.agentId,
      content: accumulated,
      sources,
    };
  }
}
