import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { StatusBadge } from "@/components/StatusBadge";
import { Maximize2 } from "lucide-react";
import { AGENT_INFO } from "@/lib/constants";
import type { AgentId, RunStatus } from "@shared/schema";

interface AgentCardProps {
  agentId: AgentId;
  status: RunStatus;
  streamContent: string;
  onExpand: () => void;
}

export function AgentCard({ agentId, status, streamContent, onExpand }: AgentCardProps) {
  const info = AGENT_INFO[agentId];
  const previewLines = streamContent
    ? streamContent.split("\n").slice(-6).join("\n")
    : "";

  return (
    <Card className="overflow-visible" data-testid={`card-agent-${agentId}`}>
      <div className="p-3">
        <div className="flex items-center justify-between gap-2 mb-2 flex-wrap">
          <div className="flex items-center gap-2">
            <span
              className="w-2.5 h-2.5 rounded-full shrink-0"
              style={{ backgroundColor: info.color }}
            />
            <span className="text-xs font-semibold">{info.label}</span>
            <StatusBadge status={status} size="sm" />
          </div>
          <Button size="icon" variant="ghost" onClick={onExpand} data-testid={`button-expand-${agentId}`}>
            <Maximize2 className="w-3.5 h-3.5" />
          </Button>
        </div>

        <p className="text-[10px] text-muted-foreground mb-2">{info.description}</p>

        <div className="bg-muted/50 rounded-md p-2 min-h-[48px] max-h-[96px] overflow-hidden">
          {previewLines ? (
            <pre className="text-[11px] font-mono text-foreground/80 whitespace-pre-wrap break-words leading-relaxed">
              {previewLines}
              {status === "running" && <span className="animate-pulse">|</span>}
            </pre>
          ) : (
            <span className="text-[11px] text-muted-foreground italic">
              {status === "idle" ? "Waiting..." : status === "running" ? "Starting..." : "No output"}
            </span>
          )}
        </div>
      </div>
    </Card>
  );
}
