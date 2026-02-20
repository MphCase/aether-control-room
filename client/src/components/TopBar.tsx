import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/StatusBadge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Play, Pause, Square, SkipForward, Zap } from "lucide-react";
import type { RunStatus, Trigger } from "@shared/schema";

interface TopBarProps {
  roomName: string;
  userName: string;
  runStatus: RunStatus;
  currentRound: number;
  maxRounds: number;
  triggers: Trigger[];
  selectedTriggerId?: string;
  onRun: () => void;
  onPause: () => void;
  onStop: () => void;
  onContinue: () => void;
  onTriggerSelect: (id: string) => void;
}

export function TopBar({
  roomName, userName, runStatus, currentRound, maxRounds,
  triggers, selectedTriggerId, onRun, onPause, onStop, onContinue, onTriggerSelect,
}: TopBarProps) {
  const isRunning = runStatus === "running";
  const isPaused = runStatus === "paused";
  const canRun = runStatus === "idle" || runStatus === "done" || runStatus === "error";

  return (
    <header className="sticky top-0 z-50 flex items-center justify-between gap-4 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 px-4 py-2" data-testid="topbar">
      <div className="flex items-center gap-3 min-w-0">
        <div className="flex items-center gap-2">
          <Zap className="w-5 h-5 text-primary shrink-0" />
          <h1 className="text-sm font-semibold tracking-tight truncate" data-testid="text-room-name">{roomName || "Aether Control Room"}</h1>
        </div>
        <span className="text-xs text-muted-foreground hidden sm:inline">by {userName || "—"}</span>
        <StatusBadge status={runStatus} />
        {(isRunning || isPaused) && (
          <span className="text-xs font-mono text-muted-foreground" data-testid="text-round-indicator">
            Round {currentRound}/{maxRounds}
          </span>
        )}
      </div>

      <div className="flex items-center gap-2 shrink-0">
        {triggers.length > 0 && (
          <Select value={selectedTriggerId || ""} onValueChange={onTriggerSelect}>
            <SelectTrigger className="w-[140px] h-9" data-testid="select-trigger-preset">
              <SelectValue placeholder="Preset" />
            </SelectTrigger>
            <SelectContent>
              {triggers.map((t) => (
                <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}

        <div className="flex items-center gap-1">
          <Button
            size="sm"
            onClick={onRun}
            disabled={!canRun}
            data-testid="button-run"
          >
            <Play className="w-3.5 h-3.5 mr-1" />
            Run
          </Button>
          <Button
            size="icon"
            variant="outline"
            onClick={onPause}
            disabled={!isRunning}
            data-testid="button-pause"
          >
            <Pause className="w-3.5 h-3.5" />
          </Button>
          <Button
            size="icon"
            variant="outline"
            onClick={onStop}
            disabled={!isRunning && !isPaused}
            data-testid="button-stop"
          >
            <Square className="w-3.5 h-3.5" />
          </Button>
          <Button
            size="icon"
            variant="outline"
            onClick={onContinue}
            disabled={runStatus !== "done"}
            data-testid="button-continue"
          >
            <SkipForward className="w-3.5 h-3.5" />
          </Button>
        </div>
      </div>
    </header>
  );
}
