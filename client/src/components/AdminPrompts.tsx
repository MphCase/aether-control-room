import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Save, Copy, History, Eye } from "lucide-react";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { AGENT_IDS } from "@shared/schema";
import { AGENT_INFO } from "@/lib/constants";
import type { Prompt, AgentId } from "@shared/schema";

export function AdminPrompts() {
  const [activeTab, setActiveTab] = useState<string>("global");
  const [content, setContent] = useState("");
  const [label, setLabel] = useState("");
  const [showPreview, setShowPreview] = useState(false);

  const { data: prompts = [] } = useQuery<Prompt[]>({
    queryKey: ["/api/prompts"],
  });

  const currentPrompts = prompts.filter(
    (p) => activeTab === "global" ? p.scope === "global" : (p.scope === "agent" && p.agentId === activeTab)
  );
  const latestPrompt = currentPrompts.sort((a, b) => b.version - a.version)[0];

  useEffect(() => {
    if (latestPrompt) {
      setContent(latestPrompt.content);
      setLabel(latestPrompt.label);
    } else {
      setContent("");
      setLabel("");
    }
  }, [activeTab, latestPrompt?.id]);

  const saveMutation = useMutation({
    mutationFn: async () => {
      await apiRequest("POST", "/api/prompts", {
        scope: activeTab === "global" ? "global" : "agent",
        agentId: activeTab === "global" ? null : activeTab,
        content,
        label: label || `v${(latestPrompt?.version ?? 0) + 1}`,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/prompts"] });
    },
  });

  const globalPrompt = prompts.filter((p) => p.scope === "global").sort((a, b) => b.version - a.version)[0];

  const compiledPreview = activeTab === "global"
    ? content
    : `${globalPrompt?.content || "[No global prompt]"}\n\n---\n\n${content}`;

  const tabItems = [
    { value: "global", label: "Global" },
    ...AGENT_IDS.map((a) => ({ value: a, label: AGENT_INFO[a].label })),
  ];

  return (
    <div className="space-y-4">
      <Card className="p-4">
        <div className="flex items-center justify-between mb-3 flex-wrap gap-2">
          <h3 className="text-sm font-semibold">Prompt Studio</h3>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowPreview(!showPreview)}
              data-testid="button-toggle-preview"
            >
              <Eye className="w-3.5 h-3.5 mr-1.5" />
              {showPreview ? "Hide" : "Show"} Preview
            </Button>
          </div>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="w-full flex-wrap h-auto gap-1 bg-transparent p-0 mb-3">
            {tabItems.map((tab) => (
              <TabsTrigger key={tab.value} value={tab.value} className="text-xs px-2 py-1 data-[state=active]:bg-muted">
                {tab.value !== "global" && (
                  <span className="w-1.5 h-1.5 rounded-full mr-1" style={{ backgroundColor: AGENT_INFO[tab.value as AgentId]?.color }} />
                )}
                {tab.label}
              </TabsTrigger>
            ))}
          </TabsList>

          {tabItems.map((tab) => (
            <TabsContent key={tab.value} value={tab.value}>
              <div className="space-y-3">
                <div className="flex gap-2 items-end flex-wrap">
                  <div className="flex-1 min-w-[150px]">
                    <Label className="text-xs mb-1 block">Version Label</Label>
                    <Input
                      value={label}
                      onChange={(e) => setLabel(e.target.value)}
                      placeholder="e.g. v2-improved"
                      className="h-8 text-xs"
                      data-testid="input-prompt-label"
                    />
                  </div>
                  {latestPrompt && (
                    <Badge variant="secondary" className="text-[10px] mb-1">
                      Current: v{latestPrompt.version} ({latestPrompt.label})
                    </Badge>
                  )}
                </div>

                <div>
                  <Label className="text-xs mb-1 block">Prompt Content</Label>
                  <Textarea
                    value={content}
                    onChange={(e) => setContent(e.target.value)}
                    className="min-h-[200px] text-xs font-mono resize-none"
                    placeholder="Enter prompt template..."
                    data-testid="input-prompt-content"
                  />
                </div>

                <div className="flex gap-2">
                  <Button
                    size="sm"
                    onClick={() => saveMutation.mutate()}
                    disabled={!content.trim() || saveMutation.isPending}
                    data-testid="button-save-prompt"
                  >
                    <Save className="w-3.5 h-3.5 mr-1.5" />
                    Save Version
                  </Button>
                </div>
              </div>
            </TabsContent>
          ))}
        </Tabs>
      </Card>

      {showPreview && (
        <Card className="p-4">
          <h3 className="text-sm font-semibold mb-2">Compiled Preview</h3>
          <pre className="text-xs font-mono bg-muted/50 p-3 rounded-md whitespace-pre-wrap break-words leading-relaxed max-h-[300px] overflow-auto">
            {compiledPreview || "No content"}
          </pre>
        </Card>
      )}

      {currentPrompts.length > 1 && (
        <Card className="p-4">
          <h3 className="text-sm font-semibold mb-2 flex items-center gap-1.5">
            <History className="w-3.5 h-3.5" />
            Version History
          </h3>
          <div className="space-y-2">
            {currentPrompts.sort((a, b) => b.version - a.version).map((p) => (
              <div key={p.id} className="flex items-center justify-between gap-2 text-xs p-2 rounded-md bg-muted/30">
                <div className="flex items-center gap-2">
                  <Badge variant="secondary" className="text-[10px]">v{p.version}</Badge>
                  <span className="text-muted-foreground">{p.label}</span>
                  <span className="text-[10px] text-muted-foreground">{new Date(p.createdAt).toLocaleDateString()}</span>
                </div>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => {
                    setContent(p.content);
                    setLabel(p.label);
                  }}
                  data-testid={`button-rollback-${p.id}`}
                >
                  <Copy className="w-3 h-3 mr-1" />
                  Use
                </Button>
              </div>
            ))}
          </div>
        </Card>
      )}
    </div>
  );
}
