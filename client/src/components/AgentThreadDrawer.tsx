import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { StatusBadge } from "@/components/StatusBadge";
import { AGENT_INFO } from "@/lib/constants";
import type { AgentId, Message } from "@shared/schema";
import type { AgentLiveState } from "@/hooks/use-aether-store";

interface AgentThreadDrawerProps {
  agentId: AgentId | null;
  agentState: AgentLiveState | null;
  messages: Message[];
  open: boolean;
  onClose: () => void;
}

export function AgentThreadDrawer({ agentId, agentState, messages, open, onClose }: AgentThreadDrawerProps) {
  if (!agentId || !agentState) return null;

  const info = AGENT_INFO[agentId];
  const agentMessages = messages.filter((m) => m.agentId === agentId);

  return (
    <Sheet open={open} onOpenChange={(v) => !v && onClose()}>
      <SheetContent className="w-full sm:max-w-lg" data-testid={`drawer-agent-${agentId}`}>
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-full" style={{ backgroundColor: info.color }} />
            {info.label} Thread
            <StatusBadge status={agentState.status} size="sm" />
          </SheetTitle>
        </SheetHeader>

        <ScrollArea className="h-[calc(100vh-120px)] mt-4">
          <div className="space-y-3 pr-2">
            {agentState.streamContent && (
              <div className="bg-muted/50 rounded-md p-3">
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-xs font-semibold">Live Output</span>
                  {agentState.status === "running" && (
                    <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
                  )}
                </div>
                <pre className="text-xs font-mono whitespace-pre-wrap break-words leading-relaxed text-foreground/80">
                  {agentState.streamContent}
                  {agentState.status === "running" && <span className="animate-pulse">|</span>}
                </pre>
              </div>
            )}

            {agentMessages.length > 0 && (
              <div>
                <span className="text-xs font-semibold text-muted-foreground mb-2 block">History</span>
                <div className="space-y-2">
                  {agentMessages.map((msg) => (
                    <div key={msg.id} className="bg-card border rounded-md p-3">
                      <div className="flex items-center gap-2 mb-1">
                        <Badge variant="secondary" className="text-[10px]">
                          R{msg.round}
                        </Badge>
                        <span className="text-[10px] text-muted-foreground">
                          {new Date(msg.createdAt).toLocaleTimeString()}
                        </span>
                      </div>
                      <p className="text-xs leading-relaxed whitespace-pre-wrap">{msg.content}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {!agentState.streamContent && agentMessages.length === 0 && (
              <div className="text-center py-8 text-muted-foreground">
                <p className="text-sm">No output from {info.label} yet</p>
              </div>
            )}
          </div>
        </ScrollArea>
      </SheetContent>
    </Sheet>
  );
}
