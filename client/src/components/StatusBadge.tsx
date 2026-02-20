import { Badge } from "@/components/ui/badge";
import type { RunStatus } from "@shared/schema";

const statusConfig: Record<RunStatus, { label: string; dotColor: string; variant: "default" | "secondary" | "outline" | "destructive" }> = {
  idle: { label: "Idle", dotColor: "rgb(156, 163, 175)", variant: "secondary" },
  running: { label: "Running", dotColor: "#0070F3", variant: "outline" },
  paused: { label: "Paused", dotColor: "#FF6B00", variant: "outline" },
  done: { label: "Done", dotColor: "#00C853", variant: "secondary" },
  error: { label: "Error", dotColor: "hsl(0, 84%, 45%)", variant: "destructive" },
};

interface StatusBadgeProps {
  status: RunStatus;
  size?: "sm" | "default";
}

export function StatusBadge({ status, size = "default" }: StatusBadgeProps) {
  const config = statusConfig[status];
  const dotSize = size === "sm" ? "w-1.5 h-1.5" : "w-2 h-2";

  return (
    <Badge variant={config.variant} data-testid={`badge-status-${status}`} className="gap-1.5">
      <span
        className={`${dotSize} rounded-full inline-block shrink-0`}
        style={{ backgroundColor: config.dotColor }}
      />
      {status === "running" && (
        <span
          className={`${dotSize} rounded-full inline-block shrink-0 absolute animate-ping opacity-75`}
          style={{ backgroundColor: config.dotColor }}
        />
      )}
      <span className="relative">{config.label}</span>
    </Badge>
  );
}
