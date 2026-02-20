import { useState, useEffect } from "react";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetFooter } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Play, Save } from "lucide-react";
import { AGENT_IDS } from "@shared/schema";
import { AGENT_INFO } from "@/lib/constants";
import type { RunConfig, AgentId } from "@shared/schema";

interface PromptDrawerProps {
  open: boolean;
  onClose: () => void;
  question: string;
  onQuestionChange: (q: string) => void;
  runConfig: RunConfig;
  onRunNow: () => void;
}

export function PromptDrawer({ open, onClose, question, onQuestionChange, runConfig, onRunNow }: PromptDrawerProps) {
  const [overrides, setOverrides] = useState<Record<AgentId, string>>({
    coordinator: "",
    researcher: "",
    skeptic: "",
    coder: "",
    writer: "",
    summarizer: "",
  });

  return (
    <Sheet open={open} onOpenChange={(v) => !v && onClose()}>
      <SheetContent side="left" className="w-full sm:max-w-md" data-testid="drawer-prompt">
        <SheetHeader>
          <SheetTitle>Run Configuration</SheetTitle>
        </SheetHeader>

        <ScrollArea className="h-[calc(100vh-180px)] mt-4">
          <div className="space-y-4 pr-2">
            <div>
              <Label className="text-xs mb-1.5 block">Your Question</Label>
              <Textarea
                value={question}
                onChange={(e) => onQuestionChange(e.target.value)}
                placeholder="Enter your question..."
                className="text-sm min-h-[80px] resize-none"
                data-testid="input-prompt-question"
              />
            </div>

            <Separator />

            <div>
              <Label className="text-xs mb-1.5 block">Run Settings Summary</Label>
              <div className="flex flex-wrap gap-1.5">
                <Badge variant="secondary" className="text-[10px]">{runConfig.rounds} rounds</Badge>
                {runConfig.alwaysLatest && <Badge variant="secondary" className="text-[10px]">Always Latest</Badge>}
                {runConfig.citationsRequired && <Badge variant="secondary" className="text-[10px]">Citations</Badge>}
                {runConfig.enabledAgents.map((a) => (
                  <Badge key={a} variant="outline" className="text-[10px] gap-1">
                    <span className="w-1.5 h-1.5 rounded-full shrink-0" style={{ backgroundColor: AGENT_INFO[a].color }} />
                    {AGENT_INFO[a].label}
                  </Badge>
                ))}
              </div>
            </div>

            <Separator />

            <div>
              <Label className="text-xs mb-1.5 block">Per-Agent Prompt Overrides (optional)</Label>
              <Tabs defaultValue="coordinator">
                <TabsList className="w-full flex-wrap h-auto gap-1 bg-transparent p-0 mb-2">
                  {AGENT_IDS.map((a) => (
                    <TabsTrigger key={a} value={a} className="text-[10px] px-2 py-1 data-[state=active]:bg-muted">
                      <span className="w-1.5 h-1.5 rounded-full mr-1" style={{ backgroundColor: AGENT_INFO[a].color }} />
                      {AGENT_INFO[a].label}
                    </TabsTrigger>
                  ))}
                </TabsList>
                {AGENT_IDS.map((a) => (
                  <TabsContent key={a} value={a}>
                    <Textarea
                      value={overrides[a]}
                      onChange={(e) => setOverrides({ ...overrides, [a]: e.target.value })}
                      placeholder={`Additional instructions for ${AGENT_INFO[a].label}...`}
                      className="text-xs min-h-[80px] resize-none font-mono"
                      data-testid={`input-override-${a}`}
                    />
                  </TabsContent>
                ))}
              </Tabs>
            </div>
          </div>
        </ScrollArea>

        <SheetFooter className="mt-4 gap-2">
          <Button variant="outline" size="sm" data-testid="button-save-preset">
            <Save className="w-3.5 h-3.5 mr-1.5" />
            Save as Preset
          </Button>
          <Button
            size="sm"
            onClick={() => {
              onRunNow();
              onClose();
            }}
            disabled={!question.trim()}
            data-testid="button-run-now"
          >
            <Play className="w-3.5 h-3.5 mr-1.5" />
            Run Now
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}
