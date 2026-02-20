import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { Checkbox } from "@/components/ui/checkbox";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import {
  MessageSquare, Plus, Search, Settings2, Users, Archive,
} from "lucide-react";
import type { Room, User, RunConfig, AgentId } from "@shared/schema";
import { AGENT_IDS } from "@shared/schema";
import { AGENT_INFO } from "@/lib/constants";

interface LeftSidebarProps {
  rooms: Room[];
  users: User[];
  activeRoomId: string | null;
  activeUserId: string | null;
  runConfig: RunConfig;
  onSelectRoom: (id: string) => void;
  onCreateRoom: (name: string) => void;
  onSelectUser: (id: string) => void;
  onConfigChange: (config: RunConfig) => void;
  onOpenPromptDrawer: () => void;
}

export function LeftSidebar({
  rooms, users, activeRoomId, activeUserId, runConfig,
  onSelectRoom, onCreateRoom, onSelectUser, onConfigChange, onOpenPromptDrawer,
}: LeftSidebarProps) {
  const [search, setSearch] = useState("");
  const [newRoomName, setNewRoomName] = useState("");

  const filteredRooms = rooms.filter((r) =>
    !r.archived && r.name.toLowerCase().includes(search.toLowerCase())
  );

  const handleCreateRoom = () => {
    if (newRoomName.trim()) {
      onCreateRoom(newRoomName.trim());
      setNewRoomName("");
    }
  };

  const toggleAgent = (agentId: AgentId) => {
    const enabled = runConfig.enabledAgents.includes(agentId)
      ? runConfig.enabledAgents.filter((a) => a !== agentId)
      : [...runConfig.enabledAgents, agentId];
    onConfigChange({ ...runConfig, enabledAgents: enabled });
  };

  return (
    <div className="flex flex-col h-full bg-sidebar text-sidebar-foreground">
      <div className="p-3 border-b border-sidebar-border">
        <div className="flex items-center gap-2 mb-2">
          <MessageSquare className="w-4 h-4 text-primary" />
          <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Rooms</span>
        </div>
        <div className="relative">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
          <Input
            placeholder="Search rooms..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-8 h-8 text-xs bg-sidebar"
            data-testid="input-search-rooms"
          />
        </div>
      </div>

      <ScrollArea className="flex-1">
        <div className="p-2 space-y-0.5">
          {filteredRooms.map((room) => (
            <Button
              key={room.id}
              variant="ghost"
              className={`w-full justify-start text-xs h-8 px-2 ${activeRoomId === room.id ? "bg-sidebar-accent text-sidebar-accent-foreground" : ""}`}
              onClick={() => onSelectRoom(room.id)}
              data-testid={`button-room-${room.id}`}
            >
              <MessageSquare className="w-3.5 h-3.5 mr-2 shrink-0" />
              <span className="truncate">{room.name}</span>
            </Button>
          ))}
        </div>

        <div className="p-2">
          <div className="flex gap-1">
            <Input
              placeholder="New room..."
              value={newRoomName}
              onChange={(e) => setNewRoomName(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleCreateRoom()}
              className="h-8 text-xs flex-1"
              data-testid="input-new-room"
            />
            <Button size="icon" variant="ghost" onClick={handleCreateRoom} className="shrink-0" data-testid="button-create-room">
              <Plus className="w-3.5 h-3.5" />
            </Button>
          </div>
        </div>

        <Separator className="my-1" />

        <div className="p-3">
          <div className="flex items-center gap-2 mb-2">
            <Users className="w-4 h-4 text-primary" />
            <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Active User</span>
          </div>
          <div className="space-y-0.5">
            {users.filter(u => !u.disabled).map((user) => (
              <Button
                key={user.id}
                variant="ghost"
                className={`w-full justify-start text-xs h-8 px-2 ${activeUserId === user.id ? "bg-sidebar-accent text-sidebar-accent-foreground" : ""}`}
                onClick={() => onSelectUser(user.id)}
                data-testid={`button-user-${user.id}`}
              >
                <span className="w-5 h-5 rounded-full bg-primary/10 text-primary flex items-center justify-center text-[10px] font-semibold mr-2 shrink-0">
                  {user.name.charAt(0).toUpperCase()}
                </span>
                <span className="truncate">{user.name}</span>
                <span className="ml-auto text-[10px] text-muted-foreground">{user.role}</span>
              </Button>
            ))}
          </div>
        </div>

        <Separator className="my-1" />

        <div className="p-3">
          <div className="flex items-center gap-2 mb-3">
            <Settings2 className="w-4 h-4 text-primary" />
            <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Run Settings</span>
          </div>

          <div className="space-y-4">
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <Label className="text-xs">Rounds</Label>
                <span className="text-xs font-mono text-muted-foreground">{runConfig.rounds}</span>
              </div>
              <Slider
                min={1}
                max={10}
                step={1}
                value={[runConfig.rounds]}
                onValueChange={([v]) => onConfigChange({ ...runConfig, rounds: v })}
                data-testid="slider-rounds"
              />
            </div>

            <div className="flex items-center justify-between">
              <Label className="text-xs">Always Latest</Label>
              <Switch
                checked={runConfig.alwaysLatest}
                onCheckedChange={(v) => onConfigChange({ ...runConfig, alwaysLatest: v })}
                data-testid="switch-always-latest"
              />
            </div>

            <div className="flex items-center justify-between">
              <Label className="text-xs">Citations Required</Label>
              <Switch
                checked={runConfig.citationsRequired}
                onCheckedChange={(v) => onConfigChange({ ...runConfig, citationsRequired: v })}
                data-testid="switch-citations"
              />
            </div>

            <div>
              <Label className="text-xs mb-2 block">Agents</Label>
              <div className="space-y-1.5">
                {AGENT_IDS.filter(a => a !== "coordinator").map((agentId) => (
                  <div key={agentId} className="flex items-center gap-2">
                    <Checkbox
                      id={`agent-${agentId}`}
                      checked={runConfig.enabledAgents.includes(agentId)}
                      onCheckedChange={() => toggleAgent(agentId)}
                      data-testid={`checkbox-agent-${agentId}`}
                    />
                    <label htmlFor={`agent-${agentId}`} className="text-xs cursor-pointer flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: AGENT_INFO[agentId].color }} />
                      {AGENT_INFO[agentId].label}
                    </label>
                  </div>
                ))}
              </div>
            </div>

            <Button variant="outline" size="sm" className="w-full text-xs" onClick={onOpenPromptDrawer} data-testid="button-open-prompt-drawer">
              <Settings2 className="w-3.5 h-3.5 mr-1.5" />
              Prompt Drawer
            </Button>
          </div>
        </div>
      </ScrollArea>
    </div>
  );
}
