import { ScrollArea } from "@/components/ui/scroll-area";
import { AgentCard } from "@/components/AgentCard";
import { AGENT_IDS } from "@shared/schema";
import type { AgentId } from "@shared/schema";
import type { AgentLiveState } from "@/hooks/use-aether-store";

interface AgentMonitorProps {
  agentStates: Record<AgentId, AgentLiveState>;
  onExpandAgent: (agentId: AgentId) => void;
}

export function AgentMonitor({ agentStates, onExpandAgent }: AgentMonitorProps) {
  return (
    <div className="flex flex-col h-full">
      <div className="p-3 border-b shrink-0">
        <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Agent Monitor</span>
      </div>
      <ScrollArea className="flex-1 min-h-0">
        <div className="p-3 space-y-2">
          {AGENT_IDS.map((agentId) => (
            <AgentCard
              key={agentId}
              agentId={agentId}
              status={agentStates[agentId].status}
              streamContent={agentStates[agentId].streamContent}
              onExpand={() => onExpandAgent(agentId)}
            />
          ))}
        </div>
      </ScrollArea>
    </div>
  );
}
