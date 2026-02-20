import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { Checkbox } from "@/components/ui/checkbox";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Plus, Trash2 } from "lucide-react";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { AGENT_IDS } from "@shared/schema";
import { AGENT_INFO, DEFAULT_RUN_CONFIG } from "@/lib/constants";
import type { Trigger, AgentId, RunConfig } from "@shared/schema";

export function AdminTriggers() {
  const [name, setName] = useState("");
  const [config, setConfig] = useState<RunConfig>({ ...DEFAULT_RUN_CONFIG });

  const { data: triggers = [], isLoading } = useQuery<Trigger[]>({
    queryKey: ["/api/triggers"],
  });

  const createMutation = useMutation({
    mutationFn: async () => {
      await apiRequest("POST", "/api/triggers", {
        name,
        configJson: config,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/triggers"] });
      setName("");
      setConfig({ ...DEFAULT_RUN_CONFIG });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      await apiRequest("DELETE", `/api/triggers/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/triggers"] });
    },
  });

  const toggleAgent = (agentId: AgentId) => {
    const enabled = config.enabledAgents.includes(agentId)
      ? config.enabledAgents.filter((a) => a !== agentId)
      : [...config.enabledAgents, agentId];
    setConfig({ ...config, enabledAgents: enabled });
  };

  return (
    <div className="space-y-4">
      <Card className="p-4">
        <h3 className="text-sm font-semibold mb-3">Create Trigger Preset</h3>
        <div className="space-y-3">
          <div>
            <Label className="text-xs mb-1 block">Preset Name</Label>
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Quick Research, Deep Analysis"
              className="h-9"
              data-testid="input-trigger-name"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <div className="flex items-center justify-between mb-1">
                <Label className="text-xs">Rounds</Label>
                <span className="text-xs font-mono text-muted-foreground">{config.rounds}</span>
              </div>
              <Slider
                min={1} max={10} step={1}
                value={[config.rounds]}
                onValueChange={([v]) => setConfig({ ...config, rounds: v })}
              />
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label className="text-xs">Always Latest</Label>
                <Switch
                  checked={config.alwaysLatest}
                  onCheckedChange={(v) => setConfig({ ...config, alwaysLatest: v })}
                />
              </div>
              <div className="flex items-center justify-between">
                <Label className="text-xs">Citations</Label>
                <Switch
                  checked={config.citationsRequired}
                  onCheckedChange={(v) => setConfig({ ...config, citationsRequired: v })}
                />
              </div>
            </div>
          </div>

          <div>
            <Label className="text-xs mb-1.5 block">Enabled Agents</Label>
            <div className="flex flex-wrap gap-2">
              {AGENT_IDS.filter(a => a !== "coordinator").map((agentId) => (
                <div key={agentId} className="flex items-center gap-1.5">
                  <Checkbox
                    id={`trigger-agent-${agentId}`}
                    checked={config.enabledAgents.includes(agentId)}
                    onCheckedChange={() => toggleAgent(agentId)}
                  />
                  <label htmlFor={`trigger-agent-${agentId}`} className="text-xs cursor-pointer flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: AGENT_INFO[agentId].color }} />
                    {AGENT_INFO[agentId].label}
                  </label>
                </div>
              ))}
            </div>
          </div>

          <Button
            size="sm"
            onClick={() => createMutation.mutate()}
            disabled={!name.trim() || createMutation.isPending}
            data-testid="button-create-trigger"
          >
            <Plus className="w-3.5 h-3.5 mr-1.5" />
            Create Preset
          </Button>
        </div>
      </Card>

      <Card>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="text-xs">Name</TableHead>
              <TableHead className="text-xs">Config</TableHead>
              <TableHead className="text-xs text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={3} className="text-center text-sm text-muted-foreground py-8">Loading...</TableCell>
              </TableRow>
            ) : triggers.length === 0 ? (
              <TableRow>
                <TableCell colSpan={3} className="text-center text-sm text-muted-foreground py-8">No presets yet</TableCell>
              </TableRow>
            ) : (
              triggers.map((trigger) => {
                const tc = trigger.configJson as RunConfig | null;
                return (
                  <TableRow key={trigger.id} data-testid={`row-trigger-${trigger.id}`}>
                    <TableCell className="text-sm font-medium">{trigger.name}</TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-1">
                        {tc && (
                          <>
                            <Badge variant="secondary" className="text-[10px]">{tc.rounds} rounds</Badge>
                            {tc.alwaysLatest && <Badge variant="secondary" className="text-[10px]">Latest</Badge>}
                            {tc.citationsRequired && <Badge variant="secondary" className="text-[10px]">Citations</Badge>}
                          </>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        size="icon"
                        variant="ghost"
                        onClick={() => deleteMutation.mutate(trigger.id)}
                        data-testid={`button-delete-trigger-${trigger.id}`}
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </Button>
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </Card>
    </div>
  );
}
